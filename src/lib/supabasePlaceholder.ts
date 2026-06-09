// Watch Schedule — Supabase data placeholders.
// TODO: replace every function here with real Supabase queries or server functions.

import { MOCK_CREW, MOCK_VESSEL } from "./mockData";
import type { CrewMember } from "./types";

export async function getVesselProfile(_userId: string) {
  // TODO: select * from vessels where owner_id = userId
  return MOCK_VESSEL;
}

export async function getCrewMembers(_vesselId: string): Promise<CrewMember[]> {
  // TODO: select * from crew_members where vessel_id = vesselId
  return MOCK_CREW;
}

export async function saveCrewMembers(
  _vesselId: string,
  crew: CrewMember[]
) {
  // TODO: upsert crew_members
  console.info("[supabase placeholder] saveCrewMembers", crew.length);
  return { ok: true };
}

export async function uploadCrewListPhoto(_file: File) {
  // TODO: upload to Supabase Storage bucket "crew-list-uploads"
  return { fileId: "upload_mock_1" };
}

export async function extractCrewFromPhoto(_fileId: string) {
  // TODO: invoke Edge Function ocr-crew-extract
  return MOCK_CREW.slice(0, 8);
}
