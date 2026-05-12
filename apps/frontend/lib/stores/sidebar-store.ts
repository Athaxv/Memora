import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Zustand JSON blob; legacy `memory_os_sidebar_collapsed` was a raw "true"/"false" string. */
const PERSIST_KEY = "memory_os_sidebar_prefs";

type SidebarState = {
  collapsedPreference: boolean;
  setCollapsedPreference: (value: boolean) => void;
  toggleCollapsedPreference: () => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsedPreference: false,
      setCollapsedPreference: (collapsedPreference) => set({ collapsedPreference }),
      toggleCollapsedPreference: () =>
        set((s) => ({ collapsedPreference: !s.collapsedPreference })),
    }),
    { name: PERSIST_KEY }
  )
);
