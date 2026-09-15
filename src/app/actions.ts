"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bookingErrorMessage } from "@/lib/auth-utils";

export interface ActionResult<T = void> {
  ok: boolean;
  error?: string;
  data?: T;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function bookSlot(input: {
  sport_id: number;
  booking_date: string;
  start_time: string;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be logged in to book." };
  }

  const { data, error } = await supabase.rpc("book_slot", {
    p_sport_id: input.sport_id,
    p_booking_date: input.booking_date,
    p_start_time: input.start_time,
  });

  if (error) {
    const msg = bookingErrorMessage(error.code);
    return { ok: false, error: msg };
  }

  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/availability");
  revalidatePath("/my-bookings");
  return { ok: true, data: { id: (data as { id: string }).id } };
}

export async function cancelBooking(
  bookingId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    const msg = bookingErrorMessage(error.code);
    return { ok: false, error: msg };
  }

  revalidatePath("/");
  revalidatePath("/my-bookings");
  revalidatePath("/availability");
  return { ok: true };
}

export async function updateProfile(input: {
  full_name: string;
  phone?: string;
  department?: string;
  year?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not logged in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      phone: input.phone ?? null,
      department: input.department ?? null,
      year: input.year ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: "Failed to update profile." };

  revalidatePath("/profile");
  return { ok: true };
}

export async function getAvailableSlots(
  date: string,
): Promise<
  {
    sport_id: number;
    start_time: string;
    end_time: string;
    booking_id: string;
    mine: boolean;
  }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_slot_occupancy", {
    p_date: date,
  });
  if (error) return [];
  return data ?? [];
}

export async function adminCancelBooking(
  bookingId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_cancel_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    const msg =
      error.code === "42501" ? "Admin access required." : bookingErrorMessage(error.code);
    return { ok: false, error: msg };
  }

  revalidatePath("/admin");
  return { ok: true };
}