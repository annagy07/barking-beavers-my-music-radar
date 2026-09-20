"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Container";
import {
  deleteAccount,
  deleteSpotifyTasteData,
  disconnectSpotify,
  pauseNewsletter,
  resubscribeNewsletter,
  resumeNewsletter,
  unsubscribeNewsletter,
} from "@/app/settings/actions";
import { logOut } from "@/app/login/actions";

export function SettingsManager({
  email,
  spotifyConnected,
  spotifyImportedCount,
  newsletterStatus,
}: {
  email: string;
  spotifyConnected: boolean;
  spotifyImportedCount: number;
  newsletterStatus: "active" | "paused" | "unsubscribed";
}) {
  const [connected, setConnected] = useState(spotifyConnected);
  const [importedCount, setImportedCount] = useState(spotifyImportedCount);
  const [status, setStatus] = useState(newsletterStatus);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          Your radar
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/preferences">
            <span className="inline-flex items-center border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper">
              Edit preferences
            </span>
          </Link>
          <Link href="/artists">
            <span className="inline-flex items-center border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper">
              Manage artists
            </span>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          Connected services
        </h2>
        <Card className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Spotify</p>
            <p className="text-xs text-ink-soft">
              {connected
                ? "Connected · read-only access"
                : "Not connected"}
              {importedCount > 0 ? ` · ${importedCount} artists imported` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {connected && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await disconnectSpotify();
                    setConnected(false);
                  })
                }
                className="border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-paper"
              >
                Disconnect
              </button>
            )}
            {importedCount > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteSpotifyTasteData();
                    setImportedCount(0);
                  })
                }
                className="border border-ink px-3 py-1.5 text-xs hover:bg-red-700 hover:text-white hover:border-red-700"
              >
                Delete imported taste data
              </button>
            )}
            {!connected && (
              <a
                href="/api/spotify/authorize"
                className="border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-paper"
              >
                Connect
              </a>
            )}
          </div>
        </Card>
        <Card className="mt-3 flex items-center justify-between opacity-60">
          <div>
            <p className="font-medium">Bandsintown</p>
            <p className="text-xs text-ink-soft">Coming later</p>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          Delivery
        </h2>
        <Card className="mt-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{email}</p>
              <p className="mt-1 text-xs text-ink-soft">
                Newsletter is currently{" "}
                <span
                  className={
                    status === "active" ? "text-positive" : "text-accent"
                  }
                >
                  {status}
                </span>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => startTransition(() => logOut())}
              className="shrink-0 font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
            >
              Log out
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {status === "active" && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await pauseNewsletter();
                    setStatus("paused");
                  })
                }
                className="border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-paper"
              >
                Pause newsletter
              </button>
            )}
            {status === "paused" && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await resumeNewsletter();
                    setStatus("active");
                  })
                }
                className="border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-paper"
              >
                Resume newsletter
              </button>
            )}
            {status !== "unsubscribed" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await unsubscribeNewsletter();
                    setStatus("unsubscribed");
                  })
                }
                className="border border-ink px-3 py-1.5 text-xs hover:bg-red-700 hover:text-white hover:border-red-700"
              >
                Unsubscribe
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await resubscribeNewsletter();
                    setStatus("active");
                  })
                }
                className="border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-paper"
              >
                Re-subscribe
              </button>
            )}
          </div>
        </Card>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          Danger zone
        </h2>
        <Card className="mt-3 border-accent/50">
          <p className="font-medium">Delete account</p>
          <p className="mt-1 text-xs text-ink-soft">
            Permanently deletes your artists, preferences, consent history and
            connected services. This can&rsquo;t be undone.
          </p>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-4 border border-ink px-3 py-1.5 text-xs hover:bg-red-700 hover:text-white hover:border-red-700"
            >
              Delete account
            </button>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="danger"
                size="sm"
                disabled={pending}
                onClick={() => startTransition(() => deleteAccount())}
              >
                {pending ? "Deleting…" : "Yes, permanently delete"}
              </Button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-ink-soft hover:text-ink"
              >
                Cancel
              </button>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
