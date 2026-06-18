/**
 * Server-side conversation sync (agri-api `/assistant/conversations`).
 *
 * All calls are best-effort: on any failure they resolve to a safe value
 * (`null` / no-op) so the assistant keeps working from `localStorage` offline.
 * `localStorage` stays the write-through cache; the server is the source of
 * truth for cross-device history.
 */
import api from '@/app/lib/api';
import type { Conversation, Message } from './types';

interface ServerMessage extends Omit<Message, 'timestamp'> {
  timestamp: string;
}
interface ServerConversation {
  id: string;
  title: string;
  messages: ServerMessage[];
  createdAt: string;
  updatedAt: string;
}

function revive(c: ServerConversation): Conversation {
  return {
    id: c.id,
    title: c.title,
    messages: (c.messages ?? []).map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  };
}

/** Fetch the caller's conversations, or null if the server is unreachable. */
export async function fetchServerConversations(): Promise<
  Conversation[] | null
> {
  try {
    const { data } = await api.get<ServerConversation[]>(
      '/assistant/conversations'
    );
    return Array.isArray(data) ? data.map(revive) : [];
  } catch {
    return null;
  }
}

/** Create/replace a conversation on the server (best-effort). */
export async function pushConversation(c: Conversation): Promise<void> {
  try {
    await api.put(`/assistant/conversations/${encodeURIComponent(c.id)}`, {
      title: c.title,
      messages: c.messages,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    });
  } catch {
    // offline / unauth — localStorage still holds it.
  }
}

/** Delete a conversation on the server (best-effort). */
export async function removeServerConversation(id: string): Promise<void> {
  try {
    await api.delete(`/assistant/conversations/${encodeURIComponent(id)}`);
  } catch {
    // ignore
  }
}
