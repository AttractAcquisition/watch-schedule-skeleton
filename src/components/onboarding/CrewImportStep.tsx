import { useState } from "react";
import { CrewImportMockup } from "@/components/crew/CrewImportMockup";
import { MOCK_CREW } from "@/lib/mockData";
import type { CrewMember } from "@/lib/types";

export function CrewImportStep() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  return (
    <div className="space-y-4">
      <CrewImportMockup onExtracted={setCrew} />
      {crew.length > 0 && (
        <div className="panel p-4 text-xs text-muted-foreground">
          Extracted {crew.length} crew members — continue to review departments. (Mock data — TODO connect OCR.)
        </div>
      )}
      {crew.length === 0 && (
        <div className="text-xs text-muted-foreground">
          Or skip and review {MOCK_CREW.length} pre-loaded crew members in the next step.
        </div>
      )}
    </div>
  );
}
