"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { requestLoginLink } from "@/app/login/actions";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function LoginForm() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <p className="text-sm text-ink-soft">
        {t.login.sentBefore}
        <strong className="text-ink">{email}</strong>
        {t.login.sentAfter}
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await requestLoginLink(email);
          setSent(true);
        });
      }}
    >
      <label className="font-mono text-xs uppercase tracking-wide text-ink-soft">
        {t.login.emailLabel}
      </label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t.login.emailPlaceholder}
        className="mt-2 w-full border border-ink bg-paper px-4 py-3 text-base outline-none focus:border-accent"
      />
      <Button type="submit" size="lg" className="mt-5 w-full" disabled={pending}>
        {pending ? t.login.submitting : t.login.submit}
      </Button>
    </form>
  );
}
