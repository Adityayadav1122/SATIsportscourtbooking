import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-pine-800/10 bg-white p-8 shadow-sm">
            <h1 className="text-center font-display text-2xl font-bold uppercase tracking-wide text-pine-900">
              Sign In
            </h1>
            <p className="mt-1 text-center text-sm text-ink/60">
              Enter your credentials to access the Sports Hall.
            </p>
            <div className="mt-6">
              <LoginForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}