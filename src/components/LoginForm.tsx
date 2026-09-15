"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthRole } from "@/lib/types";
import { idToAuthEmail } from "@/lib/auth-utils";

export default function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<AuthRole>("student");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const email = idToAuthEmail(userId, role);
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authErr) {
      setError(
        authErr.code === "invalid_credentials"
          ? "Invalid ID or password."
          : authErr.message,
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      {/* Role tabs */}
      <div className="flex gap-1 rounded-lg bg-pine-100 p-1">
        {(["student", "faculty"] as AuthRole[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-bold capitalize transition",
              role === r
                ? "bg-white text-pine-900 shadow-sm"
                : "text-pine-600 hover:text-pine-900",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase text-pine-700">
          {role === "student" ? "Scholar Number" : "Employee / Faculty ID"}
        </span>
        <input
          required
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder={role === "student" ? "e.g. 21MCA1001" : "e.g. FAC-1042"}
          className="rounded-xl border border-pine-800/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-ink/30 focus:border-pine-700 focus:ring-2 focus:ring-pine-700/10"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase text-pine-700">
          Password
        </span>
        <div className="relative">
          <input
            required
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-pine-800/15 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-pine-700 focus:ring-2 focus:ring-pine-700/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-pine-400"
            aria-label="Toggle password visibility"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </label>

      {error && (
        <p className="rounded-lg bg-ember-100 px-3 py-2 text-sm text-ember-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-pine-900 py-3 text-sm font-bold text-white transition hover:bg-pine-800 disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" />
        {loading ? "Signing in…" : "Sign In"}
      </button>

      <p className="text-center text-sm text-ink/60">
        New here?{" "}
        <Link href="/register" className="font-semibold text-pine-700 hover:text-pine-900">
          Create an account
        </Link>
      </p>
    </form>
  );
}