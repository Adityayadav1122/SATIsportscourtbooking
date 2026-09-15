// Seed demo users + bookings, and configure auth.
import { createClient } from "@supabase/supabase-js";
import { env } from "./_env.mjs";

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = env.SUPABASE_SERVICE_ROLE_KEY;
const MGMT = env.SUPABASE_MGMT_TOKEN;
const REF = env.SUPABASE_PROJECT_REF;

async function setAuthConfig() {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${REF}/config/auth`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${MGMT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mailer_autoconfirm: true,
        external_email_enabled: true,
        disable_signup: false,
      }),
    },
  );
  console.log("auth config:", res.status, (await res.text()).slice(0, 300));
}

const admin = createClient(URL, SECRET, { auth: { autoRefreshToken: false, persistSession: false } });

async function upsertUser(email, password, meta, role) {
  const { data: existing, error: findErr } = await admin.auth.admin.listUsers();
  if (findErr) throw findErr;
  const key = email.toLowerCase();
  let user = existing.users.find((u) => (u.email ?? "").toLowerCase() === key);
  if (user) return user;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) throw error;
  user = data.user;
  if (role === "admin") {
    const err = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...meta, role },
    });
    if (err.error) throw err.error;
  }
  return user;
}

async function setRole(userId, role) {
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw error;
}

async function main() {
  await setAuthConfig();

  // Admin: hall coordinator
  const adminUser = await upsertUser(
    "coordinator@faculty.sati.ac.in",
    "hall8855coord",
    { full_name: "Hall Coordinator" },
    "admin",
  );
  await setRole(adminUser.id, "admin");

  // Demo students
  const rahul = await upsertUser("21MCA1001@student.sati.ac.in", "demo1234", {
    full_name: "Rahul Sharma",
    department: "MCA",
    year: "3rd",
    phone: "9876543210",
  });
  const priya = await upsertUser("21MCA1002@student.sati.ac.in", "demo1234", {
    full_name: "Priya Verma",
    department: "MCA",
    year: "3rd",
    phone: "9876543211",
  });
  const amit = await upsertUser("21BTA3001@student.sati.ac.in", "demo1234", {
    full_name: "Amit Patel",
    department: "BT",
    year: "2nd",
    phone: "9876543212",
  });

  const sports = await admin.from("sports").select("id, slug").order("id");
  const bySlug = Object.fromEntries(sports.data.map((s) => [s.slug, s.id]));

  // Seed a few confirmed bookings only for *valid* future slots (created via RPC-ish direct insert,
  // filtered to stay inside the 24h window so the UI never shows "booked" on an unbookable slot).
  const nowIST = () => {
    const ms = Date.now() + (5 * 60 + 30) * 60 * 1000;
    return new Date(ms);
  };
  const dateStr = (d) => d.toISOString().slice(0, 10);

  const starts = ["07:00", "08:00", "09:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
  for (const b of [
    { user: rahul, slug: "badminton" },
    { user: priya, slug: "table-tennis" },
    { user: amit, slug: "cricket-net" },
  ]) {
    let placed = false;
    for (const dayOffset of [0, 1]) {
      for (const s of starts) {
        const [hh, mm] = s.split(":").map(Number);
        const at = new Date(nowIST().getTime());
        at.setUTCHours(0, 0, 0, 0);
        at.setUTCDate(at.getUTCDate() + dayOffset); // dayOffset 0/1
        at.setUTCHours(hh, mm, 0, 0);
        const diff = at.getTime() - nowIST().getTime();
        if (diff <= 30 * 60 * 1000 || diff > 24 * 60 * 60 * 1000) continue;
        const date = dateStr(at);
        const end = String(hh + 1).padStart(2, "0");
        const { error } = await admin.from("bookings").insert({
          user_id: b.user.id,
          sport_id: bySlug[b.slug],
          booking_date: date,
          start_time: s,
          end_time: `${end}:00`,
          status: "confirmed",
        });
        if (error) {
          console.warn("seed booking skipped for", b.slug, error.message);
          continue;
        }
        console.log("seeded", b.slug, date, s);
        placed = true;
        break;
      }
      if (placed) break;
    }
    if (!placed) console.warn("no valid future slot for", b.slug);
  }

  console.log("Seeded users:", rahul.email, priya.email, amit.email, adminUser.email);
}

main().then(() => {
  console.log("seed complete");
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});