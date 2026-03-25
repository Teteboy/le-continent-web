import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * Content Store - Manages village content state
 * Handles content caching, filtering, and optimization
 */

export interface ContentItem {
  id: string;
  village_id: string;
  [key: string]: unknown;
}

export interface ContentState {
  // Content caches by table
  lexique: ContentItem[];
  alphabet: ContentItem[];
  proverbes: ContentItem[];
  histoires: ContentItem[];
  mets: ContentItem[];

  // Loading states
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;

  // Methods
  setContent: (table: string, items: ContentItem[]) => void;
  setLoading: (table: string, isLoading: boolean) => void;
  setError: (table: string, error: string | null) => void;
  clearContent: (table?: string) => void;
  getContent: (table: string) => ContentItem[];
}

export const useContentStore = create<ContentState>()(
  immer((set, get) => ({
    lexique: [],
    alphabet: [],
    proverbes: [],
    histoires: [],
    mets: [],

    loading: {},
    errors: {},

    setContent: (table, items) =>
      set((state) => {
        state[table as keyof ContentState] = items;
      }),

    setLoading: (table, isLoading) =>
      set((state) => {
        state.loading[table] = isLoading;
      }),

    setError: (table, error) =>
      set((state) => {
        state.errors[table] = error;
      }),

    clearContent: (table) =>
      set((state) => {
        if (table) {
          state[table as keyof ContentState] = [];
          delete state.loading[table];
          delete state.errors[table];
        } else {
          // Clear all
          state.lexique = [];
          state.alphabet = [];
          state.proverbes = [];
          state.histoires = [];
          state.mets = [];
          state.loading = {};
          state.errors = {};
        }
      }),

    getContent: (table) => get()[table as keyof ContentState] as ContentItem[],
  }))
);
