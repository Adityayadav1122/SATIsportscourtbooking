import { env } from "./_env.mjs";

const TOKEN = env.SUPABASE_MGMT_TOKEN;
const REF = env.SUPABASE_PROJECT_REF;

async function runSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  console.log(`[${res.status}]`, text.slice(0, 3000));
}

const sql = `select 'sports' as t, count(*)::text as n from public.sports
union all select 'profiles', count(*)::text from public.profiles
union all select 'bookings', count(*)::text from public.bookings
union all select 'confirmed bookings', count(*)::text from public.bookings where status='confirmed'`;

await runSql(sql);