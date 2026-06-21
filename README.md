# Copy Automate

A Next.js app where anyone can submit a project description via a chat-style form. Submissions are stored in Supabase. A password-protected admin page lets you view all submissions.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) account (free tier is fine)
- A [Vercel](https://vercel.com/) account for deployment (optional for local dev)

---

## 1. Clone the repo and install dependencies

```bash
git clone https://github.com/linnalihe/app-copyautomate.git
cd app-copyautomate
npm install
```

---

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com/) and create a new project.
2. Wait for the project to finish provisioning (takes about a minute).

---

## 3. Run the database migration

1. In your Supabase project, go to **SQL Editor** in the left sidebar.
2. Open `supabase/migrations/001_create_submissions.sql` from this repo.
3. Paste the contents into the SQL editor and click **Run**.

This creates the `submissions` table and enables Row Level Security so only authenticated admins can read data.

---

## 4. Create an admin user

There is no public sign-up — admin accounts are created manually.

1. In your Supabase project, go to **Authentication > Users**.
2. Click **Add user > Create new user**.
3. Enter an email and password. This is what you'll use to log in to `/admin/login`.

---

## 5. Set up environment variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and fill in the values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
IP_HASH_SALT=replace-with-a-random-secret-string
```

To find your Supabase keys:

1. Go to your Supabase project > **Settings > API Keys**.
2. If you don't have keys yet, click **Create new API Keys**.
3. From the **API Keys** tab (not the Legacy API Keys tab):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — safe to expose in client-side code
   - **Secret key** (`sb_secret_...`) → `SUPABASE_SECRET_KEY` — server-side only, never commit or expose publicly

For `IP_HASH_SALT`, use any random string (e.g. run `openssl rand -hex 32` in your terminal).

---

## 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the submission form.  
Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login) to access the admin dashboard.

---

## 7. Deploy to Vercel

1. Push your code to GitHub (the migration and env vars are not committed — that's intentional).
2. Go to [vercel.com](https://vercel.com/) and import the repository.
3. During setup, add the four environment variables from step 5 under **Environment Variables**.
4. Click **Deploy**.

After deploying, Vercel will give you a production URL. The app is live.

---

## Project structure

```
app/
  page.tsx                  # Public submission form (/)
  api/submit/route.ts       # POST endpoint — validates, rate-limits, inserts
  admin/
    page.tsx                # Admin dashboard (/admin)
    login/page.tsx          # Admin login (/admin/login)
    actions.ts              # Server action for logout
components/
  SubmissionForm.tsx        # Chat-style form (client component)
lib/
  schema.ts                 # Shared Zod validation schema
  supabase/
    server.ts               # Server-side Supabase clients
    client.ts               # Browser Supabase client
middleware.ts               # Protects /admin/* routes
supabase/migrations/
  001_create_submissions.sql  # Table + RLS setup
```
