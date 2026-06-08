export type Pompe = {
  id: number;
  pompeName: string;
  statusMode: 'manual' | 'auto';
  devEUI: string;
  isRunning: boolean;
};

/**
 * Placeholder pumps for the dashboard "Pompes disponibles" card. Mirrors
 * {@link ./electrovannes.ts}; swap for a real `/outputs/pumps` fetch once the
 * actuator backend lands.
 */
export const pompeList: Pompe[] = [
  {
    id: 1,
    pompeName: 'Pompe principale',
    statusMode: 'manual',
    devEUI: '00124A0007C1D2E1',
    isRunning: true,
  },
  {
    id: 2,
    pompeName: 'Pompe de forage',
    statusMode: 'auto',
    devEUI: '00124A0007C1D2F2',
    isRunning: false,
  },
  {
    id: 3,
    pompeName: "Pompe d'appoint",
    statusMode: 'manual',
    devEUI: '00124A0007C1D303',
    isRunning: false,
  },
];
