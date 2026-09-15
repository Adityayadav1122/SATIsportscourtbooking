"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { AdminBookingRow } from "@/lib/types";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/slots";
import { cn } from "@/lib/utils";
import { adminCancelBooking as cancelBooking } from "@/app/actions";

export default function AdminBookingsTable({
  rows,
}: {
  rows: AdminBookingRow[];
}) {
  const [localRows, setLocalRows] = useState(rows);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cancel(id: string) {
    setLoadingId(id);
    setError(null);
    const result = await cancelBooking(id);
    setLoadingId(null);
    if (result.ok) {
      setLocalRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "cancelled" as const, cancelled_at: new Date().toISOString() }
            : r,
        ),
      );
    } else {
      setError(result.error ?? "Failed to cancel booking.");
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg bg-ember-100 px-3 py-2 text-sm text-ember-500">{error}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-pine-800/10 text-left text-xs font-bold uppercase tracking-wide text-pine-600">
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2">Sport</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pine-800/5">
            {localRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-ink/40">
                  No bookings for these filters.
                </td>
              </tr>
            )}
            {localRows.map((r) => (
              <tr key={r.id} className="align-middle">
                <td className="px-3 py-3">
                  <p className="font-semibold text-pine-900">{r.member_name}</p>
                  <p className="font-mono text-[11px] text-ink/40">{r.member_id} · {r.role}</p>
                </td>
                <td className="px-3 py-3 text-pine-800">{r.sport_name}</td>
                <td className="px-3 py-3 text-ink/70">{formatDateDisplay(r.booking_date)}</td>
                <td className="px-3 py-3 text-ink/70">{formatTimeDisplay(r.start_time)}</td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase",
                      r.status === "confirmed" && "bg-court-100 text-court-500",
                      r.status === "completed" && "bg-pine-100 text-pine-600",
                      r.status === "cancelled" && "bg-ember-100 text-ember-500",
                    )}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  {r.status === "confirmed" && (
                    <button
                      onClick={() => cancel(r.id)}
                      disabled={loadingId === r.id}
                      className="rounded-md bg-ember-500/10 px-3 py-1 text-xs font-bold text-ember-500 transition hover:bg-ember-500 hover:text-white disabled:opacity-50"
                    >
                      {loadingId === r.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Cancel"
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
