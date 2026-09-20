"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { requestLoginLink } from "@/app/login/actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <p className="text-sm text-ink-soft">
        If <strong className="text-ink">{email}</strong> has a Barking Beaver
        account, a sign-in link is on its way — check your inbox (and spam
        folder). The link works once and expires in 15 minutes.
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
        Email address
      </label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="mt-2 w-full border border-ink bg-paper px-4 py-3 text-base outline-none focus:border-accent"
      />
      <Button type="submit" size="lg" className="mt-5 w-full" disabled={pending}>
        {pending ? "Sending…" : "Send me a sign-in link"}
      </Button>
    </form>
  );
}
