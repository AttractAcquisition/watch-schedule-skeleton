import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ExportCard } from "@/components/reports/ExportCard";
import { PdfPreviewMock } from "@/components/reports/PdfPreviewMock";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useExports, useLatestScheduleRun, useInvalidateVesselData } from "@/hooks/data";

const TYPE_LABEL: Record<string, string> = {
  bridge: "Bridge",
  crew_mess: "Crew mess",
  department: "Department",
  compliance_support: "Compliance-support",
};

export default function ReportsExport() {
  const latestRun = useLatestScheduleRun();
  const exportsQuery = useExports();
  const invalidate = useInvalidateVesselData();
  const runId = latestRun.data?.id ?? null;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Reports & Export"
        title="Reports & Export"
        description="Export clean watch schedules for the bridge, crew mess, department heads, or internal records."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ExportCard
          title="Bridge Version"
          description="Full vessel watch schedule with all departments."
          exportType="bridge"
          scheduleRunId={runId}
          onExported={invalidate}
        />
        <ExportCard
          title="Crew Mess Version"
          description="Simple crew-facing rota."
          exportType="crew_mess"
          scheduleRunId={runId}
          onExported={invalidate}
        />
        <ExportCard
          title="Department Version"
          description="Deck, Interior, or Engineering schedule."
          exportType="department"
          scheduleRunId={runId}
          onExported={invalidate}
        />
        <ExportCard
          title="Compliance-Support Version"
          description="Includes rest-hour aware warnings, generated date, and version history."
          exportType="compliance_support"
          scheduleRunId={runId}
          onExported={invalidate}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PdfPreviewMock />
        <div className="panel overflow-x-auto">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Export history
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast("CSV export is a future feature.")}
            >
              CSV export
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Version</th>
                <th className="px-5 py-3 text-left font-medium">Date generated</th>
                <th className="px-5 py-3 text-left font-medium">Type</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {(exportsQuery.data ?? []).map((e) => (
                <tr key={e.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-2 font-mono text-muted-foreground">v{e.version}</td>
                  <td className="px-5 py-2 font-mono text-[11px] text-muted-foreground">
                    {e.created_at.slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-5 py-2">{TYPE_LABEL[e.export_type] ?? e.export_type}</td>
                  <td className="px-5 py-2 text-muted-foreground">{e.status}</td>
                  <td className="px-5 py-2 text-right">
                    <button
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      onClick={() =>
                        e.file_url
                          ? window.open(e.file_url, "_blank")
                          : toast("PDF file not generated yet (placeholder).")
                      }
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
              {(exportsQuery.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-xs text-muted-foreground">
                    No exports yet. Generate a schedule and export a version above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
