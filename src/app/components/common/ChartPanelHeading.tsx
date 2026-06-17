'use client';

import { Box, HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { useEffect, type ReactNode } from 'react';
import { useChartCollapse } from '@/app/components/layout/chartCollapseContext';

export type ChartPanelHeadingProps = {
  title: string;
  subtitle?: string;
  /** Title color — typically `textColor` from `useColorModeStyles()` */
  color: string;
  /** Optional icon or badge before the text block */
  startAdornment?: ReactNode;
};

/**
 * Shared chart header: tight semibold title + optional muted subtitle (dashboard-style).
 */
export default function ChartPanelHeading({
  title,
  subtitle,
  color,
  startAdornment,
}: ChartPanelHeadingProps) {
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');

  // Publish the title to an enclosing ChartSection (if any) so it can show it
  // while collapsed. No-op outside a ChartSection.
  const collapse = useChartCollapse();
  useEffect(() => {
    collapse?.registerTitle(title);
  }, [collapse, title]);

  const textBlock = (
    <Box minW={0}>
      <Text
        as="h2"
        fontSize={{ base: 'md', md: 'lg' }}
        fontWeight="semibold"
        color={color}
        letterSpacing="-0.02em"
        lineHeight="1.25"
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          fontSize="xs"
          color={subtitleColor}
          mt={1}
          lineHeight="1.45"
          fontWeight="normal"
        >
          {subtitle}
        </Text>
      ) : null}
    </Box>
  );

  if (startAdornment) {
    return (
      <HStack align="flex-start" spacing={3}>
        {startAdornment}
        {textBlock}
      </HStack>
    );
  }

  return textBlock;
}
