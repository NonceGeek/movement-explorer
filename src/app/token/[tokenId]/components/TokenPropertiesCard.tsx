import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonViewer } from "@/components/ui/json-viewer";

interface TokenPropertiesCardProps {
  tokenProperties: Record<string, any>;
}

export function TokenPropertiesCard({ tokenProperties }: TokenPropertiesCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Token Properties</CardTitle>
      </CardHeader>
      <CardContent>
        <JsonViewer data={tokenProperties} initialDepth={1} />
      </CardContent>
    </Card>
  );
}
