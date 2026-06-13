// WatchSchedule — development-only setup assistant placeholders.
// These functions must not return mock vessel/crew data in production flows.

import type { CrewMember } from "./types";

export async function getVesselProfile(_userId: string) {
  return null;
}

export async function getCrewMembers(_vesselId: string): Promise<CrewMember[]> {
  return [];
}

export async function mockSaveCrewDatabase(_vesselId: string, crew: CrewMember[]) {
  // TODO: Replace with Supabase database insert/update
  // TODO: Apply RLS policies before production
  console.info("[supabase placeholder] mockSaveCrewDatabase", crew.length);
  return { ok: true };
}

export async function mockUploadCrewList(_file?: File) {
  // TODO: Replace with Supabase database insert/update
  // TODO: Apply RLS policies before production
  return { fileId: "upload_mock_1" };
}

export async function mockExtractCrewFromPhoto(_fileId: string) {
  // TODO(ocr): replace with a real Supabase Edge Function that extracts crew
  // from uploaded documents. Empty result prevents fake crew entering live data.
  return [];
}

export const saveCrewMembers = mockSaveCrewDatabase;
export const uploadCrewListPhoto = mockUploadCrewList;
export const extractCrewFromPhoto = mockExtractCrewFromPhoto;
