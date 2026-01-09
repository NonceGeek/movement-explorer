interface InfoItemProps {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  children?: React.ReactNode;
}

export function InfoItem({
  label,
  value,
  mono = false,
  children,
}: InfoItemProps) {
  if (!value && !children) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children || (
        <p className={mono ? "font-mono text-sm break-all" : ""}>{value}</p>
      )}
    </div>
  );
}
