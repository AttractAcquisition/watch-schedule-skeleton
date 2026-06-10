import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportSchedule, type ExportSchedulePayload } from "@/lib/edgeFunctions";

export function ExportCard({
  title,
  description,
  exportType,
  scheduleRunId,
  onExported,
}: {
  title: string;
  description: string;
  exportType: ExportSchedulePayload["export_type"];
  scheduleRunId: string | null;
  onExported?: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function doExport() {
    if (!scheduleRunId) {
      toast.error("No schedule yet — generate one in the Watch Builder first.");
      return;
    }
    setBusy(true);
    try {
      const res = await exportSchedule({ schedule_run_id: scheduleRunId, export_type: exportType });
      onExported?.();
      // PDF rendering is a placeholder; the export is recorded in history.
      toast(`${title}: ${res.message}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel flex flex-col p-5">
      <div className="text-sm font-medium">{title}</div>
      <p className="mt-1 flex-1 text-xs text-muted-foreground">{description}</p>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => toast("PDF preview is a placeholder.")}>
          Preview
        </Button>
        <Button size="sm" variant="outline" onClick={doExport} disabled={busy}>
          <Download className="h-3.5 w-3.5" /> {busy ? "Exporting…" : "Export PDF"}
        </Button>
      </div>
      <div className="mt-3 font-mono text-[10px] text-muted-foreground">
        TODO: real PDF generation (records export history for now)
      </div>
    </div>
  );
}
