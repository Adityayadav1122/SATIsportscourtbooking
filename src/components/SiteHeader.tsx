import { createClient } from "@/lib/supabase/server";
import SiteNav from "@/components/SiteNav";
import type { Profile } from "@/lib/types";

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <SiteNav
      fullName={profile?.full_name ?? user?.email?.split("@")[0] ?? "Member"}
      role={profile?.role ?? "student"}
      loggedOut={!user}
    />
  );
}