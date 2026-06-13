import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAN_LABEL } from "@/lib/constants";

export function VesselSetupStep() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Vessel name</Label>
          <Input placeholder="Enter vessel name" />
        </div>
        <div className="space-y-2">
          <Label>Vessel length range</Label>
          <Select defaultValue="50-65">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30-50">30m–50m</SelectItem>
              <SelectItem value="50-65">50m–65m</SelectItem>
              <SelectItem value="60-120">60m–120m+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Operation type</Label>
          <Select defaultValue="private_charter">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="charter">Charter</SelectItem>
              <SelectItem value="private_charter">Private / Charter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Captain / admin name</Label>
          <Input placeholder="Captain name" />
        </div>
        <div className="space-y-2">
          <Label>Default timezone</Label>
          <Input defaultValue="Europe/Monaco" />
        </div>
        <div className="space-y-2">
          <Label>Current plan</Label>
          <Input defaultValue={PLAN_LABEL.triple_watch} disabled />
        </div>
      </div>
    </div>
  );
}
