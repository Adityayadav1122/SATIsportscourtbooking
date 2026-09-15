import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { AvailabilityFullGrid } from "@/components/AvailabilityGrid";
import { getSportsWithSlots } from "@/lib/data";
import { selectableDates, todayIST, formatDateDisplay } from "@/lib/slots";
import { cn } from "@/lib/utils";

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const selectedDate = params.date && selectableDates().includes(params.date)
    ? params.date
    : todayIST();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sportsWithSlots = await getSportsWithSlots(supabase, selectedDate, user?.id);
  const dates = selectableDates();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-pine-900">
          Availability
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          See which time slots are open or booked across all sports.
        </p>

        <div className="mt-6 flex gap-2">
          {dates.map((d) => (
            <Link
              key={d}
              href={`/availability?date=${d}`}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition",
                selectedDate === d
                  ? "border-pine-700 bg-pine-900 text-white"
                  : "border-pine-800/10 bg-white text-pine-900 hover:border-pine-700/30",
              )}
            >
              <span className="text-[11px] font-bold uppercase">
                {d === todayIST() ? "Today" : "Tomorrow"}
              </span>
              <p className="mt-0.5 text-sm font-semibold">{formatDateDisplay(d)}</p>
            </Link>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-pine-800/10 bg-white shadow-sm">
          <AvailabilityFullGrid sportsWithSlots={sportsWithSlots} />
        </div>
      </main>
      <Footer />
    </>
  );
}