/**
 * Assistant transport. The chat UI talks to the backend orchestrator
 * (`POST /assistant/chat`), which understands the message, calls the right
 * HTTP tool, and returns `{ intent, reply_key, tool, data }`. We map that to a
 * `ChatReply` the UI renders.
 *
 * If the backend is unreachable (offline / not-yet-deployed), we transparently
 * fall back to the local mock engine so the assistant always responds — and it
 * automatically uses real data the moment the backend is live.
 */
import api from '@/app/lib/api';
import { routeMockReply } from './mockEngine';
import { SITEMAP_ROUTES } from './siteRoutes';
import {
  MOCK_ALERTS,
  MOCK_FARM_STATUS,
  MOCK_WEATHER,
  MOCK_ZONES,
} from './mockData';
import type { ChatCardType } from './types';

export interface ChatReply {
  /** i18n key for the reply text (rule-based path). */
  replyKey?: string;
  values?: Record<string, string>;
  /** Free-text reply from the LLM, when present (takes precedence over replyKey). */
  text?: string;
  card?: { type: ChatCardType; data?: unknown };
  action?: 'clear';
  /** Stream the reply text token-by-token (free-text answers) vs. render instantly (cards). */
  stream: boolean;
  source: 'backend' | 'mock';
}

/** Backend intent → UI card type (rule-based path). */
const INTENT_TO_CARD: Record<string, ChatCardType | undefined> = {
  sitemap: 'sitemap',
  commands: 'commands',
  active_alerts: 'alerts',
  farm_status: 'farmStatus',
  weather: 'weather',
  zones: 'zones',
};

/** Tool name → UI card type (LLM path, where intent is just "llm"). */
const TOOL_TO_CARD: Record<string, ChatCardType | undefined> = {
  get_sitemap: 'sitemap',
  get_active_alerts: 'alerts',
  get_farm_status: 'farmStatus',
  get_weather: 'weather',
  list_zones: 'zones',
  get_zone_detail: 'zones',
};

interface AssistantApiResponse {
  intent: string;
  reply_key: string | null;
  reply: string | null;
  tool: string | null;
  data: unknown;
}

export async function requestAssistant(
  message: string,
  opts: { zoneId?: number; context?: string } = {}
): Promise<ChatReply> {
  try {
    const { data } = await api.post<AssistantApiResponse>('/assistant/chat', {
      message,
      zone_id: opts.zoneId,
      context: opts.context,
    });
    if (data.intent === 'clear') {
      return {
        replyKey: data.reply_key ?? undefined,
        action: 'clear',
        stream: false,
        source: 'backend',
      };
    }
    const text = data.reply?.trim() || undefined;
    const cardType =
      INTENT_TO_CARD[data.intent] ??
      (data.tool ? TOOL_TO_CARD[data.tool] : undefined);
    if (cardType) {
      return {
        replyKey: data.reply_key ?? undefined,
        text,
        card: { type: cardType, data: data.data },
        stream: false,
        source: 'backend',
      };
    }
    // Free-text answer (LLM smalltalk or rule-based generic) — stream it.
    return {
      replyKey: data.reply_key ?? undefined,
      text,
      stream: true,
      source: 'backend',
    };
  } catch {
    return mockFallback(message);
  }
}

function mockDataFor(type: ChatCardType): unknown {
  switch (type) {
    case 'sitemap':
      return { routes: SITEMAP_ROUTES };
    case 'alerts':
      return MOCK_ALERTS;
    case 'farmStatus':
      return MOCK_FARM_STATUS;
    case 'weather':
      return MOCK_WEATHER;
    case 'zones':
      return MOCK_ZONES;
    default:
      return undefined; // 'commands' renders from frontend metadata
  }
}

function mockFallback(message: string): ChatReply {
  const r = routeMockReply(message);
  return {
    replyKey: r.replyKey,
    values: r.values,
    card: r.card
      ? { type: r.card.type, data: mockDataFor(r.card.type) }
      : undefined,
    action: r.action,
    stream: r.stream,
    source: 'mock',
  };
}
