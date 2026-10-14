import { createContext, useContext } from 'react';

export interface ShellState {
  /** Below the compact breakpoint: the rail is a drawer and the analysis bar a sheet. */
  compact: boolean;
  navigationOpen: boolean;
  controlsOpen: boolean;
  setNavigationOpen: (open: boolean) => void;
  setControlsOpen: (open: boolean) => void;
}

export const ShellContext = createContext<ShellState | null>(null);

/** The shell the component sits in, or null when it is used on its own. */
export const useShell = () => useContext(ShellContext);
