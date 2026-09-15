export type Role = "student" | "faculty" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  scholar_or_employee_id: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  year: string | null;
  role: Role;
  created_at: string;
}

export interface Sport {
  id: number;
  slug: string;
  name: string;
  icon: string;
  description: string;
  facilities_count: number;
  active: boolean;
}

export type BookingStatus = "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  user_id: string;
  sport_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  created_at: string;
  cancelled_at: string | null;
  sport?: Sport;
}

export type SlotAvailability = "available" | "booked" | "selected" | "past" | "closed";

export interface SlotStatus {
  start_time: string;
  end_time: string;
  status: SlotAvailability;
  booking?: Booking;
  alreadyBookedByMe?: boolean;
}

export interface SportWithSlots {
  sport: Sport;
  slots: SlotStatus[];
}

export interface OccupancyRow {
  sport_id: number;
  start_time: string;
  end_time: string;
  booking_id: string;
  mine: boolean;
}

export interface BookingInput {
  sport_id: number;
  booking_date: string;
  start_time: string;
}

export type AdminBookingRow = {
  id: string;
  member_name: string;
  member_id: string;
  role: Role;
  sport_id: number;
  sport_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  created_at: string;
  cancelled_at: string | null;
};

export type AuthRole = Exclude<Role, "admin">;