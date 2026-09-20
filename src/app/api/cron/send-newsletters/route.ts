import { NextRequest, NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cronAuth";
import { sendScheduledNewsletters } from "@/lib/email/sendScheduled";

// Runs once a day, after the content-sync crons (see vercel.json) so the
// digest reflects freshly-synced content. Sends to every active subscriber
// whose chosen frequency makes them due today — see sendScheduledNewsletters
// for the day-of-week rules and idempotency (lastSentAt).
export const maxDuration = 60;

async function handleSend(request: NextRequest) {
  const auth = checkCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const summary = await sendScheduledNewsletters();
  return NextResponse.json({ ok: true, summary });
}

export async function GET(request: NextRequest) {
  return handleSend(request);
}

export async function POST(request: NextRequest) {
  return handleSend(request);
}
