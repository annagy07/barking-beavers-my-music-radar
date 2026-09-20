import "server-only";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Issues a fresh single-use login token for a user, invalidating any
 * still-valid tokens from earlier requests first — only the most recently
 * requested link should ever work. */
export async function createLoginToken(userId: string): Promise<string> {
  await db.loginToken.deleteMany({ where: { userId, usedAt: null } });

  const token = randomBytes(32).toString("hex");
  await db.loginToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  return token;
}

/** Validates and consumes a login token — single use, and only within its
 * TTL. Returns the userId to sign in as, or null if the token is missing,
 * expired, or already used. */
export async function consumeLoginToken(token: string): Promise<string | null> {
  const record = await db.loginToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;

  await db.loginToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}
