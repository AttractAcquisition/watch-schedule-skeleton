import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MOCK_CHARTER } from "@/lib/mockData";
import { pauseScheduleForCharter, resumeScheduleAfterCharter } from "@/lib/scheduleEnginePlaceholder";
import { toast } from "sonner";

export function CharterPausePanel() {
  const [start, setStart] = useState(MOCK_CHARTER.startDate);
  const [end, setEnd] = useState(MOCK_CHARTER.endDate);
  const [keepEng, setKeepEng] = useState(MOCK_CHARTER.keepEngineering);
  const [keepSec, setKeepSec] = useState(MOCK_CHARTER.keepSecurity);
  const [scope, setScope] = useState<"all" | "selected">(MOCK_CHARTER.scope);

  return (
    <div className="panel p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Pause schedule for charter
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Start date</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End date</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setScope("all")}
          className={"rounded-md border px-3 py-2 text-sm " + (scope === "all" ? "border-foreground bg-secondary/40" : "border-border")}
        >
          Pause all watches
        </button>
        <button
          type="button"
          onClick={() => setScope("selected")}
          className={"rounded-md border px-3 py-2 text-sm " + (scope === "selected" ? "border-foreground bg-secondary/40" : "border-border")}
        >
          Pause selected watches
        </button>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <span>Keep engineering watch active</span>
          <Switch checked={keepEng} onCheckedChange={setKeepEng} />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <span>Keep security watch active</span>
          <Switch checked={keepSec} onCheckedChange={setKeepSec} />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Button
          onClick={async () => {
            await pauseScheduleForCharter({ start, end, scope, keepEng, keepSec });
            toast("Charter Mode activated (mock).");
          }}
        >
          Activate Charter Mode
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            await resumeScheduleAfterCharter({}); // TODO: edge fn
            toast("Schedule resumed (mock).");
          }}
        >
          Resume Schedule
        </Button>
      </div>
    </div>
  );
}
