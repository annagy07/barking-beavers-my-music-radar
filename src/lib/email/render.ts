import "server-only";
import type { RadarItem, RadarResult } from "@/lib/radar/types";

const INK = "#14100f";
const INK_SOFT = "#4a4442";
const PAPER = "#ffffff";
const PAPER_RAISED = "#fff1f8";
const LINE = "#f0d7e6";
const ACCENT = "#fd6aba";

// Matches the site's .font-display (Anton, see src/app/layout.tsx) — email
// clients can't use next/font, so this loads it from Google Fonts directly
// via the <link> in each template's <head> instead, with the same bold
// condensed system fallback for clients that strip external font links
// (Gmail included) and just never load it.
const DISPLAY_FONT = "'Anton','Arial Narrow',Arial,Helvetica,sans-serif";
const GOOGLE_FONT_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet">';

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderItem(item: RadarItem) {
  const meta = [
    item.venue && item.city ? `${item.venue}, ${item.city}` : item.city,
    formatDate(item.eventDate ?? item.publishedAt),
  ]
    .filter(Boolean)
    .join(" · ");

  const textCell = `
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${INK_SOFT};margin-bottom:4px;">
                ${escapeHtml(item.artistName)}
              </div>
              <div style="font-family:${DISPLAY_FONT};font-size:19px;line-height:1.2;color:${INK};font-weight:700;margin-bottom:4px;">
                ${escapeHtml(item.title)}
              </div>
              ${meta ? `<div style="font-size:13px;color:${INK_SOFT};margin-bottom:6px;">${escapeHtml(meta)}</div>` : ""}
              <div style="font-size:14px;line-height:1.5;color:${INK};margin-bottom:8px;">
                ${escapeHtml(item.description)}
              </div>
              <div style="font-size:12.5px;line-height:1.5;color:${INK_SOFT};font-style:italic;">
                Why this is here: ${escapeHtml(item.reasons[0] ?? "")}
              </div>`;

  const body = item.imageUrl
    ? `
            <td style="padding:2px 16px 2px 16px;" valign="top">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr><td>
                <img src="${escapeHtml(item.imageUrl)}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;object-fit:cover;border:1px solid ${LINE};" />
              </td></tr></table>
            </td>
            <td style="padding:2px 0 2px 0;" valign="top">${textCell}
            </td>`
    : `
            <td style="padding:2px 0 2px 16px;">${textCell}
            </td>`;

  return `
    <tr>
      <td style="padding:0 0 22px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid ${ACCENT};">
          <tr>${body}
          </tr>
        </table>
      </td>
    </tr>`;
}

// Sections can hold up to 15 items (the web radar lets you expand to see
// them); an email has no "show more" interaction, so it always caps at
// the same 6-per-section count the radar shows by default.
const EMAIL_MAX_PER_SECTION = 6;

function renderSection(heading: string, items: RadarItem[]) {
  if (items.length === 0) return "";
  const visible = items.slice(0, EMAIL_MAX_PER_SECTION);
  return `
    <tr>
      <td style="padding:28px 0 10px 0;">
        <div style="font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};border-bottom:1px solid ${LINE};padding-bottom:8px;">
          ${escapeHtml(heading)}
        </div>
      </td>
    </tr>
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${visible.map(renderItem).join("")}
        </table>
      </td>
    </tr>`;
}

export interface NewsletterMeta {
  email: string;
  frequencyLabel: string;
  city: string | null;
  unsubscribeUrl: string;
  preferencesUrl: string;
  privacyUrl: string;
}

export function renderNewsletterHtml(radar: RadarResult, meta: NewsletterMeta) {
  const dateLabel = new Date(radar.generatedAt).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const sections = [
    renderSection("Just released", radar.sections.justReleased),
    renderSection("Upcoming", radar.sections.upcoming),
    renderSection("Live near you", radar.sections.liveNearYou),
    renderSection("Tour announcements", radar.sections.tours),
    renderSection("Presales", radar.sections.presales),
    renderSection("Music videos", radar.sections.videos),
    renderSection("Interviews", radar.sections.interviews),
    renderSection("Collaborations", radar.sections.collaborations),
    renderSection("Interesting facts", radar.sections.facts),
    renderSection("Blog coverage", radar.sections.blogNews),
    renderSection("Discovery", radar.sections.discovery),
  ].join("");

  const isEmpty = radar.items.length === 0;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Your music radar</title>
    ${GOOGLE_FONT_LINK}
  </head>
  <body style="margin:0;padding:0;background:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${PAPER};">
            <tr>
              <td style="padding-bottom:20px;border-bottom:2px solid ${INK};">
                <div style="font-family:${DISPLAY_FONT};font-size:26px;font-weight:400;letter-spacing:-0.01em;text-transform:uppercase;color:${ACCENT};">Barking Beaver</div>
                <div style="font-size:12px;color:${INK_SOFT};margin-top:4px;text-transform:uppercase;letter-spacing:0.08em;">Your personal music radar — ${escapeHtml(dateLabel)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 0 4px 0;font-size:14px;color:${INK_SOFT};">
                ${meta.city ? `Tracking your artists and shows within reach of ${escapeHtml(meta.city)}.` : "Tracking the artists and categories you chose."}
                No feed, no black-box algorithm — every item below says exactly why it's here.
              </td>
            </tr>
            ${
              isEmpty
                ? `<tr><td style="padding:40px 0;font-size:14px;color:${INK_SOFT};">Nothing matched your current preferences this cycle. Loosen your filters or add more artists in <a href="${meta.preferencesUrl}" style="color:${ACCENT};">Preferences</a>.</td></tr>`
                : sections
            }
            <tr>
              <td style="padding-top:28px;border-top:1px solid ${LINE};margin-top:20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER_RAISED};margin-top:20px;">
                  <tr>
                    <td style="padding:16px;font-size:12px;color:${INK_SOFT};line-height:1.6;">
                      Sent to ${escapeHtml(meta.email)} · ${escapeHtml(meta.frequencyLabel)} digest.<br />
                      You control every rule behind this email — edit them any time in
                      <a href="${meta.preferencesUrl}" style="color:${ACCENT};">Preferences</a>.
                      <a href="${meta.unsubscribeUrl}" style="color:${ACCENT};margin-left:8px;">Unsubscribe</a>
                      <a href="${meta.privacyUrl}" style="color:${ACCENT};margin-left:8px;">Privacy policy</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderLoginEmailHtml(link: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Sign in to Barking Beaver</title>
    ${GOOGLE_FONT_LINK}
  </head>
  <body style="margin:0;padding:0;background:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${PAPER};">
            <tr>
              <td style="padding-bottom:20px;border-bottom:2px solid ${INK};">
                <div style="font-family:${DISPLAY_FONT};font-size:26px;font-weight:400;letter-spacing:-0.01em;text-transform:uppercase;color:${ACCENT};">Barking Beaver</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 0 8px 0;font-family:${DISPLAY_FONT};font-size:22px;color:${INK};font-weight:700;">
                Sign in to your radar
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 24px 0;font-size:14px;line-height:1.6;color:${INK_SOFT};">
                Click below to sign in — no password needed. This link works once and expires in 15 minutes.
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:28px;">
                <a href="${link}" style="display:inline-block;background:${INK};color:${PAPER};font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;">Sign in</a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px;border-top:1px solid ${LINE};font-size:12px;color:${INK_SOFT};line-height:1.6;">
                Didn&rsquo;t request this? You can safely ignore this email — no one can sign in without clicking the link above.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
