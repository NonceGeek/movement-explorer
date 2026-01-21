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
        className="p-0.5 hover:bg-muted rounded transition-colors ml-1"
        title="View transaction types"
      >
        <Info className="h-4 w-4 text-muted-foreground" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Types</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {Object.values(TransactionTypeName).map((type) => {
              const info = TRANSACTION_TYPE_INFO[type];
              return (
                <div key={type} className="flex items-start gap-3">
                  <span className="text-muted-foreground mt-0.5">
                    {info.icon}
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{info.label}</p>
                    <p className="text-xs text-muted-foreground">
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
