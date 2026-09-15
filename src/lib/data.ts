import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Booking,
  OccupancyRow,
  Profile,
  Sport,
  SportWithSlots,
  AdminBookingRow,
} from "./types";
import { buildSlotStatuses } from "./slots";

export async function getSports(supabase: SupabaseClient): Promise<Sport[]> {
  const { data, error } = await supabase
    .from("sports")
    .select("*")
    .eq("active", true)
    .order("id");
  if (error) throw error;
  return data ?? [];
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function getOccupancy(
  supabase: SupabaseClient,
  date: string,
): Promise<OccupancyRow[]> {
  const { data, error } = await supabase.rpc("get_slot_occupancy", {
    p_date: date,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getSportsWithSlots(
  supabase: SupabaseClient,
  date: string,
  userId?: string | null,
): Promise<SportWithSlots[]> {
  const sports = await getSports(supabase);
  const occupancy = await getOccupancy(supabase, date);

  return sports.map((sport) => {
    const bySport = occupancy.filter((o) => o.sport_id === sport.id);
    const myIds = new Set(bySport.filter((o) => o.mine).map((o) => o.booking_id));
    const bookings: Booking[] = bySport.map((o) => ({
      id: o.booking_id,
      user_id: userId ?? "",
      sport_id: o.sport_id,
      booking_date: date,
      start_time: o.start_time.slice(0, 5),
      end_time: o.end_time.slice(0, 5),
      status: "confirmed" as const,
      created_at: "",
      cancelled_at: null,
    }));
    return {
      sport,
      slots: buildSlotStatuses(sport, date, bookings, myIds),
    };
  });
}

export async function getMyBookings(
  supabase: SupabaseClient,
): Promise<Booking[]> {
  // sweep completed first (fire and forget in production; here await)
  await supabase.rpc("sweep_completed_bookings");

  const { data, error } = await supabase
    .from("bookings")
    .select("*, sport:sports(id, name, icon, slug)")
    .order("booking_date", { ascending: false })
    .order("start_time");
  if (error) throw error;
  return data ?? [];
}

export async function getAdminBookings(
  supabase: SupabaseClient,
  filters?: { date?: string | null; sport_id?: number | null; role?: string | null },
): Promise<AdminBookingRow[]> {
  await supabase.rpc("sweep_completed_bookings");

  const { data, error } = await supabase.rpc("admin_get_bookings", {
    p_date: filters?.date ?? null,
    p_sport_id: filters?.sport_id ?? null,
    p_role: filters?.role ?? null,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getAdminStats(supabase: SupabaseClient) {
  const today = new Date(Date.now() + (5 * 60 + 30) * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    { count: totalBookings },
    { count: todayBookings },
    { count: activeBookings },
    { count: totalMembers },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("booking_date", today)
      .eq("status", "confirmed"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["student", "faculty"]),
  ]);

  return {
    totalBookings: totalBookings ?? 0,
    todayBookings: todayBookings ?? 0,
    activeBookings: activeBookings ?? 0,
    totalMembers: totalMembers ?? 0,
  };
}