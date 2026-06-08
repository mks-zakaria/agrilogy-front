export const VANNES_POMPES_STORAGE_KEY = 'agrilogy-vannes-pompes-v1';

export const VANNES_POMPES_UPDATED_EVENT = 'vannes-pompes-updated';

export type Vane = {
  id: string;
  name: string;
  devEui: string;
  active: boolean;
};

export type Pump = {
  id: string;
  name: string;
  running: boolean;
};

export type VannesPompesStored = { vanes: Vane[]; pumps: Pump[] };

/**
 * Placeholder output devices shown the first time the page is opened (no
 * stored data yet), so the control surface isn't empty before any real
 * actuators are provisioned. Once the user adds/removes/toggles anything the
 * choice is persisted and these are no longer used.
 */
export const PLACEHOLDER_VANNES_POMPES: VannesPompesStored = {
  vanes: [
    {
      id: 'vane-seed-1',
      name: 'Vanne générale',
      devEui: '00124A0007B4F1A1',
      active: true,
    },
    {
      id: 'vane-seed-2',
      name: 'Vanne zone 1',
      devEui: '00124A0007B4F1B2',
      active: false,
    },
    {
      id: 'vane-seed-3',
      name: 'Vanne zone 2',
      devEui: '00124A0007B4F1C3',
      active: false,
    },
  ],
  pumps: [
    { id: 'pump-seed-1', name: 'Pompe principale', running: true },
    { id: 'pump-seed-2', name: 'Pompe de forage', running: false },
    { id: 'pump-seed-3', name: "Pompe d'appoint", running: false },
  ],
};

export function loadVannesPompesFromStorage(): VannesPompesStored {
  if (typeof window === 'undefined') return { vanes: [], pumps: [] };
  try {
    const raw = localStorage.getItem(VANNES_POMPES_STORAGE_KEY);
    // No stored data yet → seed placeholder output devices.
    if (!raw) return PLACEHOLDER_VANNES_POMPES;
    const parsed = JSON.parse(raw) as Partial<VannesPompesStored>;
    return {
      vanes: Array.isArray(parsed.vanes) ? parsed.vanes : [],
      pumps: Array.isArray(parsed.pumps) ? parsed.pumps : [],
    };
  } catch {
    return { vanes: [], pumps: [] };
  }
}

export function dispatchVannesPompesUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(VANNES_POMPES_UPDATED_EVENT));
}
