import { Button } from '../shadcn/button';
import * as React from "react";
interface ProgressButtonProps extends React.ComponentProps<typeof Button> {
    /** Progress percentage (0-100) */
    percent?: number;
    /** Whether to show the progress animation and active hover state */
    loading?: boolean;
}
/**
 * ProgressButton - A button component that displays animated progress
 *
 * @usage Important Notes:
 * - **onClick side effects must be handled by the developer**
 * - The button remains clickable during loading to support "click to cancel" patterns
 * - The button is NOT automatically disabled during loading to avoid disabled styling
 * - Developers should prevent re-triggering side effects by checking loading state in onClick handler
 *
 * @example
 * ```tsx
 * const [loading, setLoading] = useState(false);
 * const [percent, setPercent] = useState(0);
 *
 * const handleClick = () => {
 *   // Prevent re-trigger if already loading
 *   if (loading) return;
 *
 *   setLoading(true);
 *   // ... your async operation
 * };
 *
 * <ProgressButton loading={loading} percent={percent} onClick={handleClick}>
 *   {loading ? "Processing..." : "Submit"}
 * </ProgressButton>
 * ```
 *
 * @example Click to Cancel Pattern
 * ```tsx
 * const handleClick = () => {
 *   if (loading) {
 *     // Cancel operation
 *     cancelOperation();
 *     setLoading(false);
 *   } else {
 *     // Start operation
 *     startOperation();
 *     setLoading(true);
 *   }
 * };
 * ```
 */
declare function ProgressButton({ percent, loading, children, className, ...props }: ProgressButtonProps): import("react/jsx-runtime").JSX.Element;
export { ProgressButton };
//# sourceMappingURL=ProgressButton.d.ts.map