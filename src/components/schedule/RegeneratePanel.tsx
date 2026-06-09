import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { regenerateAffectedWatches } from "@/lib/scheduleEnginePlaceholder";

export function RegeneratePanel() {
  return (
    <div className="panel p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Regenerate Affected Watches
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        When crew availability changes, regenerate only the affected watch blocks. Captain approval required before publishing.
      </p>
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            await regenerateAffectedWatches({}); // TODO: real edge fn
            toast("Affected watches recalculated (mock).");
          }}
        >
          Recalculate
        </Button>
        <Button onClick={() => toast("Schedule submitted for captain approval (mock).")}>
          Submit &amp; Confirm
        </Button>
      </div>
    </div>
  );
}
