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
import { MOCK_ALERTS, MOCK_FARM_STATUS, MOCK_WEATHER } from './mockData';
import type { ChatCardType } from './types';

export interface ChatReply {
  replyKey: string;
  values?: Record<string, string>;
  card?: { type: ChatCardType; data?: unknown };
  action?: 'clear';
  /** Stream the reply text token-by-token (free-text answers) vs. render instantly (cards). */
  stream: boolean;
  source: 'backend' | 'mock';
}

/** Backend intent → UI card type. */
const INTENT_TO_CARD: Record<string, ChatCardType | undefined> = {
  sitemap: 'sitemap',
  commands: 'commands',
  active_alerts: 'alerts',
  farm_status: 'farmStatus',
  weather: 'weather',
};

interface AssistantApiResponse {
  intent: string;
  reply_key: string;
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
        replyKey: data.reply_key,
        action: 'clear',
        stream: false,
        source: 'backend',
      };
    }
    const cardType = INTENT_TO_CARD[data.intent];
    if (cardType) {
      return {
        replyKey: data.reply_key,
        card: { type: cardType, data: data.data },
        stream: false,
        source: 'backend',
      };
    }
    return { replyKey: data.reply_key, stream: true, source: 'backend' };
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
