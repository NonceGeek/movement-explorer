"use client";

import { Card, CardContent } from "@/components/ui/card";

type ChartCardProps = {
  children: React.ReactNode;
};

export default function ChartCard({ children }: ChartCardProps) {
  return (
    <Card className="border border-border/50 bg-card/50">
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}
