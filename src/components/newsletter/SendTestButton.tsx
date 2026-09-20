"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { sendTestNewsletter } from "@/app/newsletter-preview/actions";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function SendTestButton() {
  const { t } = useLocale();
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
                ? t.newsletterPreview.sentConsole
                : t.newsletterPreview.sentVia(res.provider),
            );
          })
        }
      >
        {pending ? t.newsletterPreview.sending : t.newsletterPreview.sendTest}
      </Button>
      {result && <p className="text-xs text-ink-soft">{result}</p>}
    </div>
  );
}
