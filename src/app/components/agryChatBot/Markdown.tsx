'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Box,
  Code,
  Link,
  ListItem,
  OrderedList,
  Text,
  UnorderedList,
  useColorModeValue,
} from '@chakra-ui/react';

/**
 * Renders assistant replies as Markdown (the LLM is prompted to use simple
 * Markdown). Maps each element to a compact Chakra component so it fits the
 * chat bubble; never renders raw HTML (no XSS surface).
 */
export const Markdown = ({ children }: { children: string }) => {
  const linkColor = useColorModeValue('green.600', 'green.300');
  const codeBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.200');

  return (
    <Box
      fontSize="inherit"
      lineHeight="1.55"
      sx={{ '& > :first-of-type': { mt: 0 }, '& > :last-child': { mb: 0 } }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: (props) => (
            <Text fontSize="inherit" lineHeight="1.55" mb="6px">
              {props.children}
            </Text>
          ),
          a: (props) => (
            <Link
              href={props.href}
              color={linkColor}
              isExternal
              textDecoration="underline"
            >
              {props.children}
            </Link>
          ),
          ul: (props) => (
            <UnorderedList pl="16px" mb="6px" spacing="1px">
              {props.children}
            </UnorderedList>
          ),
          ol: (props) => (
            <OrderedList pl="16px" mb="6px" spacing="1px">
              {props.children}
            </OrderedList>
          ),
          li: (props) => <ListItem>{props.children}</ListItem>,
          strong: (props) => (
            <Text as="strong" fontWeight={700}>
              {props.children}
            </Text>
          ),
          em: (props) => (
            <Text as="em" fontStyle="italic">
              {props.children}
            </Text>
          ),
          code: (props) => (
            <Code fontSize="0.85em" px="3px" bg={codeBg} borderRadius="4px">
              {props.children}
            </Code>
          ),
          h1: (props) => (
            <Text fontWeight={700} fontSize="15px" mt="6px" mb="4px">
              {props.children}
            </Text>
          ),
          h2: (props) => (
            <Text fontWeight={700} fontSize="14px" mt="6px" mb="4px">
              {props.children}
            </Text>
          ),
          h3: (props) => (
            <Text fontWeight={700} fontSize="13.5px" mt="6px" mb="4px">
              {props.children}
            </Text>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </Box>
  );
};
