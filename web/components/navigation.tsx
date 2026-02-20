"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/library", label: "Library" },
  { href: "/analytics", label: "Analytics" },
] as const;

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--surface-0)] backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="font-display text-2xl leading-none text-[var(--accent-signal)] tracking-widest select-none"
          onClick={closeMobile}
        >
          AMA STREAM
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`
                    text-xs font-medium uppercase tracking-[0.15em] transition-colors
                    ${
                      active
                        ? "text-[var(--accent-signal)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                    }
                  `}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="relative flex md:hidden h-8 w-8 items-center justify-center text-[var(--text-muted)]"
          onClick={toggleMobile}
        >
          <span className="sr-only">Toggle menu</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="transition-transform"
            aria-hidden="true"
          >
            {mobileOpen ? (
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-0)] backdrop-blur-xl md:hidden">
          <ul className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map(({ href, label }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={closeMobile}
                    className={`
                      block rounded-md px-3 py-2 text-xs font-medium uppercase tracking-[0.15em] transition-colors
                      ${
                        active
                          ? "bg-[var(--surface-1)] text-[var(--accent-signal)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--surface-1)] hover:text-[var(--text-strong)]"
                      }
                    `}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
