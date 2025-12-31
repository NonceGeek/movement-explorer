import { ToastVariant } from './toast-types';
export interface CreateToastArgs {
    /** The variant of the toast message. */
    variant: ToastVariant;
    /** The title of the toast message. */
    title?: string;
    /** The description of the toast message to be displayed below the title. */
    description: string | (() => React.ReactNode);
    /** The optional id of the toast. This can be used to update or dismiss the toast programmatically. */
    id?: string;
    /** The duration of the toast in milliseconds. This will override the default duration. */
    duration?: number;
}
export type TypedToastArgs = Omit<CreateToastArgs, "variant">;
/**
 * A function to create a toast. If an id is provided and there's an existing toast with that id,
 * the toast will be updated.
 *
 * Additionally, toasts can be dismissed with `toast.dismiss`.
 */
export declare const toast: ((props: CreateToastArgs) => string | number) & {
    /** Dismisses a toast by id. If no id is provided, all toasts will be dismissed. */
    dismiss: (id?: string) => string | number;
    /** Creates a success toast */
    success: (message: string | TypedToastArgs) => void;
    /** Creates an error toast */
    error: (message: string | TypedToastArgs) => void;
    /** Creates a warning toast */
    warning: (message: string | TypedToastArgs) => void;
    /** Creates an info toast */
    info: (message: string | TypedToastArgs) => void;
};
/**
 * The component from which toasts will appear.
 * This component should be placed once at the root of your application.
 */
export declare const Toaster: () => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=sonner.d.ts.map