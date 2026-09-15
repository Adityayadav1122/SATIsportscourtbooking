import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/BookingWizard";
import { getSports } from "@/lib/data";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sports = await getSports(supabase);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-center font-display text-3xl font-bold uppercase tracking-wide text-pine-900">
          Book a Slot
        </h1>
        <p className="mt-1 text-center text-sm text-ink/60">
          Choose your sport, pick a time and confirm — your slot is yours in under a minute.
        </p>
        <div className="mt-6">
          <BookingWizard sports={sports} initialSportSlug={params.sport} />
        </div>
      </main>
      <Footer />
    </>
  );
}