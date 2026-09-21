"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** Burger-menu nav for narrow screens — the same links SiteHeader lays out
 * horizontally above the `sm` breakpoint don't fit side by side on a phone
 * without becoming hard to tap accurately, so below it they collapse into
 * this dropdown instead. */
export function MobileNav({
  nav,
  active,
  menuLabel,
}: {
  nav: { href: string; label: string }[];
  active?: string;
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={menuLabel}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 border border-line"
      >
        <span
          className={
            "block h-0.5 w-5 bg-ink transition-transform " +
            (open ? "translate-y-2 rotate-45" : "")
          }
        />
        <span
          className={"block h-0.5 w-5 bg-ink transition-opacity " + (open ? "opacity-0" : "")}
        />
        <span
          className={
            "block h-0.5 w-5 bg-ink transition-transform " +
            (open ? "-translate-y-2 -rotate-45" : "")
          }
        />
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-16 z-30 border-b border-line bg-paper px-4 py-4 font-mono text-xs uppercase tracking-wide shadow-sm">
          <ul className="flex flex-col gap-4">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={active === item.href ? "text-accent" : "text-ink-soft hover:text-ink"}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
