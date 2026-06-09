// Watch Schedule — PDF export placeholders.
// TODO: call PDF generation Edge Function.

export async function exportSchedulePdf(scheduleId: string, variant = "bridge") {
  // TODO: invoke Edge Function export-schedule-pdf
  console.info("[pdf placeholder] exportSchedulePdf", scheduleId, variant);
  return { url: "#" };
}
