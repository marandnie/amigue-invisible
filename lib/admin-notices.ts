import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import { sendEmails } from "@/lib/email/send";
import { signupNoticeEmail, weeklyReportEmail, WEEKLY_LIST_LIMIT, type WeeklySignup } from "@/lib/email/templates";
import { adminDb } from "@/lib/firebase/admin";
import { formatEventDate, formatShortDate } from "@/lib/format";

// Feature 004: avisos para la administradora. Los logs llevan solo cantidades (FR-008).

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function adminEmail(): string | null {
  const v = process.env.ADMIN_EMAIL?.trim();
  return v ? v : null;
}

function consoleUrl(): string {
  const project = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? "amigue-invisible-604df";
  return `https://console.firebase.google.com/project/${project}/authentication/users`;
}

async function countUsers(since?: Date): Promise<number> {
  const col = adminDb().collection("users");
  const q = since ? col.where("lastLoginAt", ">=", Timestamp.fromDate(since)) : col;
  return (await q.count().get()).data().count;
}

/** Aviso inmediato de alta (US1). Nunca lanza: el ingreso no puede fallar por esto. */
export async function notifySignup(p: { displayName: string; email: string; providers: string[] }): Promise<void> {
  const to = adminEmail();
  if (!to) return;
  try {
    const totalUsers = await countUsers().catch(() => null);
    const result = await sendEmails([
      {
        to,
        ...signupNoticeEmail({
          ...p,
          createdAt: formatEventDate(new Date()) ?? "",
          totalUsers,
          consoleUrl: consoleUrl(),
        }),
      },
    ]);
    if (result.failed > 0) console.error("Aviso de alta: no se pudo mandar");
  } catch (e) {
    console.error("Aviso de alta falló", (e as Error).name);
  }
}

function toDate(v: unknown): Date | null {
  return v instanceof Timestamp ? v.toDate() : null;
}

export async function buildWeeklyReport(now: Date = new Date()) {
  const since = new Date(now.getTime() - WEEK_MS);
  const snap = await adminDb()
    .collection("users")
    .where("createdAt", ">=", Timestamp.fromDate(since))
    .orderBy("createdAt", "desc")
    .limit(WEEKLY_LIST_LIMIT)
    .get();
  const [newTotal, activeUsers, totalUsers] = await Promise.all([
    adminDb().collection("users").where("createdAt", ">=", Timestamp.fromDate(since)).count().get(),
    countUsers(since),
    countUsers(),
  ]);
  const signups: WeeklySignup[] = snap.docs.map((d) => ({
    displayName: String(d.get("displayName") ?? "Sin nombre"),
    email: String(d.get("email") ?? ""),
    providers: Array.isArray(d.get("providers")) ? (d.get("providers") as string[]) : [],
    createdAt: formatEventDate(toDate(d.get("createdAt"))) ?? "",
    lastLoginAt: formatEventDate(toDate(d.get("lastLoginAt"))),
  }));
  return {
    period: `${formatShortDate(since)} al ${formatShortDate(now)}`,
    signups,
    moreSignups: Math.max(0, newTotal.data().count - signups.length),
    activeUsers,
    totalUsers,
    consoleUrl: consoleUrl(),
  };
}

/** Reporte semanal (US2). Devuelve si se mandó; lanza si falla la consulta. */
export async function sendWeeklyReport(): Promise<{ sent: boolean; newSignups: number }> {
  const to = adminEmail();
  if (!to) return { sent: false, newSignups: 0 };
  const report = await buildWeeklyReport();
  const result = await sendEmails([{ to, ...weeklyReportEmail(report) }]);
  return { sent: result.sent > 0, newSignups: report.signups.length + report.moreSignups };
}
