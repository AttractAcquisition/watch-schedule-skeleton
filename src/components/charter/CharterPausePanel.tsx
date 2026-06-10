import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useVesselId, useLatestScheduleRun, useInvalidateVesselData } from "@/hooks/data";
import { activateCharterMode, resumeCharterMode } from "@/lib/edgeFunctions";

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function CharterPausePanel() {
  const vesselId = useVesselId();
  const latestRun = useLatestScheduleRun();
  const invalidate = useInvalidateVesselData();

  const [start, setStart] = useState(addDays(0));
  const [end, setEnd] = useState(addDays(3));
  const [keepEng, setKeepEng] = useState(false);
  const [keepSec, setKeepSec] = useState(false);
  const [scope, setScope] = useState<"all" | "selected">("all");
  const [resumeMode, setResumeMode] = useState<"automatic" | "manual">("automatic");
  const [busy, setBusy] = useState(false);

  async function activate() {
    if (!vesselId) {
      toast.error("No vessel — complete onboarding first.");
      return;
    }
    setBusy(true);
    try {
      const res = await activateCharterMode({
        vessel_id: vesselId,
        schedule_run_id: latestRun.data?.id,
        start_date: start,
        end_date: end,
        pause_all_watches: scope === "all",
        keep_engineering_watch_active: keepEng,
        keep_security_watch_active: keepSec,
        resume_mode: resumeMode,
      });
      invalidate();
      toast.success(res.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Activation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function resume() {
    if (!vesselId) return;
    setBusy(true);
    try {
      const res = await resumeCharterMode({ vessel_id: vesselId });
      invalidate();
      toast.success(res.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Resume failed.");
    } finally {
      setBusy(false);
    }
  }

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
          className={
            "rounded-md border px-3 py-2 text-sm " +
            (scope === "all" ? "border-foreground bg-secondary/40" : "border-border")
          }
        >
          Pause all watches
        </button>
        <button
          type="button"
          onClick={() => setScope("selected")}
          className={
            "rounded-md border px-3 py-2 text-sm " +
            (scope === "selected" ? "border-foreground bg-secondary/40" : "border-border")
          }
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
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <span>Resume automatically</span>
          <Switch
            checked={resumeMode === "automatic"}
            onCheckedChange={(v) => setResumeMode(v ? "automatic" : "manual")}
          />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Button onClick={activate} disabled={busy}>
          Activate Charter Mode
        </Button>
        <Button variant="outline" onClick={resume} disabled={busy}>
          Resume Schedule
        </Button>
      </div>
    </div>
  );
}
