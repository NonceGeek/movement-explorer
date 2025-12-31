import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
declare function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
interface AccordionItemProps extends React.ComponentProps<typeof AccordionPrimitive.Item> {
    showTopBorder?: boolean;
    showBottomBorder?: boolean;
}
declare function AccordionItem({ className, showTopBorder, showBottomBorder, ...props }: AccordionItemProps): import("react/jsx-runtime").JSX.Element;
interface AccordionTriggerProps extends React.ComponentProps<typeof AccordionPrimitive.Trigger> {
    icon?: React.ReactNode;
    showIcon?: boolean;
    hideCaret?: boolean;
}
declare function AccordionTrigger({ className, children, icon, showIcon, hideCaret, ...props }: AccordionTriggerProps): import("react/jsx-runtime").JSX.Element;
declare function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>): import("react/jsx-runtime").JSX.Element;
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
//# sourceMappingURL=accordion.d.ts.map