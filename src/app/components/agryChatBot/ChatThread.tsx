'use client';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Box, Flex, Text, Textarea, useColorModeValue } from '@chakra-ui/react';
import { AgrilogyMessageBubble } from './MessageBubble';
import { SitemapCard } from './SitemapCard';
import {
  CommandsCard,
  AlertsCard,
  FarmStatusCard,
  WeatherCard,
} from './MockCards';
import { COMMANDS, EXAMPLE_PROMPTS } from './mockEngine';
import { useChat } from './ChatContext';
import type { ChatCardType } from './types';

const renderCard = (type: ChatCardType, onNavigate?: () => void) => {
  switch (type) {
    case 'sitemap':
      return <SitemapCard onNavigate={onNavigate} />;
    case 'commands':
      return <CommandsCard />;
    case 'alerts':
      return <AlertsCard />;
    case 'farmStatus':
      return <FarmStatusCard />;
    case 'weather':
      return <WeatherCard />;
    default:
      return null;
  }
};

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path
      d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface ChatThreadProps {
  /** Called when a sitemap link is followed (e.g. to close the slide-out). */
  onNavigate?: () => void;
  /** Focus the input on mount (slide-out opens). */
  autoFocus?: boolean;
  /** Sitemap route key of the page the assistant is opened on, for a
   *  per-page welcome greeting. Null/omitted → generic greeting. */
  pageContextKey?: string | null;
}

/**
 * The conversation surface: welcome state, message bubbles (+ sitemap cards),
 * typing indicator, and the input. Reads/writes the shared chat context, so it
 * behaves identically on the /chat page and in the global slide-out.
 */
export const ChatThread = ({
  onNavigate,
  autoFocus,
  pageContextKey,
}: ChatThreadProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const timeTag = locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'fr-FR';
  const { activeConversation, streaming, sendMessage, stop } = useChat();

  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = useMemo(
    () => activeConversation?.messages ?? [],
    [activeConversation]
  );
  const isTypingIndicator =
    streaming && messages[messages.length - 1]?.content === '';

  const panelBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const panelBorder = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const inputBorder = useColorModeValue('gray.200', 'gray.600');
  const inputFocus = useColorModeValue('green.500', 'green.400');
  const inputColor = useColorModeValue('gray.800', 'gray.100');
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');
  const sendBg = useColorModeValue('green.600', 'green.500');
  const sendHoverBg = useColorModeValue('green.700', 'green.400');
  const hintColor = useColorModeValue('gray.400', 'gray.500');
  const abortColor = useColorModeValue('gray.500', 'gray.400');
  const abortHoverColor = useColorModeValue('red.500', 'red.400');
  const scrollThumb = useColorModeValue('gray.300', 'gray.600');
  const asstBubbleBg = useColorModeValue('gray.100', 'gray.700');
  const asstBubbleText = useColorModeValue('gray.800', 'gray.100');
  const asstBubbleBorder = useColorModeValue('gray.200', 'gray.600');
  const timestampColor = useColorModeValue('gray.400', 'gray.500');
  const chipBg = useColorModeValue('white', 'gray.800');
  const chipBorder = useColorModeValue('green.200', 'green.700');
  const chipColor = useColorModeValue('green.700', 'green.300');
  const chipHover = useColorModeValue('green.600', 'green.200');
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuBorder = useColorModeValue('gray.200', 'gray.600');
  const menuHoverBg = useColorModeValue('green.50', 'gray.700');
  const menuSlash = useColorModeValue('green.600', 'green.300');
  const menuDesc = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (autoFocus) setTimeout(() => textareaRef.current?.focus(), 200);
  }, [autoFocus]);

  const canSend = !!input.trim() && !streaming;

  // Per-page greeting on the slide-out; generic everywhere else.
  const pageGreetingKey = pageContextKey
    ? `misc.chatbot.pageGreeting.${pageContextKey}`
    : null;
  const welcome =
    pageGreetingKey && t.has(pageGreetingKey)
      ? t(pageGreetingKey)
      : t('misc.chatbot.welcome');

  // Slash-command autocomplete: when the input is a "/query", offer matches.
  const slashQuery = input.startsWith('/')
    ? input.slice(1).toLowerCase()
    : null;
  const slashMatches =
    slashQuery !== null
      ? COMMANDS.filter((c) => c.slash.slice(1).startsWith(slashQuery))
      : [];
  const showSlashMenu =
    slashQuery !== null && slashMatches.length > 0 && !streaming;

  const runCommand = (slash: string) => {
    sendMessage(slash);
    setInput('');
    const el = textareaRef.current;
    if (el) el.style.height = 'auto';
  };

  const submit = () => {
    if (!canSend) return;
    sendMessage(input);
    setInput('');
    const el = textareaRef.current;
    if (el) el.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <Flex direction="column" h="100%" minH={0} bg={panelBg}>
      {/* Messages */}
      <Box
        flex={1}
        minH={0}
        overflowY="auto"
        px="14px"
        pt="14px"
        pb="8px"
        display="flex"
        flexDirection="column"
        gap="8px"
        sx={{
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': { width: '3px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: scrollThumb,
            borderRadius: '99px',
          },
        }}
      >
        {/* Welcome + clickable starter prompts (only on an empty thread) */}
        {messages.length === 0 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="flex-start"
            gap="10px"
          >
            <Box
              maxW="78%"
              px="13px"
              py="9px"
              bg={asstBubbleBg}
              color={asstBubbleText}
              border="1px solid"
              borderColor={asstBubbleBorder}
              borderRadius="12px 12px 12px 4px"
              fontSize="13.5px"
              lineHeight="1.55"
            >
              {welcome}
            </Box>
            <Flex wrap="wrap" gap="6px">
              {EXAMPLE_PROMPTS.map((ex) => (
                <Box
                  key={ex.send}
                  as="button"
                  type="button"
                  onClick={() => sendMessage(ex.send)}
                  px="10px"
                  py="6px"
                  fontSize="12px"
                  fontWeight={500}
                  borderRadius="999px"
                  border="1px solid"
                  borderColor={chipBorder}
                  color={chipColor}
                  bg={chipBg}
                  cursor="pointer"
                  transition="all 0.15s"
                  _hover={{ borderColor: chipHover, color: chipHover }}
                >
                  {t(ex.textKey)}
                </Box>
              ))}
            </Flex>
          </Box>
        )}

        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const showTyping =
            isLast && isTypingIndicator && msg.role === 'assistant';

          if (msg.card) {
            return (
              <Box
                key={msg.id}
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
              >
                {msg.content.trim() && (
                  <Text fontSize="13px" mb="6px" color={asstBubbleText}>
                    {msg.content}
                  </Text>
                )}
                <Box
                  maxW="92%"
                  px="13px"
                  py="10px"
                  bg={asstBubbleBg}
                  color={asstBubbleText}
                  border="1px solid"
                  borderColor={asstBubbleBorder}
                  borderRadius="12px 12px 12px 4px"
                >
                  {renderCard(msg.card.type, onNavigate)}
                </Box>
                <Text
                  fontSize="10px"
                  color={timestampColor}
                  fontFamily="mono"
                  px="4px"
                  mt="3px"
                >
                  {msg.timestamp.toLocaleTimeString(timeTag, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Box>
            );
          }

          return (
            <AgrilogyMessageBubble
              key={msg.id}
              message={msg}
              isTyping={showTyping}
            />
          );
        })}
        <div ref={endRef} />
      </Box>

      {/* Input */}
      <Box
        px="12px"
        pt="10px"
        pb="12px"
        borderTop="1px solid"
        borderColor={panelBorder}
        bg={headerBg}
        flexShrink={0}
        display="flex"
        flexDirection="column"
        gap="6px"
        position="relative"
      >
        {/* Slash-command menu */}
        {showSlashMenu && (
          <Box
            position="absolute"
            bottom="100%"
            left="12px"
            right="12px"
            mb="6px"
            bg={menuBg}
            border="1px solid"
            borderColor={menuBorder}
            borderRadius="10px"
            boxShadow="0 6px 20px rgba(33,43,54,0.16)"
            overflow="hidden"
            zIndex={5}
          >
            {slashMatches.map((c) => (
              <Box
                key={c.name}
                as="button"
                type="button"
                onClick={() => runCommand(c.slash)}
                w="100%"
                textAlign="start"
                px="12px"
                py="8px"
                bg="transparent"
                border="none"
                cursor="pointer"
                transition="background 0.12s"
                _hover={{ bg: menuHoverBg }}
              >
                <Text
                  fontSize="12.5px"
                  fontWeight={600}
                  color={menuSlash}
                  fontFamily="mono"
                >
                  {c.slash}
                </Text>
                <Text fontSize="11px" color={menuDesc}>
                  {t(c.descKey)}
                </Text>
              </Box>
            ))}
          </Box>
        )}

        <Flex align="flex-end" gap="8px">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            flex={1}
            bg={inputBg}
            border="1px solid"
            borderColor={inputBorder}
            borderRadius="10px"
            px="12px"
            py="9px"
            fontSize="13px"
            color={inputColor}
            resize="none"
            outline="none"
            maxH="120px"
            minH="38px"
            rows={1}
            lineHeight="1.45"
            placeholder={t('misc.chatbot.inputPlaceholder')}
            _placeholder={{ color: placeholderColor }}
            _focus={{ borderColor: inputFocus, boxShadow: 'none' }}
            _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
            disabled={streaming}
          />
          <Box
            as="button"
            type="button"
            onClick={submit}
            w="36px"
            h="36px"
            borderRadius="10px"
            border="none"
            cursor={canSend ? 'pointer' : 'not-allowed'}
            flexShrink={0}
            bg={sendBg}
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
            opacity={canSend ? 1 : 0.35}
            transition="background 0.15s, transform 0.15s"
            _hover={
              canSend ? { bg: sendHoverBg, transform: 'scale(1.05)' } : {}
            }
            _active={canSend ? { transform: 'scale(0.95)' } : {}}
            disabled={!canSend}
            aria-label={t('misc.chatbot.send')}
          >
            <SendIcon />
          </Box>
        </Flex>

        <Flex justify="space-between" align="center" minH="16px">
          {streaming ? (
            <Box
              as="button"
              type="button"
              onClick={stop}
              fontSize="11px"
              fontFamily="mono"
              color={abortColor}
              bg="transparent"
              border="none"
              cursor="pointer"
              p={0}
              transition="color 0.15s"
              _hover={{ color: abortHoverColor }}
            >
              {t('misc.chatbot.stopGeneration')}
            </Box>
          ) : (
            <Text fontSize="10px" color={hintColor} fontFamily="mono" ml="auto">
              {t('misc.chatbot.inputHint')}
            </Text>
          )}
        </Flex>
      </Box>
    </Flex>
  );
};
