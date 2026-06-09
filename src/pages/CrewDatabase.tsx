import { useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { CrewTable } from "@/components/crew/CrewTable";
import { CrewMemberDrawer } from "@/components/crew/CrewMemberDrawer";
import { Button } from "@/components/ui/button";
import { MOCK_CREW } from "@/lib/mockData";
import type { CrewMember, CrewStatus, Department } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function CrewDatabase() {
  const [crew, setCrew] = useState(MOCK_CREW);
  const [dept, setDept] = useState<Department | "all">("all");
  const [status, setStatus] = useState<CrewStatus | "all">("all");
  const [editing, setEditing] = useState<CrewMember | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = crew.filter(
    (c) => (dept === "all" || c.department === dept) && (status === "all" || c.status === status)
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Crew Database"
        title="Crew & watch eligibility"
        description="Manage crew records, departments, and watch eligibility. Captain approval required before publishing schedules."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast("Upload crew list placeholder.")}>
              Upload crew list
            </Button>
            <Button size="sm" onClick={() => toast("Add crew member placeholder.")}>
              Add crew member
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={dept} onValueChange={(v) => setDept(v as Department | "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            <SelectItem value="command">Command</SelectItem>
            <SelectItem value="deck">Deck</SelectItem>
            <SelectItem value="interior">Interior</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as CrewStatus | "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On leave</SelectItem>
            <SelectItem value="sick">Sick</SelectItem>
            <SelectItem value="off_vessel">Off vessel</SelectItem>
            <SelectItem value="training">Training</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CrewTable
        crew={filtered}
        onEdit={(c) => {
          setEditing(c);
          setOpen(true);
        }}
        onToggleEligible={(c, v) => {
          setCrew((cur) => cur.map((x) => (x.id === c.id ? { ...x, watchEligible: v } : x)));
        }}
      />

      <CrewMemberDrawer open={open} member={editing} onOpenChange={setOpen} />
    </AppShell>
  );
}
