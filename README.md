# SATI Sports Hall - Slot Booking

Sports hall slot booking for Samrat Ashok Technological Institute, Vidisha.
Built with **Next.js 16** (App Router), **Supabase** (Postgres + Auth + RLS) and
**Tailwind CSS v4**.

- Students / faculty sign in with their scholar / employee ID.
- Book a one-hour slot (07:00-10:00 morning, 15:00-20:00 evening) within the next 24 hours.
- Concurrency-safe: a PostgreSQL unique index blocks double bookings even under a race.
- Members see and cancel only their own bookings; the coordinator has an admin dashboard.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Env vars

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

**Vercel needs only these two** (set in Settings > Environment Variables):

| Variable | Value |
| -------- | ----- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon (publishable) key |

`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_MGMT_TOKEN` and `SUPABASE_PROJECT_REF`
are used by local scripts (`seed.mjs`, `run-sql.mjs`, `check.mjs`) only - keep
them in `.env.local`, never in Vercel and never in git.

### Database schema

The schema lives in `supabase/`. Applied to a project with:

```bash
node scripts/run-sql.mjs supabase/001_schema.sql
# ... repeat for 002 .. 006 (idempotent, applied in order)
```

`scripts/seed.mjs` seeds the coordinator and demo members:

```bash
npm i -g supabase   # optional, if you prefer supabase db push
node scripts/seed.mjs
```

## Deploy on Vercel

1. Push this repo to GitHub (see `.github` / `git push`, repo:
   https://github.com/Adityayadav1122/SATIsportscourtbooking).
2. Import the repo at https://vercel.com/new - Vercel auto-detects Next.js.
   Build command: `npm run build`. Node.js 20+.
3. Add the two environment variables above (Settings > Environment Variables)
   and redeploy.
4. Make sure your Supabase project has the migrations applied and the seed run.

## Scripts

- `npm run dev` - development server
- `npm run build` - production build
- `npm run start` - serve the production build
- `npm run lint` - ESLint
- `python scripts/e2e_test.py` - end-to-end Playwright smoke tests
- `node scripts/run-sql.mjs <file>` - run a SQL migration file against Supabase
- `node scripts/seed.mjs` - seed coordinator + demo members