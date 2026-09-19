import {
  CATEGORY_TO_EVENT,
  CONTENT_CATEGORIES,
  ContentCategoryId,
  RELEVANCE_WEIGHT,
  RelevanceId,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Deterministic, fully transparent scoring rules. No ML, no collaborative
// filtering, no hidden weights — every number here is documented and every
// point awarded ends up in a human-readable reason string.
// ---------------------------------------------------------------------------

export const SCORE_GENRE_OR_RELATION_MATCH = 20;
export const SCORE_CONCERT_IN_RADIUS = 20;
export const SCORE_CATEGORY_ENABLED = 15;
export const SCORE_FRESH_ITEM = 10;
export const SCORE_TRUSTED_SOURCE = 10;
export const FRESH_WINDOW_DAYS = 7;
export const TRUSTED_SOURCE_THRESHOLD = 90;

export function explicitArtistMatchScore(relevance: RelevanceId): number {
  return RELEVANCE_WEIGHT[relevance];
}

export function isFresh(publishedAt: Date, now: Date): boolean {
  const diffDays = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= FRESH_WINDOW_DAYS;
}

export function isTrustedSource(credibilityScore: number): boolean {
  return credibilityScore >= TRUSTED_SOURCE_THRESHOLD;
}

const categoryLabel = new Map(CONTENT_CATEGORIES.map((c) => [c.id, c.label]));

export function labelForCategory(id: ContentCategoryId) {
  return categoryLabel.get(id) ?? id;
}

/**
 * Given the set of categories a user opted into, returns a lookup that
 * tells us, for a given (event type, event subtype), whether it's allowed
 * and which category justified it (for the "why am I seeing this" text).
 */
export function buildCategoryMatcher(enabled: ContentCategoryId[]) {
  const byType = new Map<string, { subtypes: Set<string> | null; categoryId: ContentCategoryId }[]>();

  for (const id of enabled) {
    const mapping = CATEGORY_TO_EVENT[id];
    const list = byType.get(mapping.type) ?? [];
    list.push({
      subtypes: mapping.subtypes ? new Set(mapping.subtypes) : null,
      categoryId: id,
    });
    byType.set(mapping.type, list);
  }

  return function match(
    type: string,
    subtype: string | null,
  ): ContentCategoryId | null {
    const candidates = byType.get(type);
    if (!candidates) return null;
    for (const c of candidates) {
      if (!c.subtypes) return c.categoryId;
      if (subtype && c.subtypes.has(subtype)) return c.categoryId;
    }
    return null;
  };
}
