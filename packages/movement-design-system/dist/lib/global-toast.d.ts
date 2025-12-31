/**
 * Global toast utilities for application-wide notifications.
 *
 * Usage:
 * 1. Import and place <GlobalToaster /> once at your app root
 * 2. Import toast functions anywhere in your app to trigger notifications
 *
 * @example
 * ```tsx
 * // At app root (App.tsx, _app.tsx, etc.)
 * import { GlobalToaster } from '@movement-ds/ui';
 *
 * function App() {
 *   return (
 *     <>
 *       <GlobalToaster />
 *       <YourApp />
 *     </>
 *   );
 * }
 *
 * // Anywhere in your app
 * import { toast } from '@movement-ds/ui';
 *
 * function MyComponent() {
 *   return (
 *     <button onClick={() => toast.success('Action completed!')}>
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export { Toaster as GlobalToaster, toast } from '../components/shadcn/sonner';
//# sourceMappingURL=global-toast.d.ts.map