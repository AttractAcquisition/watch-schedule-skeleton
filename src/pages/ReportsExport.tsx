import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ExportCard } from "@/components/reports/ExportCard";
import { PdfPreviewMock } from "@/components/reports/PdfPreviewMock";
import { Button } from "@/components/ui/button";
import { MOCK_EXPORTS } from "@/lib/mockData";
import { toast } from "sonner";

export default function ReportsExport() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Reports & Export"
        title="Schedule exports"
        description="Generate captain-approved schedule PDFs for the bridge, crew mess, departments, and compliance support."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ExportCard title="Bridge version" description="Watchkeeper-focused layout for bridge posting." variant="bridge" />
        <ExportCard title="Crew mess version" description="Readable layout for crew mess distribution." variant="mess" />
        <ExportCard title="Department version" description="Per-department breakdown for HoD distribution." variant="department" />
        <ExportCard title="Compliance-support version" description="Rest-hour aware layout for compliance support." variant="compliance" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PdfPreviewMock />
        <div className="panel">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Export history
            </div>
            <Button variant="outline" size="sm" onClick={() => toast("CSV export placeholder — backend connection required.")}>
              CSV export
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">When</th>
                <th className="px-5 py-3 text-left font-medium">Variant</th>
                <th className="px-5 py-3 text-left font-medium">Version</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {MOCK_EXPORTS.map((e) => (
                <tr key={e.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-2 font-mono text-[11px] text-muted-foreground">{e.at.slice(0, 16).replace("T", " ")}</td>
                  <td className="px-5 py-2">{e.variant}</td>
                  <td className="px-5 py-2 font-mono text-muted-foreground">v{e.version}</td>
                  <td className="px-5 py-2 text-right">
                    <button
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      onClick={() => toast("Download placeholder — backend connection required.")}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
