import { useEffect, useState } from "react";
import type { CrewMember, Department, CrewStatus, WatchRole } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createCrew, updateCrew, deleteCrew } from "@/lib/api";

const DEPARTMENTS: Department[] = ["command", "deck", "interior", "engineering", "unassigned"];
const STATUSES: CrewStatus[] = [
  "active",
  "on_leave",
  "sick",
  "off_vessel",
  "training",
  "unavailable",
];

export function CrewMemberDrawer({
  open,
  member,
  vesselId,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  member: CrewMember | null;
  vesselId: string | null;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = !!member;
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState<Department>("unassigned");
  const [watchEligible, setWatchEligible] = useState(true);
  const [roles, setRoles] = useState("");
  const [status, setStatus] = useState<CrewStatus>("active");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(member?.name ?? "");
    setPosition(member?.position ?? "");
    setDepartment(member?.department ?? "unassigned");
    setWatchEligible(member?.watchEligible ?? true);
    setRoles(member?.eligibleRoles.join(", ") ?? "");
    setStatus(member?.status ?? "active");
    setNotes(member?.notes ?? "");
  }, [member, open]);

  async function save() {
    if (!vesselId) {
      toast.error("No vessel — complete onboarding first.");
      return;
    }
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setBusy(true);
    try {
      const eligible_roles = roles
        .split(",")
        .map((r) => r.trim().replace(/\s+/g, "_"))
        .filter(Boolean) as WatchRole[];
      const payload = {
        full_name: name.trim(),
        position: position || null,
        department,
        watch_eligible: watchEligible,
        eligible_roles,
        status,
        notes: notes || null,
      };
      if (isEdit && member) await updateCrew(member.id, payload);
      else await createCrew(vesselId, payload);
      toast.success(isEdit ? "Crew member updated." : "Crew member added.");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!member) return;
    setBusy(true);
    try {
      await deleteCrew(member.id);
      toast.success("Crew member removed.");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-border bg-surface sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? member?.name : "Add crew member"}</SheetTitle>
          <SheetDescription>{isEdit ? member?.position : "New crew record"}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d} className="capitalize">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label>Watch eligibility</Label>
            <Switch checked={watchEligible} onCheckedChange={setWatchEligible} />
          </div>
          <div className="space-y-2">
            <Label>Eligible roles (comma separated)</Label>
            <Input
              value={roles}
              onChange={(e) => setRoles(e.target.value)}
              placeholder="oow, deck_watch"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CrewStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
            {isEdit && (
              <Button variant="outline" onClick={remove} disabled={busy}>
                Delete
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
