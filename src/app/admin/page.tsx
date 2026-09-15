import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, CalendarDays, CalendarCheck, Users } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import AdminBookingsTable from "@/components/AdminBookingsTable";
import AdminFilterControls from "@/components/AdminFilterControls";
import { getAdminBookings, getAdminStats, getSports } from "@/lib/data";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = (
    await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  ).data;
  if (profile?.role !== "admin") redirect("/");

  const params = await searchParams;
  const filterDate = params.date && params.date.length === 10 ? params.date : null;
  const filterSport = params.sport ? Number(params.sport) : null;
  const filterRole = params.role ?? null;

  const [stats, rows, sports] = await Promise.all([
    getAdminStats(supabase),
    getAdminBookings(supabase, {
      date: filterDate,
      sport_id: filterSport,
      role: filterRole,
    }),
    getSports(supabase),
  ]);

  const statsCards = [
    { label: "Total Bookings", value: stats.totalBookings, icon: BarChart3 },
    { label: "Confirmed Today", value: stats.todayBookings, icon: CalendarDays },
    { label: "Active Bookings", value: stats.activeBookings, icon: CalendarCheck },
    { label: "Registered Members", value: stats.totalMembers, icon: Users },
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-pine-900">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-ink/60">Sports Hall overview for the coordinator.</p>
          </div>
          <Link
            href="/"
            className="text-sm font-semibold text-pine-600 hover:text-pine-800"
          >
            ← Back to site
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statsCards.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-pine-800/10 bg-white p-4 shadow-sm"
            >
              <s.icon className="h-5 w-5 text-pine-600" />
              <p className="mt-2 font-display text-3xl font-bold text-pine-900">{s.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <AdminFilterControls
          filterDate={filterDate}
          filterSport={filterSport}
          filterRole={filterRole}
          sports={sports}
        />

        {/* Table */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-pine-800/10 bg-white shadow-sm">
          <AdminBookingsTable rows={rows} />
        </div>
      </main>
      <Footer />
    </>
  );
}