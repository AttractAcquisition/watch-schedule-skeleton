import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { LeaveTable } from "@/components/leave/LeaveTable";
import { LeaveDateRangeForm } from "@/components/leave/LeaveDateRangeForm";

export default function LeaveManagement() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Leave Management"
        title="Leave Management"
        description="Mark crew as unavailable and regenerate only the affected watches."
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <LeaveTable />
        </div>
        <div className="lg:col-span-2">
          <LeaveDateRangeForm />
        </div>
      </div>
      <div className="mt-4 panel p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Affected watches
        </div>
        <p className="mt-2 text-sm">2 confirmed watches affected by this change.</p>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <div>Fri 20:00-00:00 · Interior Watch · Lisa Green</div>
          <div>Sat 00:00-04:00 · Interior Watch · Lisa Green</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/45 hover:bg-primary/10 hover:text-foreground">
            Regenerate affected watches
          </button>
          <button className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/45 hover:bg-primary/10 hover:text-foreground">
            Regenerate full schedule
          </button>
          <button className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/45 hover:bg-primary/10 hover:text-foreground">
            Manually edit
          </button>
          <button className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/45 hover:bg-primary/10 hover:text-foreground">
            Submit & Confirm
          </button>
        </div>
      </div>
    </AppShell>
  );
}
