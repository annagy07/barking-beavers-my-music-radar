import "server-only";
import { db } from "@/lib/db";
import type { RadarResult } from "./types";

export interface RadarEditionSummary {
  id: string;
  generatedAt: string;
  itemCount: number;
}

/** Writes a frozen snapshot of a radar exactly as emailed — see
 * RadarEdition in schema.prisma for why (only called from the real
 * scheduled send, never a preview or test-send). */
export async function saveRadarEdition(userId: string, radar: RadarResult) {
  await db.radarEdition.create({
    data: {
      userId,
      generatedAt: new Date(radar.generatedAt),
      itemCount: radar.items.length,
      radarJson: JSON.stringify(radar),
    },
  });
}

export async function getLatestRadarEdition(userId: string): Promise<RadarResult | null> {
  const edition = await db.radarEdition.findFirst({
    where: { userId },
    orderBy: { generatedAt: "desc" },
  });
  return edition ? (JSON.parse(edition.radarJson) as RadarResult) : null;
}

export async function listRadarEditions(userId: string): Promise<RadarEditionSummary[]> {
  const editions = await db.radarEdition.findMany({
    where: { userId },
    orderBy: { generatedAt: "desc" },
    select: { id: true, generatedAt: true, itemCount: true },
  });
  return editions.map((e) => ({
    id: e.id,
    generatedAt: e.generatedAt.toISOString(),
    itemCount: e.itemCount,
  }));
}

export async function getRadarEditionById(
  userId: string,
  id: string,
): Promise<RadarResult | null> {
  // Scoped to userId, not just id — a guessed/enumerated edition id must
  // never leak another user's radar.
  const edition = await db.radarEdition.findFirst({ where: { id, userId } });
  return edition ? (JSON.parse(edition.radarJson) as RadarResult) : null;
}
