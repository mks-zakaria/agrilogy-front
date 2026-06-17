// Runs after the test framework is loaded (setupFilesAfterEnv), so jest.* is
// available.

// DOM matchers (toBeInTheDocument, etc.) for component tests.
import '@testing-library/jest-dom';

// Globally stub next-intl — it ships ESM that jest can't parse and
// its hooks need a provider; a passthrough lets component tests render without
// per-file mocks or an i18n context.
jest.mock('next-intl', () => {
  const translate = Object.assign((key) => key, {
    has: () => true,
    rich: (key) => key,
    markup: (key) => key,
    raw: (key) => key,
  });
  return {
    useTranslations: () => translate,
    useLocale: () => 'fr',
    useFormatter: () => ({
      dateTime: (v) => String(v),
      number: (v) => String(v),
      relativeTime: (v) => String(v),
      list: (v) => String(v),
    }),
    useNow: () => new Date(0),
    useTimeZone: () => 'UTC',
    useMessages: () => ({}),
    NextIntlClientProvider: ({ children }) => children,
  };
});
