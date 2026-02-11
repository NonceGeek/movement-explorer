import { Types } from "aptos";
import { PageSize } from "@/store/useBlocksPaginationStore";

/**
 * Block row data for table display
 */
export interface BlockRowData {
  blockHeight: number;
  block: Types.Block;
}

/**
 * Props for the DownloadBlockData component
 */
export interface DownloadBlockDataProps {
  blocks: BlockRowData[];
  disabled?: boolean;
  className?: string;
}

/**
 * Props for the BlockTableToolbar component
 */
export interface BlockTableToolbarProps {
  currentPage: number;
  hasNextPage?: boolean;
  onPageChange: (page: number) => void;
  blocks: BlockRowData[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Props for the BlockTableFooter component
 */
export interface BlockTableFooterProps {
  currentPage: number;
  hasNextPage?: boolean;
  onPageChange: (page: number) => void;
  pageSize: PageSize;
  onPageSizeChange: (size: PageSize) => void;
  isLoading?: boolean;
  className?: string;
}
