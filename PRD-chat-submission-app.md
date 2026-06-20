# Product Requirements Document: Project Submission Chat App

## 1. Overview

A simple web app where any visitor (no login required) can submit a description of a project they want to build via a chat-style input box, along with their email. Submissions are stored in Postgres (via Supabase). A separate, authenticated admin page lets approved admins view all submissions.

## 2. Goals

- Let anonymous users submit: email (required), message describing their project (required), first name (optional), last name (optional).
- Store submissions securely in Postgres with no possibility of SQL injection.
- Provide an admin-only dashboard to view submissions, gated by real authentication.
- Prevent spam/abuse via input validation and rate limiting.
- Keep the stack simple, scalable, and low-maintenance.

## 3. Non-Goals

- No user accounts or login for the public-facing form.
- No multi-turn/conversational chat history — each submission is a single, standalone entry (one email + one message per row).
- No email sending/notifications in v1 (e.g. no auto-confirmation emails).
- No editing or deleting submissions from the admin UI in v1 (read-only dashboard is sufficient).

## 4. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | Next.js (App Router, TypeScript) | |
| Styling | Tailwind CSS | |
| Database | Postgres via Supabase | Hosted, not self-managed Docker — see rationale below |
| Validation | Zod | Runtime schema validation, shared between client and server |
| Admin auth | Supabase Auth (email/password) | Admin users created manually via Supabase dashboard; no public sign-up |
| Rate limiting | Upstash Redis (or equivalent IP-based limiter) | Protects the public submit endpoint from spam/flooding |
| Hosting | Vercel (app) + Supabase (DB + Auth) | |

**Why Supabase over a self-hosted Postgres Docker container:** the project is expected to potentially scale, and Supabase removes the operational burden of backups, patching, connection pooling, and failover. It pairs natively with Vercel and includes Auth and Row Level Security out of the box, which this app relies on directly.

## 5. Data Model

### Table: `submissions`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `email` | `text` | Not null, validated as email format |
| `first_name` | `text` | Default `'anonymous'` |
| `last_name` | `text` | Default `'anonymous'` |
| `message` | `text` | Not null, max length enforced (5000 chars) |
| `ip_hash` | `text` | Hashed IP address (for abuse tracking/rate limiting, never store raw IP) |
| `created_at` | `timestamptz` | Default `now()` |

### Row Level Security (RLS)

- RLS is **enabled** on `submissions`.
- **No public INSERT policy exists.** All inserts happen server-side via the Next.js API route using the Supabase **service-role key** (which bypasses RLS by design and is never exposed to the browser).
- **SELECT policy**: only rows visible to `authenticated` Supabase Auth users (i.e., logged-in admins). No anonymous/public read access.
- No UPDATE or DELETE policies in v1 (read-only admin view; deletions/edits can be added later if needed).

## 6. Functional Requirements

### 6.1 Public Submission Page (`/`)

- Single-page form styled as a chat box.
- Fields:
  - **Email** (required, validated as email format, max 255 chars)
  - **Message** (required, textarea, min 1 char, max 5000 chars) — description of what they want to build and how they're going about it
  - **First name** (optional, max 100 chars, defaults to `"anonymous"` if blank)
  - **Last name** (optional, max 100 chars, defaults to `"anonymous"` if blank)
- Client-side validation via Zod (instant feedback) — **not trusted as the source of truth.**
- On submit, POST to `/api/submit`.
- Show a clear success state ("Thanks, we got it") or validation/error messages inline.
- Basic spam deterrence: honeypot field (hidden input that bots fill but humans don't see) in addition to server-side rate limiting.

### 6.2 API Route: `POST /api/submit`

Server-side responsibilities, in order:

1. **Parse and validate** the request body against the Zod schema (reject with 400 + details if invalid).
2. **Rate limit** by hashed IP address (e.g. max 5 submissions per IP per hour — exact threshold configurable). Reject with 429 if exceeded.
3. **Sanitize** strings: trim whitespace, reject/strip null bytes and control characters.
4. **Insert** into `submissions` via the Supabase server-side client using the service-role key. Use the Supabase client's parameterized insert method — **never construct raw SQL strings via concatenation or interpolation.**
5. Return 201 + minimal confirmation on success; return appropriate error codes/messages on failure (without leaking internal details like stack traces or DB errors to the client).

### 6.3 Admin Login (`/admin/login`)

- Email/password form using Supabase Auth (`supabase.auth.signInWithPassword`).
- No public sign-up route exists anywhere in the app — admin accounts are created manually by the project owner via the Supabase dashboard.
- On successful login, redirect to `/admin`.
- On failure, show a generic error (don't reveal whether the email exists).

### 6.4 Admin Dashboard (`/admin`)

- Protected route: Next.js middleware checks for a valid Supabase Auth session; unauthenticated requests redirect to `/admin/login`.
- Displays all submissions in a table: name (first + last, or "anonymous"), email, message, submitted-at timestamp, sorted newest first.
- Basic search/filter by email (optional nice-to-have, not blocking for v1).
- Read-only in v1 — no edit/delete actions.
- Logout button (clears Supabase Auth session).

## 7. Security Requirements

These are non-negotiable and should be treated as acceptance criteria, not nice-to-haves:

1. **No SQL injection vector.** All database access goes through the Supabase client library or parameterized queries. No raw SQL string concatenation/interpolation anywhere in the codebase, ever.
2. **Server-side validation is authoritative.** Client-side Zod validation is for UX only; the API route re-validates everything with the same (or stricter) schema. Never trust data from the request body without validation.
3. **No secrets in client-side code.** The Supabase service-role key (used for inserts) must only ever be referenced in server-side code (API routes, server components) — never in client components, never in `NEXT_PUBLIC_*` env vars.
4. **RLS enabled on all tables**, with explicit policies as described in Section 5. Default-deny: if a policy doesn't explicitly grant access, access is denied.
5. **Rate limiting** on `/api/submit` to prevent spam/flooding, since the endpoint is intentionally open to anonymous traffic.
6. **Input length limits enforced** at the schema level (Zod) to prevent oversized payloads.
7. **Output is safely rendered.** Submitted messages are rendered as plain text/escaped content in the admin dashboard (React's default escaping is sufficient — do not use `dangerouslySetInnerHTML` on user-submitted content).
8. **Admin routes require a real authenticated session** checked server-side (middleware), not just hidden client-side routing.
9. **Generic error messages** returned to the client — never leak stack traces, DB error details, or internal implementation details in API responses.
10. **IP addresses are hashed before storage** (e.g. SHA-256), not stored in raw form, to limit exposure if the database is ever compromised.

## 8. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=        # public, safe for client
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # public, safe for client (RLS protects data)
SUPABASE_SERVICE_ROLE_KEY=       # SERVER-SIDE ONLY, never expose to client
UPSTASH_REDIS_REST_URL=          # for rate limiting
UPSTASH_REDIS_REST_TOKEN=        # for rate limiting
IP_HASH_SALT=                    # secret salt for hashing IPs before storage
```

## 9. Out of Scope / Future Considerations

- Email notifications on new submission (e.g. via Resend or similar).
- Editing/deleting submissions from the admin dashboard.
- Multiple admin roles/permissions tiers.
- Exporting submissions (CSV export) from the admin dashboard.
- Pagination for the admin table (fine to defer until submission volume warrants it).
- CAPTCHA (e.g. hCaptcha/Turnstile) if honeypot + rate limiting prove insufficient against spam.

## 10. Acceptance Criteria Summary

- [ ] Anonymous user can submit email + message (+ optional name) from `/`.
- [ ] Submission with invalid email, empty message, or oversized fields is rejected with a clear error, both client- and server-side.
- [ ] Submitted data lands correctly in the `submissions` table in Supabase.
- [ ] Attempting SQL injection payloads in any field does not affect the database (proven via parameterized queries, not just "didn't break" — i.e. payloads are stored as literal harmless text, not executed).
- [ ] More than the rate limit threshold of submissions from the same IP in the configured window is rejected with a 429.
- [ ] `/admin` redirects to `/admin/login` when not authenticated.
- [ ] Valid admin credentials log in successfully and reach the dashboard; invalid credentials show a generic error.
- [ ] Admin dashboard lists all submissions, newest first, with name defaulting to "anonymous" when not provided.
- [ ] No Supabase service-role key or other secret appears anywhere in client-side bundle or browser dev tools.
- [ ] RLS is enabled on `submissions`, and there is no policy allowing anonymous SELECT/INSERT/UPDATE/DELETE directly against the table (all writes go through the API route's service-role key).
