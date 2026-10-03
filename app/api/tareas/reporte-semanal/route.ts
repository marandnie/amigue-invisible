import { NextResponse, type NextRequest } from "next/server";

import { sendWeeklyReport } from "@/lib/admin-notices";
import { verifySchedulerToken } from "@/lib/scheduler-auth";

// Feature 004 (US2). Lo dispara Cloud Scheduler los lunes con un token OIDC (research R3).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PATH = "/api/tareas/reporte-semanal";

export async function POST(req: NextRequest) {
  const serviceAccount = process.env.REPORT_INVOKER_SA?.trim();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!serviceAccount || !site || !process.env.ADMIN_EMAIL?.trim()) {
    return NextResponse.json({ error: "sin_configurar" }, { status: 503 });
  }

  const ok = await verifySchedulerToken(req.headers.get("authorization"), {
    audience: `${site.replace(/\/+$/, "")}${PATH}`,
    serviceAccount,
  });
  if (!ok) return NextResponse.json({ error: "no_autorizado" }, { status: 401 });

  try {
    const { sent, newSignups } = await sendWeeklyReport();
    console.info(`Reporte semanal: ${newSignups} alta(s), mail ${sent ? "enviado" : "no enviado"}`);
    return NextResponse.json({ ok: sent, newSignups }, { status: sent ? 200 : 502 });
  } catch (e) {
    console.error("Reporte semanal falló", (e as { code?: string }).code ?? (e as Error).name);
    return NextResponse.json({ error: "fallo_el_reporte" }, { status: 500 });
  }
}
