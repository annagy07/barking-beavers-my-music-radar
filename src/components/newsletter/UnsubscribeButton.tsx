"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { unsubscribeNewsletter } from "@/app/settings/actions";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function UnsubscribeButton() {
  const { t } = useLocale();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return <p className="text-sm text-positive">{t.unsubscribe.done}</p>;
  }

  return (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await unsubscribeNewsletter();
          setDone(true);
        })
      }
    >
      {pending ? t.unsubscribe.unsubscribing : t.unsubscribe.button}
    </Button>
  );
}
