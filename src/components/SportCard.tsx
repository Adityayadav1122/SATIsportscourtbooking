import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { Sport } from "@/lib/types";
import { formatTimeDisplay } from "@/lib/slots";

export function SportCard({
  sport,
  availableCount,
  nextAvailableSlot,
}: {
  sport: Sport;
  availableCount: number;
  nextAvailableSlot?: string;
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-pine-800/10 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4 p-5 pb-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-pine-100 text-3xl">
          {sport.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-bold uppercase tracking-wide text-pine-900">
            {sport.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink/60">
            {sport.description}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-end border-t border-pine-800/5 bg-pine-100/30 px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-pine-800">
          <CheckCircle2 className="h-4 w-4" />
          {availableCount} of 8 slots open
          {nextAvailableSlot && (
            <span className="ml-auto text-xs text-ink/40">
              next: {formatTimeDisplay(nextAvailableSlot)}
            </span>
          )}
        </div>
        <Link
          href={`/book?sport=${sport.slug}`}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-pine-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pine-800"
        >
          Book Now
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

export function SportCardSmall({
  sport,
  selected,
  onClick,
}: {
  sport: Sport;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
        selected
          ? "border-pine-700 bg-pine-900 text-white"
          : "border-pine-800/10 bg-white text-pine-900 hover:border-pine-700/30 hover:bg-pine-100/50"
      }`}
    >
      <span className="text-2xl">{sport.icon}</span>
      <span className="text-left font-display text-sm font-bold uppercase tracking-wide">
        {sport.name}
      </span>
    </button>
  );
}