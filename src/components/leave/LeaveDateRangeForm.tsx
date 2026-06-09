import { useState } from "react";
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
import { MOCK_CREW } from "@/lib/mockData";
import type { CrewStatus } from "@/lib/types";
import { toast } from "sonner";

const STATUSES: { id: CrewStatus; label: string }[] = [
  { id: "active", label: "Available" },
  { id: "on_leave", label: "On leave" },
  { id: "sick", label: "Sick" },
  { id: "off_vessel", label: "Off vessel" },
  { id: "training", label: "Training" },
  { id: "unavailable", label: "Unavailable" },
];

export function LeaveDateRangeForm() {
  const [crewId, setCrewId] = useState(MOCK_CREW[0].id);
  const [status, setStatus] = useState<CrewStatus>("on_leave");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form
      className="panel space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: persist via Supabase; trigger regenerateAffectedWatches
        toast("Leave saved (mock). Affected watches flagged for regeneration.");
      }}
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Add Leave Record
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Crew member</Label>
          <Select value={crewId} onValueChange={setCrewId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOCK_CREW.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as CrewStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
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
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional context for the captain." />
      </div>
      <div className="rounded-md border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
        Affected watches will be shown after saving. Captain approval required before publishing.
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => toast("Affected watches recalculated (mock).")}>
          Regenerate affected watches
        </Button>
        <Button type="submit">Submit &amp; Confirm</Button>
      </div>
    </form>
  );
}
