import { SortFunction } from './table-hooks';
import * as React from "react";
type TableVariant = "simple" | "borders" | "alternating";
interface TableProps extends React.ComponentProps<"table"> {
    variant?: TableVariant;
    defaultSortFn?: SortFunction;
    mobileCardRender?: <T>(item: T, index: number) => React.ReactNode;
    mobileData?: unknown[];
    forceMobile?: boolean;
}
declare function Table({ className, variant, defaultSortFn, mobileCardRender, mobileData, forceMobile, children, ...props }: TableProps): import("react/jsx-runtime").JSX.Element;
declare function TableHeader({ className, ...props }: React.ComponentProps<"thead">): import("react/jsx-runtime").JSX.Element;
declare function TableBody({ className, ...props }: React.ComponentProps<"tbody">): import("react/jsx-runtime").JSX.Element;
declare function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">): import("react/jsx-runtime").JSX.Element;
declare function TableRow({ className, ...props }: React.ComponentProps<"tr">): import("react/jsx-runtime").JSX.Element;
interface TableHeadProps extends React.ComponentProps<"th"> {
    sortKey?: string;
    sortable?: boolean;
    sortFn?: SortFunction;
}
declare function TableHead({ className, sortKey, sortable, sortFn, children, ...props }: TableHeadProps): import("react/jsx-runtime").JSX.Element;
declare function TableCell({ className, ...props }: React.ComponentProps<"td">): import("react/jsx-runtime").JSX.Element;
declare function TableCaption({ className, ...props }: React.ComponentProps<"caption">): import("react/jsx-runtime").JSX.Element;
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption, };
export type { TableVariant };
//# sourceMappingURL=table.d.ts.map