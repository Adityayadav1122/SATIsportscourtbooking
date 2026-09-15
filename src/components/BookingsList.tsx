"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import type { Booking } from "@/lib/types";
import { formatDateDisplay, formatTimeDisplay, bucketOfBooking } from "@/lib/slots";
import { cn } from "@/lib/utils";
import { cancelBooking } from "@/app/actions";

export default function BookingsList({
  initialBookings,
}: {
  initialBookings: (Booking & { sport?: { name: string; icon: string; slug: string } })[];
}) {
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [bookings, setBookings] = useState(initialBookings);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buckets = {
    upcoming: bookings.filter((b) => bucketOfBooking(b) === "upcoming"),
    past: bookings.filter((b) => bucketOfBooking(b) === "completed"),
    cancelled: bookings.filter((b) => b.status === "cancelled"),
  };

  async function handleCancel(id: string) {
    setLoadingId(id);
    setError(null);
    const result = await cancelBooking(id);
    setLoadingId(null);
    setConfirmCancel(null);
    if (result.ok) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, status: "cancelled" as const, cancelled_at: new Date().toISOString() }
            : b,
        ),
      );
    } else {
      setError(result.error ?? "Failed to cancel booking.");
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-pine-100 p-1">
        {(["upcoming", "past", "cancelled"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-bold capitalize transition",
              tab === t
                ? "bg-white text-pine-900 shadow-sm"
                : "text-pine-600 hover:text-pine-900",
            )}
          >
            {t} ({buckets[t].length})
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-ember-100 px-3 py-2 text-sm text-ember-500">{error}</p>
      )}

      <div className="mt-4 space-y-3">
        {buckets[tab].length === 0 && (
          <div className="rounded-xl border border-pine-800/10 bg-white p-8 text-center text-sm text-ink/50">
            {tab === "upcoming"
              ? "No upcoming bookings. Book a slot to get started!"
              : `No ${tab} bookings.`}
          </div>
        )}
        {buckets[tab].map((b) => (
          <div
            key={b.id}
            className="flex flex-col gap-3 rounded-xl border border-pine-800/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
          >
            <span className="text-3xl">{b.sport?.icon ?? "🏸"}</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold uppercase text-pine-900">
                {b.sport?.name ?? "Sport"}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/60">
                <span>{formatDateDisplay(b.booking_date)}</span>
                <span>{formatTimeDisplay(b.start_time)}</span>
                <span className="font-mono text-xs text-ink/40">ID: {b.id.slice(0, 8)}…</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                  b.status === "confirmed" && "bg-court-100 text-court-500",
                  b.status === "completed" && "bg-pine-100 text-pine-600",
                  b.status === "cancelled" && "bg-ember-100 text-ember-500",
                )}
              >
                {b.status === "confirmed" && <CheckCircle2 className="h-3 w-3" />}
                {b.status === "completed" && <Clock className="h-3 w-3" />}
                {b.status === "cancelled" && <XCircle className="h-3 w-3" />}
                {b.status}
              </span>
              {b.status === "confirmed" && confirmCancel !== b.id && (
                <button
                  onClick={() => setConfirmCancel(b.id)}
                  className="text-xs font-semibold text-ember-500 hover:text-ember-500/80"
                >
                  Cancel
                </button>
              )}
              {confirmCancel === b.id && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-ink/50">Cancel this?</span>
                  <button
                    disabled={loadingId === b.id}
                    onClick={() => handleCancel(b.id)}
                    className="rounded-md bg-ember-500 px-2.5 py-1 font-bold text-white hover:bg-ember-500/90 disabled:opacity-60"
                  >
                    {loadingId === b.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Yes"
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmCancel(null)}
                    className="text-pine-600 hover:text-pine-800"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}