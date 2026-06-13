import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmScheduleModal({
  open,
  onOpenChange,
  onConfirm,
  confirming = false,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  confirming?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit &amp; Confirm schedule</DialogTitle>
          <DialogDescription>
            This will publish the schedule to crew. Captain approval is required. Rest-hour aware
            warnings will be reviewed before publishing.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={confirming}>
            {confirming ? "Publishing…" : "Confirm & publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
