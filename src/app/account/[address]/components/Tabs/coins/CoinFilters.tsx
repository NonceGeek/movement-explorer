import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CoinFilter } from "./types";

interface CoinFiltersProps {
  filter: CoinFilter;
  setFilter: (filter: CoinFilter) => void;
}

export function CoinFilters({ filter, setFilter }: CoinFiltersProps) {
  return (
    <ToggleGroup
      value={filter}
      onValueChange={(v) => setFilter(v as CoinFilter)}
    >
      <ToggleGroupItem value="verified">Verified</ToggleGroupItem>
      <ToggleGroupItem value="recognized">Recognized</ToggleGroupItem>
      <ToggleGroupItem value="all">All</ToggleGroupItem>
    </ToggleGroup>
  );
}
