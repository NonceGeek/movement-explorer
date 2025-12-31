export declare const toastVariants: readonly ["info", "error", "warning", "success"];
export type ToastVariant = (typeof toastVariants)[number];
export interface ToastProps {
    /** The variant of the toast message. */
    variant: ToastVariant;
    /** The title of the toast message. */
    title: string;
    /** The description of the toast message to be displayed below the title. */
    description: string | (() => React.ReactNode);
    /** The id of the toast message. */
    id: string;
}
//# sourceMappingURL=toast-types.d.ts.map