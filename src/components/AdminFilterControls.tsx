"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Sport } from "@/lib/types";
import { todayIST } from "@/lib/slots";

export default function AdminFilterControls({
  filterDate,
  filterSport,
  filterRole,
  sports,
}: {
  filterDate: string | null;
  filterSport: number | null;
  filterRole: string | null;
  sports: Sport[];
}) {
  const router = useRouter();

  function buildHref(changes: Record<string, string | null>) {
    const sp = new URLSearchParams();
    const merged = {
      date: filterDate,
      sport: filterSport != null ? String(filterSport) : null,
      role: filterRole,
      ...changes,
    };
    if (merged.date) sp.set("date", merged.date);
    if (merged.sport) sp.set("sport", merged.sport);
    if (merged.role) sp.set("role", merged.role);
    const qs = sp.toString();
    return qs ? `/admin?${qs}` : "/admin";
  }

  return (
    <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-pine-800/10 bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase text-pine-700">Date</span>
        <input
          type="date"
          defaultValue={filterDate ?? ""}
          onChange={(e) => router.push(buildHref({ date: e.target.value || null }))}
          className="rounded-lg border border-pine-800/15 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase text-pine-700">Sport</span>
        <select
          defaultValue={filterSport ?? ""}
          onChange={(e) => router.push(buildHref({ sport: e.target.value || null }))}
          className="rounded-lg border border-pine-800/15 px-3 py-2 text-sm"
        >
          <option value="">All sports</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase text-pine-700">Member type</span>
        <select
          defaultValue={filterRole ?? ""}
          onChange={(e) => router.push(buildHref({ role: e.target.value || null }))}
          className="rounded-lg border border-pine-800/15 px-3 py-2 text-sm"
        >
          <option value="">All members</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>
      </label>
      <Link
        href={buildHref({ date: todayIST() })}
        className="ml-auto rounded-lg border border-pine-800/15 px-3 py-2 text-sm font-semibold text-pine-600 hover:bg-pine-100/50"
      >
        Today
      </Link>
      <Link
        href={buildHref({ date: null })}
        className="rounded-lg border border-pine-800/15 px-3 py-2 text-sm text-ink/50 hover:bg-pine-100/50"
      >
        Clear
      </Link>
    </div>
  );
}