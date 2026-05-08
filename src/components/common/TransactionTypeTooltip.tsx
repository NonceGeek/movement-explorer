import { Info } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TransactionTypeName,
  TRANSACTION_TYPE_INFO,
} from "@/constants/transaction";

export function TransactionTypeTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-0.5 rounded transition-colors ml-1 cursor-pointer"
        title="View transaction types"
      >
        <Info className="h-4 w-4 text-muted-foreground transition-colors" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="bg-muted/30 px-5 pt-5 pb-3 border-b border-border/30">
            <DialogTitle className="text-sm font-medium text-foreground">
              Transaction Types
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
            {Object.values(TransactionTypeName).map((type) => {
              const info = TRANSACTION_TYPE_INFO[type];
              return (
                <div
                  key={type}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group"
                >
                  <span className="text-muted-foreground group-hover:text-primary transition-colors mt-0.5 shrink-0">
                    {info.icon}
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {info.label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {info.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
