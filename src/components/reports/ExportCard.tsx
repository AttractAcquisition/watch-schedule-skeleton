import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
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
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function doExport() {
    if (!scheduleRunId) {
      toast.error("No schedule yet — generate one in the Watch Builder first.");
      return;
    }
    setBusy(true);
    setFileUrl(null);
    setFileName(null);
    try {
      const res = await exportSchedule({ schedule_run_id: scheduleRunId, export_type: exportType });
      setFileUrl(res.file_url);
      setFileName(res.file_name);
      onExported?.();
      toast.success(`${title} PDF generated.`);
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
      <div className="mt-4 flex flex-col gap-2">
        <Button size="sm" variant="outline" onClick={doExport} disabled={busy}>
          <Download className="h-3.5 w-3.5" />
          {busy ? "Generating PDF…" : "Export PDF"}
        </Button>
        {fileUrl && (
          <Button size="sm" variant="default" onClick={() => window.open(fileUrl, "_blank")}>
            <FileText className="h-3.5 w-3.5" />
            {fileName ? `Open ${fileName.slice(-20)}` : "Open PDF"}
          </Button>
        )}
      </div>
    </div>
  );
}
