export type MessageRole = 'user' | 'assistant';

export type ChatErrorCode =
  | 'timeout'
  | 'overloaded'
  | 'rate_limit'
  | 'internal'
  | 'network';

/** Structured attachment rendered beneath an assistant message. Each command
 *  produces a card; the data is pulled from the mock layer at render time, so
 *  the card only needs to carry its type. */
export type ChatCardType =
  | 'sitemap'
  | 'commands'
  | 'alerts'
  | 'farmStatus'
  | 'weather';

export type ChatCard = { type: ChatCardType };

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  isError?: boolean;
  /** Optional structured attachment (sitemap, etc.). */
  card?: ChatCard;
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
