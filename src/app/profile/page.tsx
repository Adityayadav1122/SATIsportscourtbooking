import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import ProfileForm from "@/components/ProfileForm";
import { getProfile } from "@/lib/data";
import { signOut } from "@/app/actions";
import { LogOut } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  if (!profile) redirect("/login");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-pine-900">
          Profile
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Review and update your details.
        </p>
        <div className="mt-6 rounded-2xl border border-pine-800/10 bg-white p-6 shadow-sm">
          <ProfileForm profile={profile} />
        </div>
      <div className="mt-6 flex justify-end">
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-ember-500/30 px-4 py-2.5 text-sm font-semibold text-ember-500 transition hover:bg-ember-100"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}