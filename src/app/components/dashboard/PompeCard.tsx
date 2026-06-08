import React from 'react';
import { Box, Text, Tag, Badge } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import useColorModeStyles from '@/app/utils/useColorModeStyles';

export type Pompe = {
  id: number;
  pompeName: string;
  statusMode: 'manual' | 'auto';
  devEUI: string;
  isRunning: boolean;
};

interface Props {
  pompe: Pompe;
  onClick?: () => void;
}

const PompeCard = ({ pompe, onClick }: Props) => {
  const { bg, hoverColor, textColor } = useColorModeStyles();
  const t = useTranslations();

  return (
    <Box
      bg={bg}
      p={2}
      borderWidth="1px"
      borderRadius="xl"
      boxShadow="md"
      _hover={{ cursor: 'pointer', borderColor: hoverColor }}
      onClick={onClick}
    >
      <Text fontWeight="bold" fontSize="lg" color={textColor}>
        {pompe.pompeName}
      </Text>

      <Text color={textColor} fontSize="sm">
        🔌 {t('shell.electrovanCard.devEui')}: <Badge>{pompe.devEUI}</Badge>
      </Text>

      <Text color={textColor} fontSize="sm" mt={2}>
        ⚙️ {t('shell.electrovanCard.mode')}:{' '}
        <Tag colorScheme={pompe.statusMode === 'manual' ? 'yellow' : 'brand'}>
          {pompe.statusMode === 'manual'
            ? t('shell.electrovanCard.modeManual')
            : t('shell.electrovanCard.modeAuto')}
        </Tag>
      </Text>

      <Text color={textColor} fontSize="sm" mt={2}>
        💧 {t('shell.electrovanCard.status')}:{' '}
        <Tag colorScheme={pompe.isRunning ? 'green' : 'red'}>
          {pompe.isRunning
            ? t('shell.pompeCard.running')
            : t('shell.pompeCard.stopped')}
        </Tag>
      </Text>
    </Box>
  );
};

export default PompeCard;
