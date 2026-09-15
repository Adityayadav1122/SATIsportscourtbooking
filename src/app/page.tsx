import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  CalendarCheck,
  Clock,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { SportCard } from "@/components/SportCard";
import { AvailabilityGridInline } from "@/components/AvailabilityGrid";
import { getSportsWithSlots } from "@/lib/data";
import { todayIST, formatTimeDisplay, formatDateWithWeekday } from "@/lib/slots";
import type { Booking } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = todayIST();
  const [sportsWithSlots] = await Promise.all([
    getSportsWithSlots(supabase, today, user?.id),
  ]);

  const todayLabel = formatDateWithWeekday(today);

  // My upcoming bookings
  let myUpcoming: (Booking & { sport?: { name: string; icon: string; slug: string } })[] = [];
  if (user) {
    await supabase.rpc("sweep_completed_bookings");
    const { data } = await supabase
      .from("bookings")
      .select("*, sport:sports(name, icon, slug)")
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .gte("booking_date", today)
      .order("booking_date")
      .order("start_time")
      .limit(3);
    myUpcoming = (data ?? []) as typeof myUpcoming;
  }

  // next available slot per sport
  function nextSlot(slots: typeof sportsWithSlots[number]["slots"]) {
    return slots.find((s) => s.status === "available")?.start_time;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-pine-950 via-pine-900 to-pine-800 court-lines">
          <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[.25em] text-ember-500">
              Samrat Ashok Technological Institute · Vidisha
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold uppercase tracking-tight text-white sm:text-6xl md:text-7xl">
              Sports Hall
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-lg text-pine-100/80">
              Book your sports slot. Play without the wait.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={user ? "/book" : "/register"}
                className="inline-flex items-center gap-2 rounded-full bg-ember-500 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-ember-500/90"
              >
                {user ? "Book a Slot" : "Get Started"}
              </Link>
              <Link
                href="/availability"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/20"
              >
                Check Availability
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Stats strip */}
        <section className="border-b border-pine-800/10 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-4 py-5 sm:px-6">
            <span className="flex items-center gap-2 text-sm text-pine-800">
              <Clock className="h-4 w-4 text-pine-600" /> Open 7 AM – 10 AM & 3 PM – 8 PM
            </span>
            <span className="flex items-center gap-2 text-sm text-pine-800">
              <CalendarCheck className="h-4 w-4 text-pine-600" /> Book within next 24 hours
            </span>
            <span className="flex items-center gap-2 text-sm text-pine-800">
              <ShieldCheck className="h-4 w-4 text-pine-600" /> 1-hour max, no double bookings
            </span>
          </div>
        </section>

        {/* Quick Booking */}
        {user && (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-pine-900">
                Quick Booking
              </h2>
              <Link
                href="/book"
                className="text-sm font-semibold text-pine-600 hover:text-pine-800"
              >
                Full booking page →
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sportsWithSlots.map(({ sport, slots }) => (
                <SportCard
                  key={sport.id}
                  sport={sport}
                  availableCount={
                    slots.filter((s) => s.status === "available").length
                  }
                  nextAvailableSlot={nextSlot(slots)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Not logged in CTA */}
        {!user && (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="rounded-2xl border border-pine-800/10 bg-white p-8 text-center shadow-sm">
              <UserCircle className="mx-auto h-12 w-12 text-pine-600" />
              <h2 className="mt-3 font-display text-xl font-bold uppercase text-pine-900">
                Log in to book your slot
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
                Students and faculty of SATI Vidisha can register with their
                Scholar or Employee ID to start booking sports facilities.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-pine-900 px-5 py-2.5 text-sm font-bold text-pine-900 transition hover:bg-pine-900 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-ember-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ember-500/90"
                >
                  Register
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Today's Availability */}
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-pine-900">
            Today&apos;s Availability
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            {todayLabel}
            {" · "}
            Slots within the 24-hour booking window.
          </p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-pine-800/10 bg-white shadow-sm">
            <AvailabilityGridInline
              sportsWithSlots={sportsWithSlots}
            />
          </div>
        </section>

        {/* My Upcoming (logged in) */}
        {user && myUpcoming.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-pine-900">
              Your Upcoming Bookings
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myUpcoming.map((b) => (
                <div
                  key={b.id}
                  className="flex items-start gap-3 rounded-xl border border-pine-800/10 bg-white p-4 shadow-sm"
                >
                  <span className="text-2xl">{b.sport?.icon ?? "🏸"}</span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold uppercase text-pine-900">
                      {b.sport?.name ?? "Sport"}
                    </p>
                    <p className="text-sm text-ink/60">
                      {b.booking_date} ·{" "}
                      {formatTimeDisplay(b.start_time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/my-bookings"
              className="mt-4 inline-block text-sm font-semibold text-pine-600 hover:text-pine-800"
            >
              View all bookings →
            </Link>
          </section>
        )}

        {/* How It Works */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-pine-900">
            How It Works
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "1️⃣",
                title: "Choose a sport",
                desc: "Select from Badminton Court, Table Tennis or Cricket Net.",
              },
              {
                icon: "2️⃣",
                title: "Pick date & time",
                desc: "Choose the next 24-hour window that suits your schedule.",
              },
              {
                icon: "3️⃣",
                title: "Confirm & play",
                desc: "Receive instant confirmation and head to the Sports Hall.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-xl border border-pine-800/10 bg-white p-5 shadow-sm"
              >
                <span className="text-2xl">{step.icon}</span>
                <h3 className="mt-2 font-display text-base font-bold uppercase text-pine-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-ink/60">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}