import { Drawer as DrawerPrimitive } from 'vaul';
import * as React from "react";
declare function Drawer({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
declare function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>): import("react/jsx-runtime").JSX.Element;
declare function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>): import("react/jsx-runtime").JSX.Element;
declare function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>): import("react/jsx-runtime").JSX.Element;
declare function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>): import("react/jsx-runtime").JSX.Element;
declare const DrawerContent: React.ForwardRefExoticComponent<Omit<Omit<import('@radix-ui/react-dialog').DialogContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare function DrawerHeader({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function DrawerFooter({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>): import("react/jsx-runtime").JSX.Element;
declare function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>): import("react/jsx-runtime").JSX.Element;
export { Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, };
//# sourceMappingURL=drawer.d.ts.map