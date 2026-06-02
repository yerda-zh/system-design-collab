import { create } from 'zustand';
import type { Warning } from '../types/warnings';

interface WarningState {
  warnings: Warning[];
  setWarnings: (warnings: Warning[]) => void;
}

export const useWarningStore = create<WarningState>((set) => ({
  warnings: [],
  setWarnings: (warnings) => set({ warnings }),
}));