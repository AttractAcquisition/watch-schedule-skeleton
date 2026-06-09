import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function QuickActions() {
  const navigate = useNavigate();
  const actions: Array<{ label: string; onClick: () => void }> = [
    { label: "Generate Schedule", onClick: () => navigate("/watch-builder") },
    {
      label: "Regenerate Affected Watches",
      onClick: () => toast("Regenerate placeholder — schedule engine not yet connected."),
    },
    { label: "Pause for Charter", onClick: () => navigate("/charter-mode") },
    { label: "Add Leave", onClick: () => navigate("/leave") },
    { label: "Export PDF", onClick: () => navigate("/reports") },
    { label: "Edit Crew", onClick: () => navigate("/crew") },
  ];
  return (
    <div className="panel p-5">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Quick Actions
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={a.onClick}
          >
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
