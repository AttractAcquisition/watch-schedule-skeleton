import type { CrewMember } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CrewMemberDrawer({
  open,
  member,
  onOpenChange,
}: {
  open: boolean;
  member: CrewMember | null;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-l border-border bg-surface sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{member?.name ?? "Crew member"}</SheetTitle>
          <SheetDescription>{member?.position}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input defaultValue={member?.name} />
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Input defaultValue={member?.position} />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input defaultValue={member?.department} />
          </div>
          <Button
            className="w-full"
            onClick={() => {
              // TODO: persist via saveCrewMembers
              toast("Crew member saved (mock).");
              onOpenChange(false);
            }}
          >
            Save changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
