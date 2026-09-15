import { createClient } from "@supabase/supabase-js";
import { env } from "./_env.mjs";

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const PUB = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
  const sb = createClient(URL, PUB);
  const { data: signIn, error: signInErr } = await sb.auth.signInWithPassword({
    email: "21mca1001@student.sati.ac.in",
    password: "demo1234",
  });
  console.log("signin:", signInErr ? "ERR " + signInErr.message : "ok " + signIn.user?.email);

  // 1. Book a valid future slot (tomorrow 08:00)
  const now = Date.now() + (5 * 60 + 30) * 60 * 1000;
  const tomorrow = new Date(now + 24 * 60 * 60 * 1000);
  const date = tomorrow.toISOString().slice(0, 10);
  const { data: b, error: e1 } = await sb.rpc("book_slot", {
    p_sport_id: 1,
    p_booking_date: date,
    p_start_time: "08:00:00",
  });
  console.log("book first:", e1 ? `ERR code=${e1.code} msg=${e1.message} details=${e1.details}` : `ok ${b?.id}`);

  // 2. Attempt to double-book the same slot (as priya, different user)
  const sb2 = createClient(URL, PUB);
  await sb2.auth.signInWithPassword({
    email: "21mca1002@student.sati.ac.in",
    password: "demo1234",
  });
  const { data: b2, error: e2 } = await sb2.rpc("book_slot", {
    p_sport_id: 1,
    p_booking_date: date,
    p_start_time: "08:00:00",
  });
  console.log("book double:", e2 ? `ERR code=${e2.code} msg=${e2.message} details=${e2.details}` : "!! SUCCEEDED " + b2?.id);

  // 3. Same user overlapping different sport (badminton 08:00 already booked by rahul)
  const { data: b3, error: e3 } = await sb.rpc("book_slot", {
    p_sport_id: 2,
    p_booking_date: date,
    p_start_time: "09:00:00",
  });
  console.log("book overlap(none):", e3 ? `ERR code=${e3.code} msg=${e3.message}` : `ok3 ${b3?.id}`);
  // overlap by same user: rahul books table-tennis 08:30? not allowed slot. try table-tennis 08:00 same slot time as his badminton 08:00
  const { data: ob, error: e3b } = await sb.rpc("book_slot", {
    p_sport_id: 2,
    p_booking_date: date,
    p_start_time: "08:00:00",
  });
  console.log("book overlap(same time diff sport):", e3b ? `ERR code=${e3b.code} msg=${e3b.message}` : "!! ok " + ob?.id);

  // 4. invalid slot time
  const { error: e4 } = await sb.rpc("book_slot", {
    p_sport_id: 1,
    p_booking_date: date,
    p_start_time: "10:00:00",
  });
  console.log("bad time:", e4 ? `ERR code=${e4.code} msg=${e4.message}` : "!! ok");

  // 5. past slot
  const { error: e5 } = await sb.rpc("book_slot", {
    p_sport_id: 1,
    p_booking_date: "2026-01-01",
    p_start_time: "07:00:00",
  });
  console.log("bad date(curcode?):", e5 ? `ERR code=${e5.code} msg=${e5.message}` : "!! ok");

  // 6. occupancy
  const { data: occ, error: e6 } = await sb.rpc("get_slot_occupancy", { p_date: date });
  console.log("occupancy:", e6 ? "ERR " + e6.message : JSON.stringify(occ));

  // 7. cancel that first booking
  if (b?.id) {
    const { error: ce } = await sb.rpc("cancel_booking", { p_booking_id: b.id });
    console.log("cancel:", ce ? "ERR " + ce.message : "ok");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});