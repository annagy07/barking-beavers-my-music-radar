import "server-only";
import type { NextRequest } from "next/server";

/** Shared Bearer-token guard for every /api/cron and /api/admin route —
 * Vercel automatically attaches this as `Authorization: Bearer $CRON_SECRET`
 * on its own scheduled Cron requests once that env var is set, which
 * doubles as the guard against anyone else calling these routes. */
export function checkCronSecret(
  request: NextRequest,
): { ok: true } | { ok: false; status: number; error: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { ok: false, status: 403, error: "CRON_SECRET is not configured" };
  }

  const authHeader = request.headers.get("authorization");
  const provided = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!provided || provided !== secret) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}
