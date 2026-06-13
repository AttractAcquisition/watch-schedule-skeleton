import type { CrewStatus } from "@/lib/types";

const LABEL: Record<CrewStatus, string> = {
  active: "Active",
  on_leave: "On leave",
  sick: "Sick",
  off_vessel: "Off vessel",
  training: "Training",
  unavailable: "Unavailable",
};

export function CrewStatusBadge({ status }: { status: CrewStatus }) {
  const dot =
    status === "active"
      ? "bg-success"
      : status === "sick"
        ? "bg-destructive"
        : "bg-muted-foreground";
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
      <span className={"h-1.5 w-1.5 rounded-full " + dot} />
      {LABEL[status]}
    </span>
  );
}
