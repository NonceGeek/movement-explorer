import { ToastVariant } from './toast-types';
/**
 * A message that appears on the screen to provide feedback on an action, or provide a notification
 * of an event that has occurred.
 */
interface ToastComponentProps {
    variant: ToastVariant;
    title?: string;
    description: string | (() => React.ReactNode);
    onClose: () => void;
}
export declare function ToastComponent({ variant, title, description, onClose, }: ToastComponentProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=toast.d.ts.map