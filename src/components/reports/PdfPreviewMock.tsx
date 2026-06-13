import { useAuth } from "@/lib/auth";

export function PdfPreviewMock() {
  const { vessel } = useAuth();
  const vesselName = vessel?.name ?? "Your vessel";

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border bg-background/60 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        PDF Preview · Bridge version
      </div>
      <div className="bg-[#F7F5F1] p-8 text-[#0B1420]">
        <div className="border-b border-[#C8A46B]/45 pb-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A94A6]">
            Watch Schedule
          </div>
          <div className="text-lg font-semibold tracking-tight">
            {vesselName} · Weekly Watch Rota
          </div>
          <div className="text-[11px] text-[#8A94A6]">
            Captain approval required before publishing.
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-[10px]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded border border-[#C8A46B]/35 p-2">
              <div className="text-[#8A94A6]">Day {i + 1}</div>
              <div className="mt-1 font-mono">00–04</div>
              <div className="mt-0.5 font-mono">04–08</div>
              <div className="mt-0.5 font-mono">20–00</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[9px] text-[#8A94A6]">
          Rest-hour aware · Professional scheduling support · Captain approval required.
        </div>
      </div>
    </div>
  );
}
