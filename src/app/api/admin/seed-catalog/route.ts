import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCatalog } from "@/lib/seedCatalog";

/**
 * Protected, idempotent, one-off catalog seeding for production. Never
 * deletes anything and never touches User/UserArtistPreference/
 * UserPreference/Consent/ConnectedAccount/NewsletterSubscription, so it's
 * safe to run even after real accounts exist. Requires ADMIN_SEED_TOKEN to
 * be set — with no token configured, this always refuses.
 */
export async function POST(request: NextRequest) {
  const configuredToken = process.env.ADMIN_SEED_TOKEN;
  if (!configuredToken) {
    return NextResponse.json(
      { error: "ADMIN_SEED_TOKEN is not configured" },
      { status: 403 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const provided = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!provided || provided !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await seedCatalog(db);
  return NextResponse.json({ ok: true, summary });
}
