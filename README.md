# SAMMs Clinical Referral Form

A secure clinical referral form for SAMMs (Self Awareness, Motivation & Management) Professional Services, built with Next.js 14, Tailwind CSS, and Supabase.

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** — styled to match samms.com.au branding
- **Supabase** — PostgreSQL database + file storage
- **Zod** — server-side validation
- **TypeScript**

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set up the database

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor. This creates:

- `referrals` table with all form fields
- `referral_audit_log` table for change tracking
- Row Level Security policies (public INSERT, authenticated SELECT/UPDATE, no DELETE)
- Indexes on `status`, `created_at`, `reference_number`, and `triage_urgency`
- `referral-files` storage bucket

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

### API Route (`/api/referral`)

- Server-side POST handler — `SUPABASE_SERVICE_ROLE_KEY` never reaches the browser
- Zod validation of all inputs
- HTML/script tag sanitisation
- In-memory rate limiting (3 submissions per IP per 10 minutes)
- File upload to Supabase Storage (max 5 files, 10MB each)
- Returns a reference number on success (`SAM-YYMMDD-XXXXX`)

### Form Features

- 7-section clinical referral form
- Conditional logic (consent blocking, critical triage alerts, dynamic fields)
- Client-side validation feedback with server-side enforcement
- File upload with drag-and-drop area
- Mobile responsive
- Accessibility-focused labels and error messages

### Security

- Service role key is server-side only
- All text inputs sanitised (HTML tags stripped)
- Rate limiting on submissions
- RLS policies prevent public reads/deletes
- No DELETE policy for compliance (records must be retained)

## Deployment

Deploy to Vercel:

```bash
vercel
```

Set the three environment variables in your Vercel project settings.
