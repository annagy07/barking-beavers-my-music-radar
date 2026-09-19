import { randomBytes, createHash } from "node:crypto";

function base64url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function createCodeVerifier() {
  return base64url(randomBytes(64));
}

export function createCodeChallenge(verifier: string) {
  return base64url(createHash("sha256").update(verifier).digest());
}

export function createState() {
  return base64url(randomBytes(16));
}
