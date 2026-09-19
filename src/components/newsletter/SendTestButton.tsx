"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { sendTestNewsletter } from "@/app/newsletter-preview/actions";

export function SendTestButton() {
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await sendTestNewsletter();
            setResult(
              res.provider === "console"
                ? "Sent via the dev console adapter — check your terminal output."
                : `Sent via ${res.provider}.`,
            );
          })
        }
      >
        {pending ? "Sending…" : "Send test email"}
      </Button>
      {result && <p className="text-xs text-ink-soft">{result}</p>}
    </div>
  );
}
