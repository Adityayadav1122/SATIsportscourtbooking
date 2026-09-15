import Link from "next/link";
import { CheckCircle2, Lock, Ban, ArrowRight } from "lucide-react";
import type { SportWithSlots, SlotStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function SlotPill({ slot }: { slot: SlotStatus }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm",
        slot.status === "available" &&
          "border border-court-500/20 bg-court-100 text-pine-900",
        slot.status === "selected" &&
          "border border-ember-500 bg-ember-100 text-ember-500",
        slot.status === "booked" &&
          "border border-pine-800/10 bg-pine-100/50 text-pine-600/60",
        slot.status === "closed" &&
          "border border-transparent bg-pine-100/30 text-pine-600/40",
      )}
    >
      <span className="font-mono text-xs">
        {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
      </span>
      <span className="flex items-center gap-1 text-xs font-medium">
        {slot.status === "available" && (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-court-500" /> Open
          </>
        )}
        {slot.status === "selected" && (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-ember-500" /> Selected
          </>
        )}
        {slot.status === "booked" && (
          <>
            <Lock className="h-3.5 w-3.5" />{" "}
            {slot.alreadyBookedByMe ? "You" : "Booked"}
          </>
        )}
        {slot.status === "closed" && (
          <>
            <Ban className="h-3.5 w-3.5" /> Closed
          </>
        )}
      </span>
    </div>
  );
}

export function AvailabilityGridInline({
  sportsWithSlots,
}: {
  sportsWithSlots: SportWithSlots[];
}) {
  return (
    <div className="divide-y divide-pine-800/5">
      {sportsWithSlots.map(({ sport, slots }) => (
        <div key={sport.id} className="flex items-start gap-4 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pine-100 text-xl">
            {sport.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="font-display text-sm font-bold uppercase text-pine-900">
              {sport.name}
            </h4>
            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-8">
              {slots.map((slot) => (
                <SlotPill key={slot.start_time} slot={slot} />
              ))}
            </div>
          </div>
        </div>
      ))}
      <div className="p-4 text-right">
        <Link
          href={`/book`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-pine-600 hover:text-pine-800"
        >
          Open booking page <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function AvailabilityFullGrid({
  sportsWithSlots,
}: {
  sportsWithSlots: SportWithSlots[];
}) {
  return (
    <div className="divide-y divide-pine-800/5">
      {sportsWithSlots.map(({ sport, slots }) => (
        <div key={sport.id} className="flex flex-col sm:flex-row sm:items-start gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pine-100 text-xl">
            {sport.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="font-display text-sm font-bold uppercase text-pine-900">
              {sport.name}
            </h4>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-4">
              {slots.map((slot) => (
                <SlotPill key={slot.start_time} slot={slot} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}