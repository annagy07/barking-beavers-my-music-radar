// Named entities beyond the 5 predefined XML ones (&amp; &lt; &gt; &quot;
// &apos;, which an XML parser already resolves) that WordPress-generated
// feeds commonly emit for typographic punctuation.
const NAMED_HTML_ENTITIES: Record<string, string> = {
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/**
 * Decodes numeric (&#8216; / &#x2018;) and the common named HTML entities
 * above. Needed because several blog feeds put titles in a CDATA section
 * whose content is *already* HTML-entity-encoded by the CMS before being
 * written into the feed (e.g. "&#8216;Nepo Baby&#8217;") — CDATA content is
 * raw text by definition, so no XML parser ever decodes entities inside
 * it. Used both where blog items are ingested (src/lib/sources/blogNews.ts,
 * so newly-synced titles are clean going in) and wherever a title/
 * description is displayed (RadarItemCard, the newsletter HTML render),
 * so any data already stored — or frozen into an old RadarEdition snapshot
 * from before this existed — self-heals on display instead of needing a
 * one-off data migration for every place it's read from.
 */
export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === "#") {
      const codePoint =
        entity[1] === "x" || entity[1] === "X"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return NAMED_HTML_ENTITIES[entity] ?? match;
  });
}
