"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Container";
import { useLocale } from "@/components/i18n/LocaleProvider";
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
  playlistScoped,
  playlistId,
  playlistStatus,
}: {
  email: string;
  spotifyConnected: boolean;
  spotifyImportedCount: number;
  newsletterStatus: "active" | "paused" | "unsubscribed";
  playlistScoped: boolean;
  playlistId: string | null;
  playlistStatus: "connected" | "error" | null;
}) {
  const { t } = useLocale();
  const [connected, setConnected] = useState(spotifyConnected);
  const [hasPlaylistScope, setHasPlaylistScope] = useState(playlistScoped);
  const [importedCount, setImportedCount] = useState(spotifyImportedCount);
  const [status, setStatus] = useState(newsletterStatus);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const statusLabel =
    status === "active"
      ? t.settings.statusActive
      : status === "paused"
        ? t.settings.statusPaused
        : t.settings.statusUnsubscribed;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {t.settings.yourRadar}
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/preferences">
            <span className="inline-flex items-center border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper">
              {t.settings.editPreferences}
            </span>
          </Link>
          <Link href="/artists">
            <span className="inline-flex items-center border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper">
              {t.settings.manageArtists}
            </span>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {t.settings.connectedServices}
        </h2>
        <Card className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{t.settings.spotify}</p>
            <p className="text-xs text-ink-soft">
              {connected ? t.settings.connected : t.settings.notConnected}
              {importedCount > 0 ? ` · ${t.settings.artistsImported(importedCount)}` : ""}
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
                    setHasPlaylistScope(false);
                  })
                }
                className="border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-paper"
              >
                {t.settings.disconnect}
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
                {t.settings.deleteImportedData}
              </button>
            )}
            {!connected && (
              <a
                href="/api/spotify/authorize"
                className="border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-paper"
              >
                {t.settings.connect}
              </a>
            )}
          </div>
        </Card>

        <Card className="mt-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{t.settings.playlistTitle}</p>
              <p className="text-xs text-ink-soft">
                {hasPlaylistScope
                  ? playlistId
                    ? t.settings.playlistConnected
                    : t.settings.playlistPending
                  : t.settings.playlistScopeNote}
              </p>
            </div>
            {hasPlaylistScope ? (
              playlistId && (
                <a
                  href={`https://open.spotify.com/playlist/${playlistId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-paper"
                >
                  {t.settings.playlistOpen}
                </a>
              )
            ) : (
              <a
                href="/api/spotify/playlist/authorize"
                className="shrink-0 border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-paper"
              >
                {t.settings.playlistConnect}
              </a>
            )}
          </div>
          {playlistStatus === "connected" && (
            <p className="mt-3 text-xs text-positive">{t.settings.playlistSuccessBanner}</p>
          )}
          {playlistStatus === "error" && (
            <p className="mt-3 text-xs text-accent">{t.settings.playlistErrorBanner}</p>
          )}
        </Card>

        <Card className="mt-3 flex items-center justify-between opacity-60">
          <div>
            <p className="font-medium">{t.settings.bandsintown}</p>
            <p className="text-xs text-ink-soft">{t.settings.comingLater}</p>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {t.settings.delivery}
        </h2>
        <Card className="mt-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{email}</p>
              <p className="mt-1 text-xs text-ink-soft">
                {t.settings.newsletterCurrently}{" "}
                <span
                  className={
                    status === "active" ? "text-positive" : "text-accent"
                  }
                >
                  {statusLabel}
                </span>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => startTransition(() => logOut())}
              className="shrink-0 font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
            >
              {t.settings.logOut}
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
                {t.settings.pauseNewsletter}
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
                {t.settings.resumeNewsletter}
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
                {t.settings.unsubscribe}
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
                {t.settings.resubscribe}
              </button>
            )}
          </div>
        </Card>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {t.settings.dangerZone}
        </h2>
        <Card className="mt-3 border-accent/50">
          <p className="font-medium">{t.settings.deleteAccount}</p>
          <p className="mt-1 text-xs text-ink-soft">{t.settings.deleteAccountBody}</p>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-4 border border-ink px-3 py-1.5 text-xs hover:bg-red-700 hover:text-white hover:border-red-700"
            >
              {t.settings.deleteAccount}
            </button>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="danger"
                size="sm"
                disabled={pending}
                onClick={() => startTransition(() => deleteAccount())}
              >
                {pending ? t.settings.deleting : t.settings.deleteConfirm}
              </Button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-ink-soft hover:text-ink"
              >
                {t.settings.cancel}
              </button>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
