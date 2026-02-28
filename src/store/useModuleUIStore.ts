import { create } from "zustand";
import { persist } from "zustand/middleware";

type ModuleUIState = {
  codeSidebarOpen: boolean;
  setCodeSidebarOpen: (open: boolean) => void;
};

export const useModuleUIStore = create<ModuleUIState>()(
  persist(
    (set) => ({
      codeSidebarOpen: true,
      setCodeSidebarOpen: (open) => set({ codeSidebarOpen: open }),
    }),
    { name: "module-ui-storage" },
  ),
);
