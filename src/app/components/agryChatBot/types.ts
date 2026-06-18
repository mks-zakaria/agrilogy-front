export type MessageRole = 'user' | 'assistant';

export type ChatErrorCode =
  | 'timeout'
  | 'overloaded'
  | 'rate_limit'
  | 'internal'
  | 'network';

/** Structured attachment rendered beneath an assistant message. Each tool/
 *  command produces a card type; `data` is the payload returned by the backend
 *  tool (or the mock fallback) and is what the card renders. */
export type ChatCardType =
  | 'sitemap'
  | 'commands'
  | 'alerts'
  | 'farmStatus'
  | 'weather';

export type ChatCard = { type: ChatCardType; data?: unknown };

export type MessageRating = 'up' | 'down';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  isError?: boolean;
  /** Optional structured attachment (sitemap, etc.). */
  card?: ChatCard;
  /** User feedback on an assistant reply (thumbs up/down). */
  rating?: MessageRating;
  timestamp: Date;
}

/** A persisted conversation thread shown in the assistant's history. */
export interface Conversation {
  id: string;
  /** Derived from the first user message; falls back to a localized default. */
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
