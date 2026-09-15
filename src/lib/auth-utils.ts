import type { AuthRole } from "./types";

export const BOOKING_ERROR: Record<string, string> = {
  "23505": "This slot was just booked by someone else. Please select another slot.",
  "23P01": "You already have a booking during this time.",
  "28000": "You must be logged in to book a slot.",
  P0001: "Please select a valid time slot.",
  P0002: "This facility is not available for booking.",
  P0003: "Bookings are open only for the next 24 hours. Please pick a valid date.",
  P0004: "You cannot book a slot in the past.",
  P0005: "This slot is outside the 24-hour booking window.",
  P0006: "Booking not found.",
  P0007: "This booking is not active.",
  P0008: "Cannot cancel a booking that has already started.",
  P0009: "Bookings are available only from 7:00\u201310:00 AM and 3:00\u20138:00 PM.",
  "42501": "You do not have permission to perform this action.",
};

export function bookingErrorMessage(code?: string | null): string {
  if (!code) return "Something went wrong. Please try again.";
  return BOOKING_ERROR[code] ?? `Unexpected error (${code}). Please try again.`;
}

export const STUDENT_DOMAIN = "student.sati.ac.in";
export const FACULTY_DOMAIN = "faculty.sati.ac.in";

export function idToAuthEmail(id: string, role: AuthRole): string {
  const domain = role === "student" ? STUDENT_DOMAIN : FACULTY_DOMAIN;
  return `${id.trim().toLowerCase()}@${domain}`;
}

export function authEmailToId(email: string | null | undefined): string {
  if (!email) return "";
  return email.split("@")[0] ?? "";
}