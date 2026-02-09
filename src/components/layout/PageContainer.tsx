import { cn } from "@/utils/styling";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "container max-w-[1440px] mx-auto",
        "px-4 sm:px-6 lg:px-12",
        "pt-6 sm:pt-8",
        "pb-16 sm:pb-20",
        className,
      )}
    >
      {children}
    </div>
  );
}
