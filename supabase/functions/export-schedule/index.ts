// Watch Schedule — export-schedule Edge Function.
// Generates a professional PDF schedule and uploads it to the schedule-exports
// Storage bucket. Returns a 1-year signed URL for immediate download.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import {
  getUserClient,
  getServiceClient,
  requireUser,
  assertVesselAccess,
  HttpError,
} from "../_shared/client.ts";

const VALID_TYPES = ["bridge", "crew_mess", "department", "compliance_support"];

const ROLE_LABEL: Record<string, string> = {
  oow: "Officer of the Watch",
  deck_watch: "Deck Watch",
  interior_watch: "Interior Watch",
  engineering_oow: "Engineering OOW",
  watchkeeper: "Watchkeeper",
};

const TYPE_LABEL: Record<string, string> = {
  bridge: "Bridge Version",
  crew_mess: "Crew Mess Version",
  department: "Department Version",
  compliance_support: "Compliance Support",
};

function formatRole(role: string): string {
  return (
    ROLE_LABEL[role] ??
    role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function shortDate(iso: string): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [year, month, day] = iso.split("-");
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
}

function dayLabel(iso: string): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [, month, day] = iso.split("-");
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]}`;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function buildSchedulePdf(params: {
  vesselName: string;
  exportType: string;
  version: number;
  startDate: string;
  endDate: string;
  generatedAt: string;
  days: string[];
  roles: string[];
  byDateRole: Map<string, string>;
}): Promise<Uint8Array> {
  const { vesselName, exportType, version, startDate, endDate, generatedAt, days, roles, byDateRole } = params;

  const pdfDoc = await PDFDocument.create();
  // A4 landscape
  const PAGE_W = 841.89;
  const PAGE_H = 595.28;
  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const cDark    = rgb(0.043, 0.078, 0.125);  // #0B1420
  const cMid     = rgb(0.541, 0.580, 0.651);  // #8A94A6
  const cTableHd = rgb(0.937, 0.941, 0.949);  // #EFF0F2 header row bg
  const cAltRow  = rgb(0.973, 0.976, 0.980);  // #F8F9FA alt row bg
  const cBorder  = rgb(0.847, 0.859, 0.878);  // #D8DBE0

  const MARGIN = 40;
  const USABLE_W = PAGE_W - MARGIN * 2;

  // ── HEADER ──────────────────────────────────────────────────────────────────
  // y coords measured from bottom of page.
  const headerTop = PAGE_H - 38;

  // "WATCH SCHEDULE" top-right tag
  const tagText = "WATCH SCHEDULE";
  const tagW = regularFont.widthOfTextAtSize(tagText, 7.5);
  page.drawText(tagText, { x: PAGE_W - MARGIN - tagW, y: headerTop, size: 7.5, font: regularFont, color: cMid });

  // Vessel name
  const vesselY = headerTop - 4;
  page.drawText(vesselName.toUpperCase(), {
    x: MARGIN, y: vesselY, size: 18, font: boldFont, color: cDark,
  });

  // Export type label (right-aligned, same line as vessel name)
  const typeLabel = TYPE_LABEL[exportType] ?? exportType;
  const typeLabelW = boldFont.widthOfTextAtSize(typeLabel, 9);
  page.drawText(typeLabel, {
    x: PAGE_W - MARGIN - typeLabelW, y: vesselY, size: 9, font: boldFont, color: cDark,
  });

  // Date range + version
  const rangeY = vesselY - 20;
  page.drawText(`${shortDate(startDate)} — ${shortDate(endDate)}  ·  v${version}`, {
    x: MARGIN, y: rangeY, size: 9, font: regularFont, color: cMid,
  });

  // Generated-at (right-aligned, same line)
  const genText = `Generated ${generatedAt} UTC`;
  const genW = regularFont.widthOfTextAtSize(genText, 9);
  page.drawText(genText, { x: PAGE_W - MARGIN - genW, y: rangeY, size: 9, font: regularFont, color: cMid });

  // Divider rule
  const ruleY = rangeY - 14;
  page.drawLine({
    start: { x: MARGIN, y: ruleY }, end: { x: PAGE_W - MARGIN, y: ruleY },
    thickness: 0.5, color: cBorder,
  });

  // ── TABLE ───────────────────────────────────────────────────────────────────
  const ROLE_COL_W = 145;
  const numDays = days.length;
  const DAY_COL_W = numDays > 0 ? (USABLE_W - ROLE_COL_W) / numDays : 0;
  const HEADER_H = 22;
  const ROW_H = 26;
  const PAD = 6;

  const tableTop = ruleY - 16; // top edge of table header row

  // Table header background
  page.drawRectangle({
    x: MARGIN, y: tableTop - HEADER_H,
    width: USABLE_W, height: HEADER_H,
    color: cTableHd,
  });

  // "Role" column header
  page.drawText("Role", {
    x: MARGIN + PAD, y: tableTop - HEADER_H + 7,
    size: 8.5, font: boldFont, color: cDark,
  });

  // Day column headers
  for (let d = 0; d < days.length; d++) {
    page.drawText(dayLabel(days[d]), {
      x: MARGIN + ROLE_COL_W + d * DAY_COL_W + PAD,
      y: tableTop - HEADER_H + 7,
      size: 8.5, font: boldFont, color: cDark,
    });
  }

  // Header bottom border
  page.drawLine({
    start: { x: MARGIN, y: tableTop - HEADER_H },
    end: { x: PAGE_W - MARGIN, y: tableTop - HEADER_H },
    thickness: 0.5, color: cBorder,
  });

  // Vertical separator after role column (spans full table height)
  const tableDataTop = tableTop - HEADER_H;
  const tableBottom = tableDataTop - roles.length * ROW_H;

  page.drawLine({
    start: { x: MARGIN + ROLE_COL_W, y: tableTop },
    end: { x: MARGIN + ROLE_COL_W, y: tableBottom },
    thickness: 0.5, color: cBorder,
  });

  // Data rows
  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    const rowBottom = tableDataTop - (i + 1) * ROW_H;
    const textY = rowBottom + 9;

    // Alternating row background
    if (i % 2 === 1) {
      page.drawRectangle({
        x: MARGIN, y: rowBottom, width: USABLE_W, height: ROW_H, color: cAltRow,
      });
    }

    // Role label
    page.drawText(truncate(formatRole(role), 20), {
      x: MARGIN + PAD, y: textY, size: 8.5, font: boldFont, color: cDark,
    });

    // Crew names per day
    for (let d = 0; d < days.length; d++) {
      const crewName = byDateRole.get(`${days[d]}|${role}`) ?? "—";
      page.drawText(truncate(crewName, 16), {
        x: MARGIN + ROLE_COL_W + d * DAY_COL_W + PAD,
        y: textY, size: 8.5, font: regularFont, color: cDark,
      });
    }

    // Row bottom border
    page.drawLine({
      start: { x: MARGIN, y: rowBottom },
      end: { x: PAGE_W - MARGIN, y: rowBottom },
      thickness: 0.5, color: cBorder,
    });
  }

  // ── COMPLIANCE NOTE (compliance_support only) ────────────────────────────────
  if (exportType === "compliance_support") {
    const noteY = tableBottom - 18;
    page.drawText(
      "Rest-hour compliance: This schedule must be reviewed against MLC 2006 / STCW rest-hour requirements before publishing.",
      { x: MARGIN, y: noteY, size: 7.5, font: regularFont, color: cMid },
    );
  }

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const footerLineY = 42;
  page.drawLine({
    start: { x: MARGIN, y: footerLineY },
    end: { x: PAGE_W - MARGIN, y: footerLineY },
    thickness: 0.5, color: cBorder,
  });
  page.drawText(
    `WatchSchedule · ${generatedAt} UTC · Captain approval required before publishing.`,
    { x: MARGIN, y: footerLineY - 12, size: 7.5, font: regularFont, color: cMid },
  );

  return await pdfDoc.save();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const client = getUserClient(req);
    const serviceClient = getServiceClient();
    const user = await requireUser(client);
    const body = await req.json();

    const { schedule_run_id, export_type } = body ?? {};
    if (!schedule_run_id || !export_type) {
      throw new HttpError("schedule_run_id and export_type are required.", 422);
    }
    if (!VALID_TYPES.includes(export_type)) {
      throw new HttpError(`export_type must be one of ${VALID_TYPES.join(", ")}.`, 422);
    }

    // Load schedule run (RLS: user must be vessel member)
    const { data: run, error: runErr } = await client
      .from("schedule_runs")
      .select("id, vessel_id, start_date, end_date, version, status")
      .eq("id", schedule_run_id)
      .maybeSingle();
    if (runErr) throw new HttpError(runErr.message, 400);
    if (!run) throw new HttpError("Schedule run not found.", 404);

    const vessel = await assertVesselAccess(client, run.vessel_id);

    // Load assignments for this run
    const { data: assignments, error: aErr } = await client
      .from("schedule_assignments")
      .select("crew_member_id, watch_role, watch_start, watch_end, assignment_date")
      .eq("schedule_run_id", schedule_run_id)
      .order("watch_start", { ascending: true });
    if (aErr) throw new HttpError(aErr.message, 400);

    // Load crew members for name lookup
    const { data: crew, error: cErr } = await client
      .from("crew_members")
      .select("id, full_name")
      .eq("vessel_id", run.vessel_id);
    if (cErr) throw new HttpError(cErr.message, 400);

    const crewById = new Map((crew ?? []).map((c: { id: string; full_name: string }) => [c.id, c.full_name]));

    // Build schedule lookup: "date|role" → first crew name per slot
    const byDateRole = new Map<string, string>();
    const daySet = new Set<string>();
    const roleSet = new Set<string>();

    for (const a of assignments ?? []) {
      const date = (a.assignment_date as string | null) ?? (a.watch_start as string).slice(0, 10);
      const role = (a.watch_role as string | null) ?? "";
      daySet.add(date);
      if (role) roleSet.add(role);
      const key = `${date}|${role}`;
      if (!byDateRole.has(key)) {
        byDateRole.set(key, crewById.get(a.crew_member_id as string) ?? "—");
      }
    }

    const days = [...daySet].sort().slice(0, 7);
    const roles = [...roleSet];

    // Next version number for this run + type
    const { count } = await client
      .from("export_history")
      .select("id", { count: "exact", head: true })
      .eq("schedule_run_id", schedule_run_id)
      .eq("export_type", export_type);

    const exportVersion = (count ?? 0) + 1;
    const now = new Date();
    const generatedAt = now.toISOString().slice(0, 16).replace("T", " ");
    const dateStamp = now.toISOString().slice(0, 10);

    // Build PDF
    const pdfBytes = await buildSchedulePdf({
      vesselName: (vessel as { name: string }).name,
      exportType: export_type,
      version: exportVersion,
      startDate: run.start_date as string,
      endDate: run.end_date as string,
      generatedAt,
      days,
      roles,
      byDateRole,
    });

    // Upload to Supabase Storage (service_role bypasses RLS)
    const fileName = `${makeSlug((vessel as { name: string }).name)}-${export_type.replace(/_/g, "-")}-v${exportVersion}-${dateStamp}.pdf`;
    const storagePath = `${run.vessel_id}/${schedule_run_id}/${fileName}`;

    const { error: uploadErr } = await serviceClient.storage
      .from("schedule-exports")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (uploadErr) throw new HttpError(`Storage upload failed: ${uploadErr.message}`, 500);

    // Signed URL valid for 1 year (31 536 000 s)
    const { data: signed, error: signErr } = await serviceClient.storage
      .from("schedule-exports")
      .createSignedUrl(storagePath, 31_536_000);
    if (signErr || !signed?.signedUrl) {
      throw new HttpError("Failed to create signed URL.", 500);
    }

    // Write export_history record (user client — vessel admin policy allows insert)
    const { data: record, error: insertErr } = await client
      .from("export_history")
      .insert({
        vessel_id: run.vessel_id,
        schedule_run_id,
        export_type,
        version: exportVersion,
        generated_by: user.id,
        status: "ready",
        file_url: signed.signedUrl,
        storage_path: storagePath,
        file_name: fileName,
        generated_at: now.toISOString(),
      })
      .select()
      .single();
    if (insertErr) throw new HttpError(insertErr.message, 400);

    return jsonResponse({
      export_id: record.id,
      status: record.status,
      file_url: signed.signedUrl,
      file_name: fileName,
      message: `${TYPE_LABEL[export_type] ?? export_type} PDF generated.`,
    });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return errorResponse(err instanceof Error ? err.message : "Unexpected error", status);
  }
});
