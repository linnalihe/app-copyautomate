# Copy Automate

A Next.js app where anyone can submit a project description via a chat-style form. Submissions are stored in Supabase. A password-protected admin page lets you view all submissions. Visitors can also support the project via a Stripe-powered "buy me a coffee" button ($5).

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) account (free tier is fine)
- A [Stripe](https://stripe.com/) account (free)
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

For `STRIPE_SECRET_KEY`:

1. Go to [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys).
2. Copy the **Secret key** (`sk_test_...` for test mode, `sk_live_...` for production).
3. Use test keys locally — payments won't be real. Switch to live keys in Vercel when you're ready to accept real payments.
4. To test locally, use Stripe's test card `4242 4242 4242 4242` with any future expiry and any CVC.

---

## 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the submission form.  
Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login) to access the admin dashboard.

---

## 7. Deploy to Vercel

Push your code to GitHub, then connect the repo to Vercel.

### First-time setup

1. Go to [vercel.com](https://vercel.com/) and click **Add New > Project**.
2. Import the `app-copyautomate` GitHub repository.
3. Before clicking Deploy, expand **Environment Variables** and add all five variables from the table below.
4. Click **Deploy**.

### Adding environment variables

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-ref.supabase.co` | From Supabase → Settings → API Keys |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | From Supabase → Settings → API Keys |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` | From Supabase → Settings → API Keys |
| `IP_HASH_SALT` | any random string | Run `openssl rand -hex 32` to generate one |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Use live key for production (test key for preview/dev) |

**Option A — Vercel dashboard:**
1. Go to your project → **Settings → Environment Variables**.
2. Add each variable above, keeping all three environment checkboxes ticked (Production, Preview, Development).
3. If the project is already deployed, go to **Deployments** → three-dot menu on the latest → **Redeploy** to pick up the new values.

**Option B — Vercel CLI:**
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npx vercel env add SUPABASE_SECRET_KEY
npx vercel env add IP_HASH_SALT
npx vercel env add STRIPE_SECRET_KEY
npx vercel --prod
```

Each `env add` command will prompt you to paste the value and choose which environments to apply it to.

After deploying, Vercel will give you a production URL. The app is live.

---

## Project structure

```
app/
  page.tsx                  # Public submission form + buy me a coffee button (/)
  success/page.tsx          # Post-payment thank-you page (/success)
  api/submit/route.ts       # POST endpoint — validates, rate-limits, inserts
  api/checkout/route.ts     # POST endpoint — creates Stripe checkout session
  admin/
    page.tsx                # Admin dashboard (/admin)
    login/page.tsx          # Admin login (/admin/login)
    actions.ts              # Server action for logout
components/
  SubmissionForm.tsx        # Chat-style form (client component)
lib/
  schema.ts                 # Shared Zod validation schema
  stripe.ts                 # Stripe singleton (server-only)
  supabase/
    server.ts               # Server-side Supabase clients
    client.ts               # Browser Supabase client
middleware.ts               # Protects /admin/* routes
supabase/migrations/
  001_create_submissions.sql  # Table + RLS setup
```
