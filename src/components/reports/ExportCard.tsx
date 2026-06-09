import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportSchedulePdf } from "@/lib/pdfPlaceholder";

export function ExportCard({
  title,
  description,
  variant,
}: {
  title: string;
  description: string;
  variant: string;
}) {
  return (
    <div className="panel flex flex-col p-5">
      <div className="text-sm font-medium">{title}</div>
      <p className="mt-1 flex-1 text-xs text-muted-foreground">{description}</p>
      <Button
        size="sm"
        variant="outline"
        className="mt-4 self-start"
        onClick={async () => {
          await exportSchedulePdf("run_1", variant); // TODO: real edge fn
          toast(`${title} PDF placeholder — backend connection required.`);
        }}
      >
        <Download className="h-3.5 w-3.5" /> Download
      </Button>
    </div>
  );
}
