import { create } from "zustand";
import { persist } from "zustand/middleware";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE: PageSize = 25;

interface BlocksPaginationState {
  pageSize: PageSize;
  setPageSize: (size: PageSize) => void;
}

export const useBlocksPaginationStore = create<BlocksPaginationState>()(
  persist(
    (set) => ({
      pageSize: DEFAULT_PAGE_SIZE,
      setPageSize: (size: PageSize) => {
        if (PAGE_SIZE_OPTIONS.includes(size)) {
          set({ pageSize: size });
        }
      },
    }),
    {
      name: "blocks-pagination-storage",
      partialize: (state) => ({ pageSize: state.pageSize }),
    },
  ),
);
