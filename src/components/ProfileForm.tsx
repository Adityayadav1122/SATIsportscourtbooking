"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { Profile } from "@/lib/types";
import { updateProfile } from "@/app/actions";
import { initials } from "@/lib/utils";
import { authEmailToId } from "@/lib/auth-utils";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [department, setDepartment] = useState(profile.department ?? "");
  const [year, setYear] = useState(profile.year ?? "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile({ full_name: fullName, phone, department, year });
    setLoading(false);
    setStatus(result.ok ? "saved" : "error");
    window.setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pine-900 text-lg font-bold text-white">
          {initials(profile.full_name)}
        </span>
        <div>
          <p className="font-display text-lg font-bold uppercase text-pine-900">
            {profile.role} profile
          </p>
          <p className="text-sm text-ink/50">
            {profile.role === "student" ? "Scholar Number" : "Employee ID"}:{" "}
            <span className="font-mono">{profile.scholar_or_employee_id}</span>
          </p>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase text-pine-700">Full Name</span>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded-xl border border-pine-800/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-700 focus:ring-2 focus:ring-pine-700/10"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase text-pine-700">Department</span>
        <input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-xl border border-pine-800/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-700 focus:ring-2 focus:ring-pine-700/10"
        />
      </label>

      {profile.role === "student" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase text-pine-700">Year</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-xl border border-pine-800/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-700 focus:ring-2 focus:ring-pine-700/10"
          >
            <option value="">Select year</option>
            <option>1st</option>
            <option>2nd</option>
            <option>3rd</option>
            <option>4th</option>
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase text-pine-700">Phone (optional)</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-xl border border-pine-800/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-700 focus:ring-2 focus:ring-pine-700/10"
        />
      </label>

      <div className="rounded-xl border border-pine-800/10 bg-pine-100/30 px-4 py-3 text-sm text-pine-700">
        <p>
          Login ID (email):{" "}
          <span className="font-mono text-xs">
            {authEmailToId(profile.email)}@{profile.role === "student" ? "student" : "faculty"}.sati.ac.in
          </span>
        </p>
        <p className="mt-1 text-xs text-pine-600/70">
          Role and college ID cannot be changed.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-pine-900 py-3 text-sm font-bold text-white transition hover:bg-pine-800 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Changes
      </button>

      {status === "saved" && (
        <p className="rounded-lg bg-court-100 px-3 py-2 text-sm text-court-500">Profile updated.</p>
      )}
      {status === "error" && (
        <p className="rounded-lg bg-ember-100 px-3 py-2 text-sm text-ember-500">
          Failed to update profile. Please try again.
        </p>
      )}
    </form>
  );
}