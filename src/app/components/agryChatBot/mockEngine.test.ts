import {
  routeMockReply,
  streamReply,
  COMMANDS,
  EXAMPLE_PROMPTS,
} from './mockEngine';

describe('routeMockReply', () => {
  it.each([
    ['/sitemap', 'sitemap', 'sitemap'],
    ['/help', 'help', 'commands'],
    ['/alerts', 'alerts', 'alerts'],
    ['/status', 'status', 'farmStatus'],
    ['/weather', 'weather', 'weather'],
    ['/zones', 'zones', 'zones'],
    ['/soil', 'soil', 'soil'],
    ['/plant', 'plant', 'plant'],
    ['/water', 'water', 'water'],
  ])(
    'routes %s to command %s with its card (instant)',
    (input, command, card) => {
      const r = routeMockReply(input);
      expect(r.command).toBe(command);
      expect(r.card).toEqual({ type: card });
      expect(r.stream).toBe(false);
    }
  );

  it('routes /clear to a clear action with no card', () => {
    const r = routeMockReply('/clear');
    expect(r.command).toBe('clear');
    expect(r.action).toBe('clear');
    expect(r.card).toBeUndefined();
  });

  it.each([
    ['show me the site map', 'sitemap'],
    ['plan du site', 'sitemap'],
    ['what are my alertes', 'alerts'],
    ['météo', 'weather'],
    ['mes zones', 'zones'],
    ['list zones', 'zones'],
    ['how is my soil today', 'soil'],
    ['leaf temperature', 'plant'],
    ['water status', 'water'],
    ['خريطة الموقع', 'sitemap'],
  ])('recognizes natural language: %s', (input, command) => {
    expect(routeMockReply(input).command).toBe(command);
  });

  it('falls back to a generic streamed reply otherwise', () => {
    const r = routeMockReply('tell me a joke');
    expect(r.command).toBeUndefined();
    expect(r.card).toBeUndefined();
    expect(r.stream).toBe(true);
    expect(r.replyKey).toBe('misc.chatbot.mock.generic');
  });
});

describe('command registry', () => {
  it('every command has a slash form, description key and intro key', () => {
    for (const c of COMMANDS) {
      expect(c.slash.startsWith('/')).toBe(true);
      expect(c.descKey).toMatch(/^misc\.chatbot\./);
      expect(c.introKey).toMatch(/^misc\.chatbot\./);
    }
  });

  it('every example prompt resolves to a known command or generic', () => {
    for (const ex of EXAMPLE_PROMPTS) {
      expect(typeof ex.send).toBe('string');
      expect(ex.textKey).toMatch(/^misc\.chatbot\.examples\./);
    }
  });
});

describe('streamReply', () => {
  it('emits the whole text at once in instant mode', async () => {
    const chunks: string[] = [];
    const ctrl = new AbortController();
    await streamReply('hello world', (c) => chunks.push(c), ctrl.signal, {
      instant: true,
    });
    expect(chunks.join('')).toBe('hello world');
    expect(chunks).toHaveLength(1);
  });

  it('emits nothing once aborted', async () => {
    const chunks: string[] = [];
    const ctrl = new AbortController();
    ctrl.abort();
    await streamReply('hello world', (c) => chunks.push(c), ctrl.signal);
    expect(chunks).toHaveLength(0);
  });

  it('streams the full text token-by-token when not aborted', async () => {
    const chunks: string[] = [];
    const ctrl = new AbortController();
    await streamReply('one two three', (c) => chunks.push(c), ctrl.signal);
    expect(chunks.join('')).toBe('one two three');
    expect(chunks.length).toBeGreaterThan(1);
  });
});
