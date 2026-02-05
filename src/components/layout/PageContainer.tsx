import { cn } from "@/utils/styling";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "container max-w-[1440px] mx-auto px-12 pt-8 pb-20",
        className,
      )}
    >
      {children}
    </div>
  );
}
