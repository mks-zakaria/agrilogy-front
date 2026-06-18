/**
 * Mock chat backend.
 *
 * Stand-in for the real assistant API so the whole chat experience — every
 * command, card and the streaming feel — can be exercised before a backend
 * exists. Swapping in the real service later means replacing `streamReply`
 * (and wiring real data into the cards) only.
 *
 * `routeMockReply` is PURE (no next-intl / React imports) so it is unit-testable
 * in jest, which can't parse the next-intl ESM. It returns an i18n key + an
 * optional card type; the React layer resolves the key and renders the card.
 */
import type { ChatCard, ChatCardType } from './types';

export type ChatAction = 'clear';

export interface MockResult {
  /** i18n key whose resolved string is the assistant's textual reply. */
  replyKey: string;
  /** Interpolation values passed to the i18n lookup. */
  values?: Record<string, string>;
  /** Structured attachment rendered after the text. */
  card?: ChatCard;
  /** Whether to simulate token streaming (false = instant, e.g. commands). */
  stream: boolean;
  /** The command that matched, if any. */
  command?: string;
  /** A side-effect the chat context should perform instead of replying. */
  action?: ChatAction;
}

interface CommandDef {
  name: string;
  /** Slash form shown in /help and the slash menu. */
  slash: string;
  /** i18n key for the one-line description. */
  descKey: string;
  /** Lowercased triggers: slash forms + natural-language phrases. */
  triggers: string[];
  card?: ChatCardType;
  action?: ChatAction;
  /** i18n key for the leading text of the reply. */
  introKey: string;
}

/** The full command surface, also rendered by the /help card and slash menu. */
export const COMMANDS: CommandDef[] = [
  {
    name: 'sitemap',
    slash: '/sitemap',
    descKey: 'misc.chatbot.commands.sitemap',
    triggers: [
      '/sitemap',
      '/map',
      '/pages',
      'sitemap',
      'site map',
      'plan du site',
      'navigation',
      'خريطة الموقع',
    ],
    card: 'sitemap',
    introKey: 'misc.chatbot.sitemap.intro',
  },
  {
    name: 'help',
    slash: '/help',
    descKey: 'misc.chatbot.commands.help',
    triggers: [
      '/help',
      '/commands',
      '/aide',
      'help',
      'aide',
      'commandes',
      'مساعدة',
      'الأوامر',
    ],
    card: 'commands',
    introKey: 'misc.chatbot.commandsCard.intro',
  },
  {
    name: 'alerts',
    slash: '/alerts',
    descKey: 'misc.chatbot.commands.alerts',
    triggers: [
      '/alerts',
      '/alertes',
      'alerts',
      'alertes',
      'my alerts',
      'mes alertes',
      'تنبيهات',
    ],
    card: 'alerts',
    introKey: 'misc.chatbot.alertsCard.intro',
  },
  {
    name: 'status',
    slash: '/status',
    descKey: 'misc.chatbot.commands.status',
    triggers: [
      '/status',
      '/farm',
      '/etat',
      'farm status',
      'état de la ferme',
      'etat de la ferme',
      'حالة المزرعة',
    ],
    card: 'farmStatus',
    introKey: 'misc.chatbot.statusCard.intro',
  },
  {
    name: 'weather',
    slash: '/weather',
    descKey: 'misc.chatbot.commands.weather',
    triggers: [
      '/weather',
      '/meteo',
      '/météo',
      'weather',
      'météo',
      'meteo',
      'طقس',
    ],
    card: 'weather',
    introKey: 'misc.chatbot.weatherCard.intro',
  },
  {
    name: 'zones',
    slash: '/zones',
    descKey: 'misc.chatbot.commands.zones',
    triggers: [
      '/zones',
      '/zone',
      'zones',
      'my zones',
      'list zones',
      'mes zones',
      'liste des zones',
      'مناطق',
      'المناطق',
    ],
    card: 'zones',
    introKey: 'misc.chatbot.zonesCard.intro',
  },
  {
    name: 'soil',
    slash: '/soil',
    descKey: 'misc.chatbot.commands.soil',
    triggers: ['/soil', '/sol', 'soil', 'my soil', 'sol', 'التربة'],
    card: 'soil',
    introKey: 'misc.chatbot.soilCard.intro',
  },
  {
    name: 'plant',
    slash: '/plant',
    descKey: 'misc.chatbot.commands.plant',
    triggers: [
      '/plant',
      '/plante',
      'plant',
      'leaf',
      'canopy',
      'plante',
      'النبات',
    ],
    card: 'plant',
    introKey: 'misc.chatbot.plantCard.intro',
  },
  {
    name: 'water',
    slash: '/water',
    descKey: 'misc.chatbot.commands.water',
    triggers: ['/water', '/eau', 'water', 'irrigation water', 'eau', 'الماء'],
    card: 'water',
    introKey: 'misc.chatbot.waterCard.intro',
  },
  {
    name: 'clear',
    slash: '/clear',
    descKey: 'misc.chatbot.commands.clear',
    triggers: [
      '/clear',
      '/clr',
      '/effacer',
      'clear chat',
      'effacer la conversation',
    ],
    action: 'clear',
    introKey: 'misc.chatbot.cleared',
  },
];

/** Clickable starter prompts shown on the empty welcome screen. */
export const EXAMPLE_PROMPTS: { textKey: string; send: string }[] = [
  { textKey: 'misc.chatbot.examples.sitemap', send: '/sitemap' },
  { textKey: 'misc.chatbot.examples.alerts', send: '/alerts' },
  { textKey: 'misc.chatbot.examples.status', send: '/status' },
  { textKey: 'misc.chatbot.examples.weather', send: '/weather' },
  { textKey: 'misc.chatbot.examples.zones', send: '/zones' },
  { textKey: 'misc.chatbot.examples.soil', send: '/soil' },
  { textKey: 'misc.chatbot.examples.water', send: '/water' },
];

const norm = (s: string) => s.trim().toLowerCase();

function matchCommand(text: string): CommandDef | null {
  // 1) exact match or slash-prefix match
  for (const c of COMMANDS) {
    for (const trig of c.triggers) {
      if (text === trig) return c;
      if (trig.startsWith('/') && text.startsWith(trig)) return c;
    }
  }
  // 2) natural-language "contains" (guard against tiny tokens)
  for (const c of COMMANDS) {
    for (const trig of c.triggers) {
      if (!trig.startsWith('/') && trig.length >= 4 && text.includes(trig))
        return c;
    }
  }
  return null;
}

/**
 * Route a user message to a mock reply. Recognizes the full command surface
 * (slash + natural language, fr/en/ar); free text falls back to a generic
 * localized placeholder that nudges toward the commands.
 */
export function routeMockReply(latest: string): MockResult {
  const cmd = matchCommand(norm(latest));
  if (cmd) {
    return {
      replyKey: cmd.introKey,
      card: cmd.card ? { type: cmd.card } : undefined,
      action: cmd.action,
      stream: false,
      command: cmd.name,
    };
  }
  return { replyKey: 'misc.chatbot.mock.generic', stream: true };
}

/**
 * Simulate streaming a fully-resolved reply string to `onChunk`. Command
 * results land at once (`instant`); free text is emitted word-by-word to mimic
 * a live model. Honors the abort signal so "stop" works like a real stream.
 */
export async function streamReply(
  text: string,
  onChunk: (chunk: string) => void,
  signal: AbortSignal,
  opts: { instant?: boolean } = {}
): Promise<void> {
  if (opts.instant) {
    if (!signal.aborted) onChunk(text);
    return;
  }

  const tokens = text.split(/(\s+)/);
  for (const token of tokens) {
    if (signal.aborted) return;
    await new Promise((resolve) => setTimeout(resolve, 18));
    if (signal.aborted) return;
    onChunk(token);
  }
}
