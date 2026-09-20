import "server-only";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  readonly name: string;
  sendEmail(params: SendEmailParams): Promise<{ id: string }>;
}

/** Default dev adapter: logs to the server console instead of sending. */
const consoleEmailProvider: EmailProvider = {
  name: "console",
  async sendEmail({ to, subject }) {
    const id = `dev-${Date.now()}`;
    console.log(
      `[email:console] would send "${subject}" to ${to} (id=${id}). Visit /newsletter-preview to see the rendered version.`,
    );
    return { id };
  },
};

/** Thin adapter for Resend, used only when RESEND_API_KEY is configured. */
const resendEmailProvider: EmailProvider = {
  name: "resend",
  async sendEmail({ to, subject, html }) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Barking Beaver <radar@example.com>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend send failed: ${res.status}`);
    }
    const json = await res.json();
    return { id: json.id };
  },
};

export const emailProvider: EmailProvider = process.env.RESEND_API_KEY
  ? resendEmailProvider
  : consoleEmailProvider;
