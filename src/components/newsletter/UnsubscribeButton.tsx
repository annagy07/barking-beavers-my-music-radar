"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { unsubscribeNewsletter } from "@/app/settings/actions";

export function UnsubscribeButton() {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return <p className="text-sm text-positive">You&rsquo;re unsubscribed.</p>;
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
      {pending ? "Unsubscribing…" : "Unsubscribe me"}
    </Button>
  );
}
