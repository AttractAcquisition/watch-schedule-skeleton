import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CrewStatus } from "@/lib/types";
import { toast } from "sonner";
import { useCrew, useLatestScheduleRun, useInvalidateVesselData, useVesselId } from "@/hooks/data";
import { createLeave } from "@/lib/api";
import { regenerateSchedule } from "@/lib/edgeFunctions";

const STATUSES: { id: CrewStatus; label: string }[] = [
  { id: "active", label: "Available" },
  { id: "on_leave", label: "On leave" },
  { id: "sick", label: "Sick" },
  { id: "off_vessel", label: "Off vessel" },
  { id: "training", label: "Training" },
  { id: "unavailable", label: "Unavailable" },
];

// crew_availability.status uses "available" instead of "active".
const AVAILABILITY_STATUS: Record<CrewStatus, string> = {
  active: "available",
  on_leave: "on_leave",
  sick: "sick",
  off_vessel: "off_vessel",
  training: "training",
  unavailable: "unavailable",
};

export function LeaveDateRangeForm() {
  const vesselId = useVesselId();
  const crew = useCrew();
  const latestRun = useLatestScheduleRun();
  const invalidate = useInvalidateVesselData();

  const [crewId, setCrewId] = useState("");
  const [status, setStatus] = useState<CrewStatus>("on_leave");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!crewId && crew.data?.length) setCrewId(crew.data[0].id);
  }, [crew.data, crewId]);

  async function save() {
    if (!vesselId || !crewId) {
      toast.error("Select a crew member.");
      return;
    }
    if (!start || !end) {
      toast.error("Pick a start and end date.");
      return;
    }
    setBusy(true);
    try {
      await createLeave({
        vesselId,
        crewMemberId: crewId,
        status: AVAILABILITY_STATUS[status],
        startDate: start,
        endDate: end,
        notes: notes || undefined,
      });
      invalidate();
      toast.success("Leave saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save leave.");
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    if (!latestRun.data) {
      toast.error("Generate a schedule first.");
      return;
    }
    setBusy(true);
    try {
      const res = await regenerateSchedule({
        schedule_run_id: latestRun.data.id,
        mode: "affected_only",
        change_context: { reason: "leave_change", crew_member_id: crewId },
      });
      invalidate();
      toast.success(`Schedule regenerated · ${res.warnings.length} warning(s).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Regeneration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="panel space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Add Leave Record
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Crew member</Label>
          <Select value={crewId} onValueChange={setCrewId}>
            <SelectTrigger>
              <SelectValue placeholder="Select crew" />
            </SelectTrigger>
            <SelectContent>
              {(crew.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as CrewStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Start date</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End date</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional context for the captain."
        />
      </div>
      <div className="rounded-md border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
        Saving records availability. Regenerate to recalculate affected watches; captain approval
        required before publishing.
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={regenerate} disabled={busy}>
          Regenerate affected watches
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save leave"}
        </Button>
      </div>
    </form>
  );
}
