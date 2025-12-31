import * as React from "react";
type SortDirection = "asc" | "desc" | null;
type SortFunction<T = any> = (a: T, b: T, column: string, direction: SortDirection) => number;
interface TableContextValue {
    variant: "simple" | "borders" | "alternating";
    sortColumn: string | null;
    sortDirection: SortDirection;
    onSort: (column: string) => void;
    defaultSortFn?: SortFunction;
    columnSortFns?: Record<string, SortFunction>;
    registerColumnSortFn?: (column: string, sortFn: SortFunction) => void;
}
export declare const TableContext: React.Context<TableContextValue>;
export declare function useTableSort(): {
    sortColumn: string | null;
    sortDirection: SortDirection;
};
export declare function useSortableData<T>(data: T[], sortFn?: SortFunction<T>): T[];
export type { SortDirection, SortFunction };
//# sourceMappingURL=table-hooks.d.ts.map