import { readFile } from "node:fs/promises";
import { env } from "./_env.mjs";

const REF = env.SUPABASE_PROJECT_REF;
const TOKEN = env.SUPABASE_MGMT_TOKEN;

async function runSql(sqlPath, label) {
  const query = await readFile(sqlPath, "utf8");
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const text = await res.text();
  console.log(`== ${label} [${res.status}]`);
  console.log(text.slice(0, 2000));
  if (!res.ok) process.exitCode = 1;
}

const [,, file] = process.argv;
if (!file) {
  console.error("usage: node run-sql.mjs <path-to.sql>");
  process.exit(1);
}
await runSql(file, file);