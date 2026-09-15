import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import BookingsList from "@/components/BookingsList";
import { getMyBookings } from "@/lib/data";

export default async function MyBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const bookings = await getMyBookings(supabase);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-pine-900">
          My Bookings
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Manage your upcoming and past sports hall reservations.
        </p>
        <div className="mt-6">
          <BookingsList initialBookings={bookings} />
        </div>
      </main>
      <Footer />
    </>
  );
}