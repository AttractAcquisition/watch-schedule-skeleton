import { Switch } from "@/components/ui/switch";

export function AvailabilityToggle({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
      <span>{label}</span>
      <Switch defaultChecked />
    </div>
  );
}
