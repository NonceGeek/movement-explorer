import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TokenDescriptionCardProps {
  description: string;
}

// Token description card component
export function TokenDescriptionCard({ description }: TokenDescriptionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Token Description</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
