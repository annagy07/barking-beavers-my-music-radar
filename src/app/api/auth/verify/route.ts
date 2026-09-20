import { NextRequest, NextResponse } from "next/server";
import { consumeLoginToken } from "@/lib/auth/loginToken";
import { setSessionUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const origin = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=missing`);
  }

  const userId = await consumeLoginToken(token);
  if (!userId) {
    return NextResponse.redirect(`${origin}/login?error=expired`);
  }

  await setSessionUserId(userId);
  return NextResponse.redirect(`${origin}/radar`);
}
