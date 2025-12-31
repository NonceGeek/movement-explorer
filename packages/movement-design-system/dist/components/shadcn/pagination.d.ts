import { Button } from './button';
import * as React from "react";
type PaginationVariant = "default" | "bullets";
declare function Pagination({ className, ...props }: React.ComponentProps<"nav">): import("react/jsx-runtime").JSX.Element;
declare function PaginationContent({ className, ...props }: React.ComponentProps<"ul">): import("react/jsx-runtime").JSX.Element;
declare function PaginationItem({ ...props }: React.ComponentProps<"li">): import("react/jsx-runtime").JSX.Element;
type PaginationLinkProps = {
    isActive?: boolean;
    variant?: PaginationVariant;
} & Pick<React.ComponentProps<typeof Button>, "size"> & React.ComponentProps<"a">;
declare function PaginationLink({ className, isActive, variant, size, ...props }: PaginationLinkProps): import("react/jsx-runtime").JSX.Element;
type PaginationNavigationProps = {
    variant?: PaginationVariant;
} & React.ComponentProps<typeof PaginationLink>;
declare function PaginationPrevious({ className, variant, ...props }: PaginationNavigationProps): import("react/jsx-runtime").JSX.Element;
declare function PaginationNext({ className, variant, ...props }: PaginationNavigationProps): import("react/jsx-runtime").JSX.Element;
declare function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">): import("react/jsx-runtime").JSX.Element;
interface BulletPaginationProps extends React.ComponentProps<"nav"> {
    /** Total number of pages */
    totalPages: number;
    /** Current active page (0-indexed) */
    currentPage: number;
    /** Callback when page changes */
    onPageChange?: (page: number) => void;
    /** Show navigation arrows */
    showArrows?: boolean;
}
declare function BulletPagination({ className, totalPages, currentPage, onPageChange, showArrows, ...props }: BulletPaginationProps): import("react/jsx-runtime").JSX.Element;
export { Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis, BulletPagination, };
export type { PaginationVariant, BulletPaginationProps };
//# sourceMappingURL=pagination.d.ts.map