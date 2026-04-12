# ScudoSystems — Complete Setup Guide

## Overview

ScudoSystems is your white-label, multi-vertical SaaS booking platform. This guide takes you from zero to a live production deployment collecting real money from customers.

**Tech stack:** Next.js 14 · TypeScript · Supabase · Clerk · Stripe · Resend · Tailwind CSS

---

## Step 1 — Install Dependencies

```bash
cd scudosystem
npm install
```

---

## Step 2 — Create Your Services

### 2a. Clerk (Authentication)

1. Go to **https://clerk.com** → Create new application
2. Enable **"Organizations"** in Clerk dashboard (required for multi-tenant)
3. Set redirect URLs:
   - Sign-in: `http://localhost:3000/sign-in`
   - Sign-up: `http://localhost:3000/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/onboarding`
4. Copy your **Publishable Key** and **Secret Key**

### 2b. Supabase (Database)

1. Go to **https://supabase.com** → New project (region: EU West for UK GDPR)
2. Once created, go to **SQL Editor**
3. Paste the entire contents of `supabase-schema.sql` and run it
4. Go to **Settings → API** to copy your URL and keys

### 2c. Stripe (Payments)

1. Go to **https://stripe.com** → Create account
2. Go to **Developers → API Keys** → copy Publishable and Secret keys
3. Create **one subscription price per industry** (automated):
   ```bash
   cd scudosystem
   STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
   ```
   This script creates products/prices for every industry and prints a single `STRIPE_PRICE_IDS_JSON` line for your `.env.local`.
4. Set up webhook:
   - Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the Webhook Signing Secret

### 2d. Resend (Email)

1. Go to **https://resend.com** → Create account
2. Add and verify your domain (e.g. `hello@scudosystems.com`)
3. Go to **API Keys** → Create key with "Sending access"
4. Copy the API key

---

## Step 3 — Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in all values:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_IDS_JSON={"dental":"price_...","beauty":"price_..."}
STRIPE_JOB_OFFER_PRICE_ID=price_...   # optional if you later charge for job offers

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=hello@scudosystems.com
```

---

## Step 4 — Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to see the landing page.

**Test the full flow:**
1. Click **Start Free Trial** → Sign up as a new user
2. Complete the 5-step onboarding wizard
3. You'll land on the dashboard
4. Visit `/book/your-slug` to see your public booking page

**Optional: Demo mode (instant dashboard preview)**
1. Add to `.env.local`:
   - `NEXT_PUBLIC_DEMO_MODE=true`
   - `DEMO_EMAIL=demo@scudosystems.local`
   - `DEMO_PASSWORD=DemoPass123!`
2. Restart dev server
3. Go to `/sign-in` and click **Enter demo dashboard**

---

## Step 5 — Deploy to Vercel

1. Push to GitHub: `git init && git add . && git commit -m "Initial ScudoSystems build"`
2. Go to **https://vercel.com** → New Project → Import from GitHub
3. Add all environment variables from `.env.local` to Vercel
4. Change `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://scudosystems.com`)
5. Deploy → takes ~2 minutes
6. Point your domain to Vercel in DNS settings

---

## Step 6 — Production Stripe Webhook

Once deployed:
1. In Stripe Dashboard → Webhooks → Update your endpoint URL to your production URL
2. For local testing: use **Stripe CLI** — `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## Architecture Overview

```
scudosystem/
├── app/
│   ├── (marketing)/page.tsx       → Landing page (/)
│   ├── (auth)/sign-up/            → Clerk sign up
│   ├── (auth)/sign-in/            → Clerk sign in
│   ├── onboarding/page.tsx        → 5-step setup wizard
│   ├── dashboard/                 → Protected client dashboard
│   │   ├── layout.tsx             → Sidebar navigation
│   │   ├── page.tsx               → Overview + stats + revenue chart
│   │   ├── bookings/page.tsx      → Calendar + booking management
│   │   ├── customers/page.tsx     → Customer CRM
│   │   ├── services/page.tsx      → Service catalogue
│   │   ├── staff/page.tsx         → Team management
│   │   ├── availability/page.tsx  → Weekly schedule grid
│   │   ├── payments/page.tsx      → Revenue & transactions
│   │   ├── booking-page/page.tsx  → Share + embed + QR code
│   │   └── settings/page.tsx      → Profile, billing, notifications
│   ├── book/[slug]/page.tsx       → Public booking page (customer facing)
│   ├── admin/page.tsx             → Owner super dashboard
│   └── api/
│       ├── webhooks/stripe/       → Stripe webhook handler
│       ├── bookings/create/       → Create booking + send emails
│       ├── bookings/cancel/       → Cancel + notify customer
│       ├── bookings/available-slots/ → Real-time availability check
│       ├── tenants/create/        → Register new tenant
│       └── onboarding/save/       → Save onboarding data
├── lib/
│   ├── supabase.ts                → Browser + server + admin clients
│   ├── stripe.ts                  → Plans, payment intents, webhooks
│   ├── resend.ts                  → 6 email templates
│   ├── verticals.ts               → 9 industry configs + default services
│   └── utils.ts                   → Helpers (currency, slots, slugs)
├── types/
│   ├── database.ts                → Full Supabase type definitions
│   └── index.ts                   → Shared app types
├── middleware.ts                  → Clerk auth guard + admin check
├── supabase-schema.sql            → Full DB schema + RLS policies
└── .env.example                   → All required environment variables
```

---

## Supported Verticals & Default Services

| Vertical | Default Services | Staff Label |
|----------|-----------------|-------------|
| 🦷 Dental | NHS Check-up, Private Consult, Emergency, Scale & Polish, Whitening | Dentist |
| 💇 Beauty | Haircut, Colour, Blow Dry, Nails, Facial | Stylist |
| 🎵 Nightclub | Table, VIP Booth, Guestlist, Birthday Package | Host |
| 🧖 Spa | Swedish Massage, Hot Stone, Facial, Couples Package | Therapist |
| 💪 Gym | PT Session, Group Class, Induction, Nutrition Consult | Trainer |
| 👁️ Optician | Eye Test, Contact Lens, Frame Styling, Children's | Optometrist |
| 🐾 Vet | Consultation, Vaccination, Grooming, Dental, Microchip | Vet |
| 🔧 Auto/MOT | MOT, Full Service, Diagnostics, MOT+Service, Tyre Fitting | Mechanic |
| 📚 Tutoring | 1-to-1 Session, Group, Assessment, Exam Intensive | Tutor |

---

## Pricing Plans

| Plan | Price | Features |
|------|-------|----------|
| Starter | £99/month | 3 services, 100 bookings, email reminders |
| Professional | £199/month | Unlimited everything + SMS + deposits + revenue dashboard |
| Enterprise | £349/month | Multi-location, API, white label, dedicated support |

All plans include a **7-day free trial**.

---

## Customer Flow (End-to-End)

1. Customer visits `scudosystems.com/book/your-slug`
2. Selects service → staff → date → time → enters details
3. Pays deposit (if required) via Stripe
4. Receives confirmation email instantly
5. Gets reminder email 48h before + SMS 24h before
6. You see booking appear live in your dashboard
7. Mark as complete when done — revenue tracked automatically

---

## Admin Dashboard

Access at `/admin` — protected by your `ADMIN_EMAIL` env var.

Shows:
- Total MRR across all tenants
- New signups this week/month
- Churn tracking
- All tenants with plan status, vertical, revenue contribution
- Signup trend chart (last 6 months)
- Tenants by vertical (donut chart)

---

## Security Model

- **Clerk** handles all authentication (JWT, sessions, orgs)
- **Supabase RLS** — each tenant only sees their own data, enforced at database level
- **Stripe webhook signature** — verified on every webhook call
- **Admin route** — protected by middleware checking email against `ADMIN_EMAIL`
- **Input sanitisation** — all user inputs stripped of HTML before saving

---

## Next Steps to Go Live

- [ ] Run `supabase-schema.sql` in your Supabase project
- [ ] Create 3 Stripe products and copy Price IDs to `.env`
- [ ] Set up Clerk with Organizations enabled
- [ ] Add Resend domain and copy API key
- [ ] Deploy to Vercel with all env vars
- [ ] Update Stripe webhook to production URL
- [ ] Test full flow: sign up → onboard → dashboard → booking page → booking → email
- [ ] Point your domain (e.g. scudosystems.com) to Vercel
- [ ] Make your first sale! 🚀

---

## Expanding the Platform

- **Inngest jobs** — Add `inngest.ts` for scheduled reminder sends (48h/24h before bookings)
- **Stripe Connect** — Enable clients to accept card payments directly using the pattern in `docs/STRIPE.md`
- **SMS via Twilio** — Add Twilio client to `lib/twilio.ts` and trigger in reminder jobs
- **Google Calendar sync** — Use Google Calendar API to sync confirmed bookings
- **Multi-location** — Add `locations` table + location selector in booking flow (Enterprise plan)

---

*Built with ScudoSystems · hello@scudosystems.com*
