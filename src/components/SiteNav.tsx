"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarClock,
  LayoutDashboard,
  LogIn,
  Menu,
  UserPlus,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { Role } from "@/lib/types";

interface SiteNavProps {
  fullName: string;
  role: Role;
  loggedOut: boolean;
}

export default function SiteNav({ fullName, role, loggedOut }: SiteNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = loggedOut
    ? [
        { href: "/", label: "Home" },
        { href: "/availability", label: "Availability" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/book", label: "Book a Slot" },
        { href: "/my-bookings", label: "My Bookings" },
        { href: "/availability", label: "Availability" },
        { href: "/profile", label: "Profile" },
        ...(role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
      ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-pine-950 text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember-500 text-lg">
            🏸
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold uppercase tracking-wide">
              SATI Sports Hall
            </span>
            <span className="hidden text-[11px] text-white/60 sm:block">
              Samrat Ashok Technological Institute · Vidisha
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition",
                isActive(link.href)
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
          {loggedOut ? (
            <div className="ml-2 flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <LogIn className="h-4 w-4" /> Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-full bg-ember-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember-500/90"
              >
                <UserPlus className="h-4 w-4" /> Register
              </Link>
            </div>
          ) : (
            <Link
              href="/profile"
              className="ml-2 flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3.5 transition hover:bg-white/15"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-court-500 text-xs font-bold text-white">
                {initials(fullName)}
              </span>
              <span className="max-w-[120px] truncate text-sm font-medium">
                {fullName}
              </span>
            </Link>
          )}
        </nav>

        <button
          className="rounded-lg p-2 text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-pine-950 px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive(link.href)
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10",
                )}
              >
                {link.href === "/my-bookings" && (
                  <CalendarClock className="h-4 w-4" />
                )}
                {link.href === "/" && <LayoutDashboard className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
            {loggedOut ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold"
                >
                  <LogIn className="h-4 w-4" /> Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ember-500 px-4 py-2.5 text-sm font-semibold"
                >
                  <UserPlus className="h-4 w-4" /> Register
                </Link>
              </div>
            ) : (
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-court-500 text-xs font-bold">
                  {initials(fullName)}
                </span>
                {fullName}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}