import { useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { CrewTable } from "@/components/crew/CrewTable";
import { CrewMemberDrawer } from "@/components/crew/CrewMemberDrawer";
import { Button } from "@/components/ui/button";
import type { CrewMember, CrewStatus, Department } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCrew, useVesselId, useInvalidateVesselData } from "@/hooks/data";
import { mapCrew, updateCrew } from "@/lib/api";

export default function CrewDatabase() {
  const vesselId = useVesselId();
  const crewQuery = useCrew();
  const invalidate = useInvalidateVesselData();

  const [dept, setDept] = useState<Department | "all">("all");
  const [status, setStatus] = useState<CrewStatus | "all">("all");
  const [editing, setEditing] = useState<CrewMember | null>(null);
  const [open, setOpen] = useState(false);

  const crew: CrewMember[] = (crewQuery.data ?? []).map(mapCrew);
  const filtered = crew.filter(
    (c) => (dept === "all" || c.department === dept) && (status === "all" || c.status === status),
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Crew Database"
        title="Crew Database"
        description="Manage crew departments, watch eligibility, and availability for rota generation."
        actions={
          <>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add crew member
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast("Crew list import (OCR) is a future feature.")}
            >
              Import crew list
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast("Crew list export is a future feature.")}
            >
              Export crew list
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={dept} onValueChange={(v) => setDept(v as Department | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
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
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
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

      {crewQuery.isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading crew…</div>
      ) : (
        <CrewTable
          crew={filtered}
          onEdit={(c) => {
            setEditing(c);
            setOpen(true);
          }}
          onToggleEligible={async (c, v) => {
            try {
              await updateCrew(c.id, { watch_eligible: v });
              invalidate();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Update failed.");
            }
          }}
        />
      )}

      <CrewMemberDrawer
        open={open}
        member={editing}
        vesselId={vesselId}
        onOpenChange={setOpen}
        onSaved={invalidate}
      />
      {!crewQuery.isLoading && filtered.length === 0 && (
        <div className="mt-4 panel p-4 text-xs text-muted-foreground">
          No crew match these filters. Add a crew member or clear filters.
        </div>
      )}
    </AppShell>
  );
}
