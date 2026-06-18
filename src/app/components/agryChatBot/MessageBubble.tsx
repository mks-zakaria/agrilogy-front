import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useTranslations } from 'next-intl';
import { Markdown } from './Markdown';
import { StatusIndicator } from './StatusIndicator';
import { useChat } from './ChatContext';
import type { Message, MessageRating } from './types';

const ThumbIcon = ({ down = false }: { down?: boolean }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    style={down ? { transform: 'rotate(180deg)' } : undefined}
  >
    <path
      d="M7 10v11M2 11.5A2.5 2.5 0 014.5 9H7l3.5-6.5a2 2 0 013.6 1.6L13 9h5.5a2 2 0 011.95 2.46l-1.6 7A2 2 0 0116.9 20H4.5A2.5 2.5 0 012 17.5v-6z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Slide-in animation ─────────────────────────────────────────────────────
const msgIn = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1);    }
`;

interface AgrilogyMessageBubbleProps {
  message: Message;
  isTyping?: boolean;
}

export const AgrilogyMessageBubble = ({
  message,
  isTyping = false,
}: AgrilogyMessageBubbleProps) => {
  const isUser = message.role === 'user';
  const t = useTranslations();
  const { rateMessage } = useChat();

  const rateColor = useColorModeValue('gray.400', 'gray.500');
  const rateActive = useColorModeValue('green.600', 'green.300');
  const rateDownActive = useColorModeValue('red.500', 'red.300');

  // ── Light / dark tokens ──────────────────────────────────────────────────
  const userBubbleBg = useColorModeValue('green.50', 'green.900');
  const userBubbleColor = useColorModeValue('green.800', 'green.200');
  const userBubbleBorder = useColorModeValue('green.200', 'green.700');

  const asstBubbleBg = useColorModeValue('gray.100', 'gray.700');
  const asstBubbleColor = useColorModeValue('gray.800', 'gray.100');
  const asstBubbleBorder = useColorModeValue('gray.200', 'gray.600');

  const errorBubbleBg = useColorModeValue('red.50', 'red.900');
  const errorBubbleColor = useColorModeValue('red.700', 'red.200');
  const errorBubbleBorder = useColorModeValue('red.200', 'red.700');

  const timestampColor = useColorModeValue('gray.400', 'gray.500');

  // ── Bubble style resolution ──────────────────────────────────────────────
  const bubbleBg = message.isError
    ? errorBubbleBg
    : isUser
      ? userBubbleBg
      : asstBubbleBg;
  const bubbleColor = message.isError
    ? errorBubbleColor
    : isUser
      ? userBubbleColor
      : asstBubbleColor;
  const bubbleBorder = message.isError
    ? errorBubbleBorder
    : isUser
      ? userBubbleBorder
      : asstBubbleBorder;

  const borderRadius = isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px';
  // Render assistant replies as Markdown; user input + errors stay plain text.
  const renderMarkdown = !isUser && !message.isError;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems={isUser ? 'flex-end' : 'flex-start'}
      gap="3px"
      animation={`${msgIn} 0.2s cubic-bezier(0.34,1.4,0.64,1)`}
    >
      {/* Bubble */}
      <Box
        maxW="78%"
        px="13px"
        py="9px"
        bg={bubbleBg}
        color={bubbleColor}
        border="1px solid"
        borderColor={bubbleBorder}
        borderRadius={borderRadius}
        fontSize="13.5px"
        lineHeight="1.55"
        wordBreak="break-word"
        whiteSpace={renderMarkdown ? 'normal' : 'pre-wrap'}
      >
        {isTyping ? (
          <StatusIndicator />
        ) : renderMarkdown && message.content ? (
          <Markdown>{message.content}</Markdown>
        ) : (
          message.content
        )}
      </Box>

      {/* Rating (assistant replies only, once they have content) */}
      {renderMarkdown && !isTyping && message.content.trim() && (
        <Flex gap="2px" px="2px" pt="1px">
          {(['up', 'down'] as MessageRating[]).map((r) => {
            const active = message.rating === r;
            return (
              <Box
                key={r}
                as="button"
                type="button"
                onClick={() => rateMessage(message.id, r)}
                aria-label={t(
                  r === 'up' ? 'misc.chatbot.rate.up' : 'misc.chatbot.rate.down'
                )}
                aria-pressed={active}
                w="22px"
                h="22px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="6px"
                border="none"
                bg="transparent"
                cursor="pointer"
                color={
                  active
                    ? r === 'up'
                      ? rateActive
                      : rateDownActive
                    : rateColor
                }
                opacity={active ? 1 : 0.7}
                transition="color 0.15s, opacity 0.15s"
                _hover={{
                  opacity: 1,
                  color: r === 'up' ? rateActive : rateDownActive,
                }}
              >
                <ThumbIcon down={r === 'down'} />
              </Box>
            );
          })}
        </Flex>
      )}

      {/* Timestamp */}
      <Text fontSize="10px" color={timestampColor} fontFamily="mono" px="4px">
        {message.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </Box>
  );
};
