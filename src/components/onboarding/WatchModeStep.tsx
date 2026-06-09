import { useState } from "react";
import { WatchModeSelector } from "@/components/schedule/WatchModeSelector";
import type { WatchMode } from "@/lib/types";

export function WatchModeStep() {
  const [mode, setMode] = useState<WatchMode>("triple");
  return (
    <div className="space-y-4">
      <WatchModeSelector value={mode} onChange={setMode} />
      <div className="panel p-5 text-sm text-muted-foreground">
        {mode === "solo" && "Configured as: One watchkeeper per watch block."}
        {mode === "dual" && "Configured as: Watchkeeper + OOW, or Day/Night rotation."}
        {mode === "triple" && "Configured as: Deck Watchkeeper / OOW, Interior Watchkeeper, Engineering OOW."}
      </div>
    </div>
  );
}
