import { NextRequest, NextResponse } from "next/server";
import { draftRadarSchema } from "@/lib/validation";
import { generateDraftRadar } from "@/lib/radar/generateRadar";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = draftRadarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid preview request" },
      { status: 400 },
    );
  }

  const radar = await generateDraftRadar(parsed.data);
  return NextResponse.json({ radar });
}
