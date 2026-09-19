import "server-only";
import { db } from "@/lib/db";
import { CONSENT_TEXT_VERSION } from "@/lib/consentCopy";

export { CONSENT_TEXT_VERSION, CONSENT_COPY } from "@/lib/consentCopy";

/** Records a new consent-ledger row. Consent history is append-only — a
 * withdrawal writes a new "withdrawn" row rather than mutating the grant. */
export async function grantConsent(userId: string, channel: "email" | "whatsapp") {
  return db.consent.create({
    data: {
      userId,
      channel,
      consentStatus: "granted",
      consentTextVersion: CONSENT_TEXT_VERSION,
    },
  });
}

export async function withdrawConsent(userId: string, channel: "email" | "whatsapp") {
  return db.consent.create({
    data: {
      userId,
      channel,
      consentStatus: "withdrawn",
      consentTextVersion: CONSENT_TEXT_VERSION,
      withdrawalTimestamp: new Date(),
    },
  });
}
