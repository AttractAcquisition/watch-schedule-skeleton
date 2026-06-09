import { MOCK_VESSEL } from "@/lib/mockData";

export function PdfPreviewMock() {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border bg-background/60 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        PDF Preview · Bridge version
      </div>
      <div className="bg-white p-8 text-[#0B0B0B]">
        <div className="border-b border-black/20 pb-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-black/60">Watch Schedule</div>
          <div className="text-lg font-semibold tracking-tight">{MOCK_VESSEL.name} · Weekly Watch Rota</div>
          <div className="text-[11px] text-black/60">Captain approval required before publishing.</div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-[10px]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded border border-black/15 p-2">
              <div className="text-black/50">Day {i + 1}</div>
              <div className="mt-1 font-mono">00–04</div>
              <div className="mt-0.5 font-mono">04–08</div>
              <div className="mt-0.5 font-mono">20–00</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[9px] text-black/50">
          Rest-hour aware · Professional scheduling support · Captain approval required.
        </div>
      </div>
    </div>
  );
}
