'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box, Flex, IconButton, Text, type BoxProps } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useTranslations } from 'next-intl';
import { ChartCollapseContext } from './chartCollapseContext';

const KEY_PREFIX = 'agrilogy_chart_collapsed::';

const readCollapsed = (title: string): boolean => {
  if (typeof window === 'undefined' || !title) return false;
  try {
    return localStorage.getItem(KEY_PREFIX + title) === '1';
  } catch {
    return false;
  }
};

/**
 * Token-driven container that hosts a single chart panel — collapsible.
 *
 * A small toggle sits in a normal-flow header row (not absolute, so it can't
 * be obscured by the chart's own controls). The child chart's
 * `ChartPanelHeading` publishes its title via context; when collapsed we show
 * that title beside the toggle and hide the body. State persists per-title in
 * localStorage. The chart stays mounted (hidden) when collapsed so its title
 * is always known.
 */
export function ChartSection({ children, ...rest }: BoxProps) {
  const t = useTranslations();
  const [title, setTitle] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const registerTitle = useCallback((next: string) => setTitle(next), []);

  useEffect(() => {
    if (title) setCollapsed(readCollapsed(title));
  }, [title]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      if (title) localStorage.setItem(KEY_PREFIX + title, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  return (
    <Box
      bg="app.surface"
      borderWidth="1px"
      borderColor="app.border"
      borderRadius="lg"
      px={{ base: 3, md: 4 }}
      py={{ base: 3, md: 4 }}
      minW={0}
      {...rest}
    >
      <Flex
        align="center"
        justify="space-between"
        gap={2}
        mb={collapsed ? 0 : 1}
      >
        {/* Title only shown while collapsed (the chart renders its own when open). */}
        <Text
          fontWeight="semibold"
          fontSize={{ base: 'md', md: 'lg' }}
          noOfLines={1}
          minW={0}
        >
          {collapsed ? title : ''}
        </Text>
        <IconButton
          aria-label={
            collapsed ? t('shell.common.expand') : t('shell.common.collapse')
          }
          title={
            collapsed ? t('shell.common.expand') : t('shell.common.collapse')
          }
          icon={collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
          onClick={toggle}
          size="sm"
          variant="ghost"
          flexShrink={0}
        />
      </Flex>
      <Box display={collapsed ? 'none' : 'block'}>
        <ChartCollapseContext.Provider value={{ registerTitle }}>
          {children}
        </ChartCollapseContext.Provider>
      </Box>
    </Box>
  );
}
