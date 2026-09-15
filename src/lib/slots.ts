import type { Booking, SlotStatus, Sport } from "./types";

export const MORNING_SLOTS = ["07:00", "08:00", "09:00"];
export const EVENING_SLOTS = ["15:00", "16:00", "17:00", "18:00", "19:00"];
export const ALL_SLOT_TIMES = [...MORNING_SLOTS, ...EVENING_SLOTS];

export const OPEN_HOURS_LABEL = "7:00\u201310:00 AM and 3:00\u20138:00 PM";
export const BOOKING_WINDOW_HOURS = 24;

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function endTime(start: string): string {
  const hour = Number(start.split(":")[0]) + 1;
  return `${String(hour).padStart(2, "0")}:00`;
}

export function slotKey(date: string, start: string): string {
  return `${date} ${start}`;
}

/** Current IST wall clock expressed in epoch milliseconds (as if it were UTC). */
export function istNowMs(): number {
  return Date.now() + IST_OFFSET_MS;
}

/** YYYY-MM-DD for the IST date offset by `days` from today. */
export function istDateOffset(days: number): string {
  const d = new Date(istNowMs());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayIST(): string {
  return istDateOffset(0);
}

export function maxBookableDate(): string {
  return istDateOffset(1);
}

/** Ist wall-clock slot start in epoch ms (as if UTC). */
function slotStartMs(date: string, start: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = start.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm);
}

/** A slot is bookable when it starts in the future and within the 24h window. */
export function isBookable(date: string, start: string): boolean {
  if (!ALL_SLOT_TIMES.includes(start)) return false;
  const now = istNowMs();
  const startMs = slotStartMs(date, start);
  if (startMs < now) return false;
  return startMs - now <= BOOKING_WINDOW_HOURS * 60 * 60 * 1000;
}

/** Calendar dates a user may choose: today and tomorrow. */
export function selectableDates(): string[] {
  return [istDateOffset(0), istDateOffset(1)];
}

export function isSelectableDate(date: string): boolean {
  return selectableDates().includes(date);
}

export function formatDateDisplay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${d} ${months[(m ?? 1) - 1]} ${y}`;
}

export function formatDateWithWeekday(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const index = new Date(Date.UTC(y, (m ?? 1) - 1, d)).getUTCDay();
  const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
  ];
  return `${days[index]}, ${formatDateDisplay(date)}`;
}

export function formatTimeDisplay(start: string): string {
  const hour = Number(start.split(":")[0]);
  const startLabel = formatHour(hour);
  const endLabel = formatHour(hour + 1);
  return `${startLabel} \u2013 ${endLabel}`;
}

export function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour > 12) return `${hour - 12}:00 PM`;
  return `${hour}:00 AM`;
}

export function slotsToday(): string[] {
  const today = todayIST();
  return ALL_SLOT_TIMES.filter((start) => isBookable(today, start));
}

export type BookingBucket = "upcoming" | "past" | "completed" | "cancelled";

export function bucketOfBooking(booking: Booking, nowKeyMs: number = istNowMs()): BookingBucket {
  if (booking.status === "cancelled") return "cancelled";
  const startMs = slotStartMs(booking.booking_date, booking.start_time);
  if (startMs < nowKeyMs) return "completed";
  return "upcoming";
}

/** Builds per-facility slot status for one date. */
export function buildSlotStatuses(
  sport: Sport,
  date: string,
  confirmedBookings: Booking[],
  myConfirmedBookingIds: Set<string>,
): SlotStatus[] {
  return ALL_SLOT_TIMES.map((start) => {
    const booking = confirmedBookings.find((b) => b.start_time === start);
    if (booking) {
      return {
        start_time: start,
        end_time: endTime(start),
        status: "booked",
        booking,
        alreadyBookedByMe: myConfirmedBookingIds.has(booking.id),
      };
    }
    if (!isBookable(date, start)) {
      return { start_time: start, end_time: endTime(start), status: "closed" };
    }
    return { start_time: start, end_time: endTime(start), status: "available" };
  });
}

export interface BookingValidationErrors {
  code:
    | "OK"
    | "PAST"
    | "WINDOW"
    | "BAD_SLOT"
    | "HOURS"
    | "DATE";
  message: string;
}

export function validateBookingInput(date: string, start: string): BookingValidationErrors {
  if (!ALL_SLOT_TIMES.includes(start)) {
    return { code: "BAD_SLOT", message: "Please select a valid time slot." };
  }
  if (!isSelectableDate(date) || date < todayIST()) {
    return {
      code: "DATE",
      message: "Bookings are open only for the next 24 hours. Please pick a valid date.",
    };
  }
  if (!isBookable(date, start)) {
    return start < todayIST() || slotStartMs(date, start) < istNowMs()
      ? { code: "PAST", message: "You cannot book a slot in the past." }
      : {
          code: "WINDOW",
          message: "This slot is outside the 24-hour booking window. Pick a nearer slot.",
        };
  }
  return { code: "OK", message: "" };
}