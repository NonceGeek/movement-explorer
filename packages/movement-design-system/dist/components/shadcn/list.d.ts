import { VariantProps } from 'class-variance-authority';
import * as React from "react";
declare const listVariants: (props?: ({
    spacing?: "normal" | "loose" | "tight" | "relaxed" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare const listItemVariants: (props?: ({
    size?: "sm" | "lg" | "md" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare const bulletVariants: (props?: ({
    variant?: "circle" | "triangle" | "diamond" | null | undefined;
    size?: "sm" | "lg" | "md" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
interface ListProps extends React.ComponentProps<"ul"> {
    /**
     * Spacing between list items
     */
    spacing?: VariantProps<typeof listVariants>["spacing"];
    /**
     * Default bullet variant for all items
     */
    bulletVariant?: VariantProps<typeof bulletVariants>["variant"];
    /**
     * Size of the list items
     */
    size?: VariantProps<typeof listItemVariants>["size"];
    /**
     * Use ordered list (ol) instead of unordered (ul)
     */
    ordered?: boolean;
}
interface ListItemProps extends React.ComponentProps<"li"> {
    /**
     * Bullet variant for this specific item (overrides List's bulletVariant)
     */
    bulletVariant?: VariantProps<typeof bulletVariants>["variant"];
    /**
     * Size of the list item (should match parent List size)
     */
    size?: VariantProps<typeof listItemVariants>["size"];
}
declare const List: React.ForwardRefExoticComponent<Omit<ListProps, "ref"> & React.RefAttributes<HTMLOListElement | HTMLUListElement>>;
declare const ListItem: React.ForwardRefExoticComponent<Omit<ListItemProps, "ref"> & React.RefAttributes<HTMLLIElement>>;
export { List, ListItem, listVariants, listItemVariants, bulletVariants };
export type { ListProps, ListItemProps };
//# sourceMappingURL=list.d.ts.map