'use client';
/**
 * Shared chat state for the whole app. Both the dedicated /chat page and the
 * global right-edge slide-out consume this one context, so conversation
 * history stays unified no matter where you type.
 *
 * Replies come from the mock engine today; swapping in a real backend means
 * changing `mockEngine` + `chatHistoryStorage` only — this context's API is
 * the seam.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { pageKeyFromPath } from './siteRoutes';
import { loadConversations, saveConversations } from './chatHistoryStorage';
import {
  fetchServerConversations,
  pushConversation,
  removeServerConversation,
} from './conversationApi';
import { routeMockReply, streamReply } from './mockEngine';
import { requestAssistant } from './chatService';
import type { ChatCard, Conversation, Message, MessageRating } from './types';

interface ChatContextValue {
  conversations: Conversation[];
  activeId: string | null;
  activeConversation: Conversation | null;
  streaming: boolean;
  newConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  sendMessage: (text: string) => void;
  rateMessage: (messageId: string, rating: MessageRating) => void;
  stop: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hydrated = useRef(false);

  // Hydrate on mount: prefer the server (cross-device), fall back to
  // localStorage offline. On first server load, migrate any local-only
  // conversations up so nothing is lost.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = loadConversations();
      // Unauthenticated (e.g. the /login page, where this global provider is
      // also mounted): don't hit the API at all — a 401 would trip the axios
      // interceptor's redirect-to-login and reload-loop the login page.
      const server = localStorage.getItem('accessToken')
        ? await fetchServerConversations()
        : null;
      if (cancelled) return;
      let initial = local;
      if (server === null) {
        initial = local; // offline / unauth → local only
      } else if (server.length === 0 && local.length > 0) {
        initial = local;
        local.forEach((c) => void pushConversation(c)); // migrate up
      } else {
        initial = server;
      }
      setConversations(initial);
      setActiveId(initial[0]?.id ?? null);
      hydrated.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Write-through cache to localStorage on every change (after hydration).
  useEffect(() => {
    if (hydrated.current) saveConversations(conversations);
  }, [conversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  // Sync the active conversation to the server, debounced, once a turn settles
  // (not on every streamed token).
  useEffect(() => {
    if (!hydrated.current || streaming || !activeConversation) return;
    const snapshot = activeConversation;
    const handle = setTimeout(() => void pushConversation(snapshot), 700);
    return () => clearTimeout(handle);
  }, [activeConversation, streaming]);

  const newConversation = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
  }, []);

  const selectConversation = useCallback((id: string) => {
    abortRef.current?.abort();
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      void removeServerConversation(id);
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (id === activeId) setActiveId(next[0]?.id ?? null);
        return next;
      });
    },
    [activeId]
  );

  // Patch the most recent message of a conversation.
  const patchLastMessage = useCallback(
    (convId: string, patch: (m: Message) => Message) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId || c.messages.length === 0) return c;
          const messages = [...c.messages];
          messages[messages.length - 1] = patch(messages[messages.length - 1]);
          return { ...c, messages, updatedAt: new Date() };
        })
      );
    },
    []
  );

  const sendMessage = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || streaming) return;

      // /clear is a pure client action — wipe the active conversation locally,
      // no round-trip needed. (The backend also recognizes it for offline parity.)
      if (routeMockReply(text).action === 'clear') {
        if (activeId) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeId
                ? { ...c, messages: [], updatedAt: new Date() }
                : c
            )
          );
        }
        return;
      }

      const now = new Date();
      const userMsg: Message = {
        id: uuid(),
        role: 'user',
        content: text,
        timestamp: now,
      };
      const assistantMsg: Message = {
        id: uuid(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      // Resolve (or create) the conversation we're appending to. Decide the id
      // UP FRONT — never inside the setConversations updater, which React does
      // not run synchronously. Reading an updater-assigned id on the next line
      // is a race: for the first message of a brand-new conversation it would
      // still be null, so setActiveId(null) left the thread on the welcome
      // screen and the reply + its card were patched onto a null id and
      // silently dropped (notably under RTL, where render timing loses the race).
      const isNew = !activeId;
      const targetId = activeId ?? uuid();
      setConversations((prev) => {
        if (!isNew && prev.some((c) => c.id === targetId)) {
          return prev.map((c) =>
            c.id === targetId
              ? {
                  ...c,
                  messages: [...c.messages, userMsg, assistantMsg],
                  updatedAt: now,
                }
              : c
          );
        }
        // New conversation: title from the first user message.
        const title = text.length > 40 ? `${text.slice(0, 40).trim()}…` : text;
        const conv: Conversation = {
          id: targetId,
          title,
          messages: [userMsg, assistantMsg],
          createdAt: now,
          updatedAt: now,
        };
        return [conv, ...prev];
      });
      if (isNew) setActiveId(targetId);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      // Ask the backend orchestrator (falls back to the local mock on failure),
      // then stream the resolved reply text and attach any card. Pass the page
      // the user is on so the assistant can answer contextually ("analyze this
      // page") and pick the right tool for that screen.
      requestAssistant(text, {
        context: pageKeyFromPath(pathname) ?? undefined,
      })
        .then((reply) => {
          if (controller.signal.aborted) return undefined;
          const replyText = reply.text
            ? reply.text
            : reply.replyKey
              ? t(reply.replyKey, reply.values)
              : '';
          const card: ChatCard | undefined = reply.card;
          return streamReply(
            replyText,
            (chunk) =>
              patchLastMessage(targetId, (m) =>
                m.role === 'assistant'
                  ? { ...m, content: m.content + chunk }
                  : m
              ),
            controller.signal,
            { instant: !reply.stream }
          ).then(() => {
            if (card) {
              patchLastMessage(targetId, (m) =>
                m.role === 'assistant' ? { ...m, card } : m
              );
            }
          });
        })
        .finally(() => {
          // Drop a never-filled assistant bubble if the send was aborted early.
          if (controller.signal.aborted) {
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== targetId) return c;
                const last = c.messages[c.messages.length - 1];
                if (last?.role === 'assistant' && !last.content.trim()) {
                  return { ...c, messages: c.messages.slice(0, -1) };
                }
                return c;
              })
            );
          }
          setStreaming(false);
        });
    },
    [activeId, streaming, t, patchLastMessage, pathname]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  // Thumbs up/down on an assistant reply; toggles off if the same is re-clicked.
  // The change flows through the debounced server sync.
  const rateMessage = useCallback(
    (messageId: string, rating: MessageRating) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId
                ? { ...m, rating: m.rating === rating ? undefined : rating }
                : m
            ),
            updatedAt: new Date(),
          };
        })
      );
    },
    [activeId]
  );

  const value: ChatContextValue = {
    conversations,
    activeId,
    activeConversation,
    streaming,
    newConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    rateMessage,
    stop,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}
