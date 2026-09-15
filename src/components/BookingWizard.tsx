"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  CalendarClock,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { bookingWizard } from "@/app/actions";
import {
  formatDateDisplay,
  formatTimeDisplay,
  isBookable,
  todayIST,
  MORNING_SLOTS,
  EVENING_SLOTS,
  selectableDates,
} from "@/lib/slots";
import type { Sport, OccupancyRow } from "@/lib/types";

interface Props {
  sports: Sport[];
  initialSportSlug?: string;
}

interface GroupedSlot {
  start_time: string;
  end_time: string;
  status: "available" | "booked" | "closed";
  booking_id: string | null;
  mine: boolean;
}

function toEnd(start: string): string {
  return start.replace(/^(\d+)/, (_: string, h: string) =>
    String(Number(h) + 1).padStart(2, "0"),
  );
}

export default function BookingWizard({ sports, initialSportSlug }: Props) {
  const preselected = sports.find((s) => s.slug === initialSportSlug);

  const [step, setStep] = useState(preselected ? 2 : 1);
  const [sport, setSport] = useState<Sport | null>(preselected ?? null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyRow[]>([]);
  const [loadingOcc, setLoadingOcc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const availableDates = selectableDates();

  const groupedSlots = useMemo(() => {
    if (!date || !sport) return { morning: [] as GroupedSlot[], evening: [] as GroupedSlot[] };
    const byTime = Object.fromEntries(occupancy.map((o) => [o.start_time.slice(0, 5), o]));
    const map = (times: string[]): GroupedSlot[] =>
      times.map((t) => {
        const occ = byTime[t];
        if (occ) {
          return {
            start_time: occ.start_time.slice(0, 5),
            end_time: occ.end_time.slice(0, 5),
            status: "booked",
            booking_id: occ.booking_id,
            mine: occ.mine,
          };
        }
        if (!isBookable(date, t)) {
          return {
            start_time: t,
            end_time: toEnd(t),
            status: "closed",
            booking_id: null,
            mine: false,
          };
        }
        return {
          start_time: t,
          end_time: toEnd(t),
          status: "available",
          booking_id: null,
          mine: false,
        };
      });
    return { morning: map(MORNING_SLOTS), evening: map(EVENING_SLOTS) };
  }, [date, sport, occupancy]);

  function selectSport(s: Sport) {
    setSport(s);
    setStep(2);
  }

  function selectDate(d: string) {
    setDate(d);
    setTime(null);
    setStep(3);
    setLoadingOcc(true);
    setError(null);
    bookingWizard({ kind: "slots", date: d })
      .then((r) => {
        if (r.kind !== "slots") {
          setError("Failed to load availability.");
          return;
        }
        const result = r.result;
        if (result.ok && result.data) setOccupancy(result.data);
        else setError(result.error ?? "Failed to load availability.");
      })
      .catch(() => setError("Failed to load availability."))
      .finally(() => setLoadingOcc(false));
  }

  function selectTime(t: string) {
    if (!isBookable(date!, t)) return;
    setTime(t);
    setStep(4);
  }

  async function confirmBooking() {
    if (!sport || !date || !time) return;
    setLoading(true);
    setError(null);
    const r = await bookingWizard({
      kind: "book",
      sport_id: sport.id,
      booking_date: date,
      start_time: time,
    });
    setLoading(false);
    if (r.kind === "book") {
      const result = r.result;
      if (result.ok && result.data) {
        setBookingId(result.data.id);
        setStep(5);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    } else {
      setError("Something went wrong.");
    }
  }

  return (
    <div className="rounded-2xl border border-pine-800/10 bg-white shadow-sm">
      {/* Step indicator */}
      <div className="flex items-center gap-1 border-b border-pine-800/5 px-5 py-3">
        {[1, 2, 3, 4].map((s) => (
          <span
            key={s}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
              step >= s
                ? "bg-pine-900 text-white"
                : "bg-pine-100 text-pine-600",
              step === s && "ring-2 ring-pine-700/20",
            )}
          >
            {s}
          </span>
        ))}
        <span className="ml-3 text-sm text-ink/50">
          {step === 1 && "Choose Sport"}
          {step === 2 && "Pick Date"}
          {step === 3 && "Select Time"}
          {step === 4 && "Review & Confirm"}
          {step === 5 && "Booking Confirmed!"}
        </span>
      </div>

      <div className="p-5">
        {/* Step 1: Sport */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-lg font-bold uppercase text-pine-900">
              Choose a sport
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {sports.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSport(s)}
                  className="flex items-center gap-3 rounded-xl border border-pine-800/10 p-4 text-left transition hover:border-pine-700/30 hover:bg-pine-100/30"
                >
                  <span className="text-3xl">{s.icon}</span>
                  <span className="font-display text-sm font-bold uppercase text-pine-900">
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Date */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-lg font-bold uppercase text-pine-900">
              Pick a date
            </h3>
            <p className="text-sm text-ink/50">
              Bookings are open for the next 24 hours only.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableDates.map((d) => (
                <button
                  key={d}
                  onClick={() => selectDate(d)}
                  className="rounded-xl border border-pine-800/10 p-4 text-left transition hover:border-pine-700/30 hover:bg-pine-100/30"
                >
                  <span className="text-xs font-semibold uppercase text-ink/40">
                    {d === todayIST() ? "Today" : "Tomorrow"}
                  </span>
                  <p className="mt-1 font-display text-lg font-bold text-pine-900">
                    {formatDateDisplay(d)}
                  </p>
                  <p className="mt-1 text-sm text-pine-600">
                    {MORNING_SLOTS.length + EVENING_SLOTS.length} slots
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-2 inline-flex w-fit items-center gap-1.5 text-sm text-pine-600 hover:text-pine-800"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>
        )}

        {/* Step 3: Time */}
        {step === 3 && date && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 text-sm text-pine-600 hover:text-pine-800"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-pine-900">
                  Select a time slot
                </h3>
                <p className="text-sm text-ink/50">
                  {sport?.icon} {sport?.name} · {formatDateDisplay(date)}
                </p>
              </div>
            </div>

            {loadingOcc ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink/40">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading availability…
              </div>
            ) : (
              <>
                {/* Morning */}
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-pine-600">
                    Morning · 7 AM – 10 AM
                  </h4>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
                    {groupedSlots.morning.map((s) => (
                      <button
                        key={s.start_time}
                        disabled={s.status !== "available"}
                        onClick={() => s.status === "available" && selectTime(s.start_time)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm font-medium transition",
                          s.status === "available" &&
                            "border-court-500/30 bg-court-100 text-pine-900 hover:border-court-500 hover:bg-court-100/80",
                          s.status === "booked" &&
                            "cursor-not-allowed border-pine-800/10 bg-pine-100/50 text-pine-600/50",
                          s.status === "closed" &&
                            "cursor-not-allowed border-transparent bg-pine-100/30 text-pine-600/40",
                        )}
                      >
                        <span className="font-mono text-xs">
                          {s.start_time.slice(0, 5)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          {s.status === "available" && (
                            <CheckCircle2 className="h-3 w-3 text-court-500" />
                          )}
                          {s.status === "booked" && <Lock className="h-3 w-3" />}
                          {s.status === "available" && "Available"}
                          {s.status === "booked" && (s.mine ? "You" : "Booked")}
                          {s.status === "closed" && "Closed"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Evening */}
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-pine-600">
                    Evening · 3 PM – 8 PM
                  </h4>
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
                    {groupedSlots.evening.map((s) => (
                      <button
                        key={s.start_time}
                        disabled={s.status !== "available"}
                        onClick={() => s.status === "available" && selectTime(s.start_time)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-sm font-medium transition",
                          s.status === "available" &&
                            "border-court-500/30 bg-court-100 text-pine-900 hover:border-court-500 hover:bg-court-100/80",
                          s.status === "booked" &&
                            "cursor-not-allowed border-pine-800/10 bg-pine-100/50 text-pine-600/50",
                          s.status === "closed" &&
                            "cursor-not-allowed border-transparent bg-pine-100/30 text-pine-600/40",
                        )}
                      >
                        <span className="font-mono text-xs">
                          {s.start_time.slice(0, 5)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          {s.status === "available" && (
                            <CheckCircle2 className="h-3 w-3 text-court-500" />
                          )}
                          {s.status === "booked" && <Lock className="h-3 w-3" />}
                          {s.status === "available" && "Open"}
                          {s.status === "booked" && (s.mine ? "You" : "Busy")}
                          {s.status === "closed" && "Closed"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && sport && date && time && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1 text-sm text-pine-600 hover:text-pine-800"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h3 className="font-display text-lg font-bold uppercase text-pine-900">
                Confirm Booking
              </h3>
            </div>

            <div className="rounded-xl border border-pine-800/10 bg-pine-100/30 p-5">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{sport.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-bold uppercase text-pine-900">
                    {sport.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-pine-800">
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="h-4 w-4" /> {formatDateDisplay(date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> {formatTimeDisplay(time)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-ink/50">
                    Duration: 1 hour
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-ember-100 px-3 py-2 text-sm text-ember-500">{error}</p>
            )}

            <button
              onClick={confirmBooking}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-pine-900 py-3.5 text-sm font-bold text-white transition hover:bg-pine-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Booking…
                </>
              ) : (
                "Confirm Booking"
              )}
            </button>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && sport && date && time && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-court-100">
              <PartyPopper className="h-8 w-8 text-court-500" />
            </span>
            <h3 className="font-display text-2xl font-bold uppercase text-pine-900">
              Booking Confirmed!
            </h3>
            <div className="rounded-xl border border-court-500/20 bg-court-100/30 p-5 text-left">
              <p className="text-sm"><span className="font-semibold text-pine-800">Sport:</span> {sport.icon} {sport.name}</p>
              <p className="text-sm"><span className="font-semibold text-pine-800">Date:</span> {formatDateDisplay(date)}</p>
              <p className="text-sm"><span className="font-semibold text-pine-800">Time:</span> {formatTimeDisplay(time)}</p>
              {bookingId && (
                <p className="mt-1 text-xs text-ink/40">Booking ID: {bookingId}</p>
              )}
            </div>
            <a
              href="/my-bookings"
              className="inline-flex items-center gap-1.5 rounded-xl bg-pine-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-pine-800"
            >
              Go to My Bookings <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}