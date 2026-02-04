import { Button } from "@/components/ui/button";
import { CoinFilter } from "./types";

interface CoinFiltersProps {
  filter: CoinFilter;
  setFilter: (filter: CoinFilter) => void;
}

export function CoinFilters({ filter, setFilter }: CoinFiltersProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Button
        variant="ghost"
        size="sm"
        className={
          filter === "verified"
            ? "text-guild-green-500"
            : "text-muted-foreground"
        }
        onClick={() => setFilter("verified")}
      >
        Verified
      </Button>
      <span className="text-muted-foreground/60">|</span>
      <Button
        variant="ghost"
        size="sm"
        className={
          filter === "recognized"
            ? "text-guild-green-500"
            : "text-muted-foreground"
        }
        onClick={() => setFilter("recognized")}
      >
        Recognized
      </Button>
      <span className="text-muted-foreground/60">|</span>
      <Button
        variant="ghost"
        size="sm"
        className={
          filter === "all" ? "text-guild-green-500" : "text-muted-foreground"
        }
        onClick={() => setFilter("all")}
      >
        All
      </Button>
    </div>
  );
}
