import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { LeaveTable } from "@/components/leave/LeaveTable";
import { LeaveDateRangeForm } from "@/components/leave/LeaveDateRangeForm";

export default function LeaveManagement() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Leave Management"
        title="Crew availability & leave"
        description="Record leave, sickness, training, and off-vessel status. Affected watches are flagged for regeneration."
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <LeaveTable />
        </div>
        <div className="lg:col-span-2">
          <LeaveDateRangeForm />
        </div>
      </div>
    </AppShell>
  );
}
