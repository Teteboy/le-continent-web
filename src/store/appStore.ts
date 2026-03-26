import { create } from 'zustand';

/**
 * App Store - Global application state
 * Centralized state for app-level concerns
 */

interface AppState {
  // UI state
  sidebarOpen: boolean;
  isMobile: boolean;

  // Error handling
  lastError: string | null;
  errorTimestamp: number | null;

  // Methods
  setSidebarOpen: (open: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  isMobile: false,
  lastError: null,
  errorTimestamp: null,

  setSidebarOpen: (open) =>
    set({
      sidebarOpen: open,
    }),

  setIsMobile: (mobile) =>
    set({
      isMobile: mobile,
    }),

  setError: (error) =>
    set({
      lastError: error,
      errorTimestamp: error ? Date.now() : null,
    }),

  clearError: () =>
    set({
      lastError: null,
      errorTimestamp: null,
    }),
}));
