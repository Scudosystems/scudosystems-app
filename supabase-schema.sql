-- ═══════════════════════════════════════════════════════════════════
-- ScudoSystems — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type vertical_enum as enum (
  'dental', 'beauty', 'hairsalon', 'nightclub', 'spa', 'gym', 'optician', 'vet', 'auto', 'tutoring',
  'restaurant', 'barber', 'tattoo', 'carwash', 'driving', 'takeaway', 'supercar',
  'photography', 'grooming', 'physio', 'nails', 'aesthetics', 'lash', 'escape',
  'solicitor', 'accountant'
);
create type plan_enum as enum ('starter', 'professional', 'enterprise');
create type plan_status_enum as enum ('trialing', 'active', 'past_due', 'cancelled');
create type booking_status_enum as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
create type reminder_type_enum as enum ('email', 'sms');
create type reminder_status_enum as enum ('pending', 'sent', 'failed');

-- ─── Tenants ─────────────────────────────────────────────────────────────────
create table tenants (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid unique not null references auth.users(id) on delete cascade,
  business_name         text not null,
  vertical              vertical_enum not null,
  slug                  text unique not null,
  logo_url              text,
  brand_colour          text not null default '#0d6e6e',
  address               text,
  phone                 text,
  email                 text,
  owner_email           text,
  website               text,
  description           text,
  stripe_customer_id        text,
  stripe_subscription_id    text,
  stripe_connect_account_id text,   -- Stripe Express account for receiving payments
  stripe_connect_onboarded  boolean not null default false,
  plan                  plan_enum not null default 'starter',
  plan_status           plan_status_enum not null default 'trialing',
  trial_ends_at         timestamptz,
  onboarding_completed  boolean not null default false,
  booking_page_enabled  boolean not null default true,
  booking_page_headline text,
  booking_page_subtext  text,
  booking_page_theme    text default 'soft',
  booking_page_cta_label text,
  booking_page_font     text default 'sans',
  booking_page_button_style text default 'solid',
  booking_page_ab_enabled boolean not null default false,
  booking_page_ab_split  integer not null default 50,
  booking_page_ab_auto_apply boolean not null default true,
  booking_page_variant_b_headline text,
  booking_page_variant_b_subtext text,
  booking_page_variant_b_cta_label text,
  booking_page_variant_b_theme text default 'soft',
  booking_page_variant_b_font text default 'sans',
  booking_page_variant_b_button_style text default 'solid',
  booking_page_variant_b_brand_colour text,
  wait_page_enabled boolean not null default true,
  wait_qr_headline text,
  wait_qr_subtext text,
  wait_qr_cta text,
  queue_delay_minutes integer not null default 0,
  booking_poster_offer  text,
  booking_poster_headline text,
  booking_poster_subtext text,
  booking_poster_cta     text,
  booking_poster_image_url text,
  booking_page_show_live_availability boolean not null default false,
  booking_page_live_window_minutes integer not null default 60,
  booking_page_live_buffer_minutes integer not null default 20,
  rental_min_days integer not null default 1,
  rental_requirements text,
  operator_config       jsonb,
  job_offers_enabled boolean not null default false,
  stripe_last_event_at timestamptz,
  stripe_last_event_type text,
  allow_same_day        boolean not null default true,
  minimum_advance_hours integer not null default 0,
  auto_confirm          boolean not null default true,
  require_deposit       boolean not null default false,
  sms_reminders_enabled boolean not null default false,
  email_reminders_enabled boolean not null default true,
  daily_summary_email   boolean not null default true,
  new_booking_sms       boolean not null default false,
  cancellation_policy   text,
  staff_guidelines      text[] not null default array[]::text[],
  -- Payment link shown on booking confirmation + email (PayPal, SumUp, Square, etc.)
  payment_link          text,
  payment_link_label    text,
  payment_link_note     text,
  created_at            timestamptz not null default now()
);

-- ─── Services ────────────────────────────────────────────────────────────────
create table services (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  name             text not null,
  description      text,
  duration_minutes integer not null default 60,
  price_pence      integer not null default 0,
  deposit_pence    integer not null default 0,
  requires_deposit boolean not null default false,
  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now()
);

-- ─── Staff ───────────────────────────────────────────────────────────────────
create table staff (
  id         uuid primary key default uuid_generate_v4(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  name       text not null,
  role       text,
  avatar_url text,
  bio        text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Availability ─────────────────────────────────────────────────────────────
create table availability (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  staff_id     uuid references staff(id) on delete cascade,
  day_of_week  integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time   time not null,
  end_time     time not null,
  is_active    boolean not null default true
);

-- ─── Bookings ────────────────────────────────────────────────────────────────
create table bookings (
  id                       uuid primary key default uuid_generate_v4(),
  tenant_id                uuid not null references tenants(id) on delete cascade,
  service_id               uuid not null references services(id),
  staff_id                 uuid references staff(id),
  customer_name            text not null,
  customer_email           text not null,
  customer_phone           text not null,
  booking_date             date not null,
  booking_time             time not null,
  status                   booking_status_enum not null default 'pending',
  deposit_paid             boolean not null default false,
  deposit_amount_pence     integer not null default 0,
  total_amount_pence       integer not null default 0,
  stripe_payment_intent_id text,
  queue_status            text default 'scheduled',
  queue_updated_at        timestamptz,
  metadata                jsonb,
  notes                    text,
  customer_concerns        text,
  booking_ref              text unique not null,
  created_at               timestamptz not null default now()
);

-- ─── Blocked Times ───────────────────────────────────────────────────────────
create table blocked_times (
  id                    uuid primary key default uuid_generate_v4(),
  tenant_id             uuid not null references tenants(id) on delete cascade,
  staff_id              uuid references staff(id) on delete cascade,
  blocked_date          date,
  start_time            time not null,
  end_time              time not null,
  reason                text,
  is_recurring          boolean not null default false,
  recurring_day_of_week integer
);

-- ─── Reminders ───────────────────────────────────────────────────────────────
create table reminders (
  id           uuid primary key default uuid_generate_v4(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  type         reminder_type_enum not null,
  scheduled_at timestamptz not null,
  sent_at      timestamptz,
  status       reminder_status_enum not null default 'pending'
);

-- ─── Reviews ────────────────────────────────────────────────────────────────
create table if not exists reviews (
  id                 uuid primary key default uuid_generate_v4(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  booking_id         uuid references bookings(id) on delete set null,
  staff_id           uuid references staff(id) on delete set null,
  booking_ref        text,
  display_name       text,
  rating             integer not null check (rating >= 1 and rating <= 5),
  timing_rating      integer check (timing_rating >= 1 and timing_rating <= 5),
  service_rating     integer check (service_rating >= 1 and service_rating <= 5),
  cleanliness_rating integer check (cleanliness_rating >= 1 and cleanliness_rating <= 5),
  comment            text,
  created_at         timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════
create index idx_tenants_slug on tenants(slug);
create index idx_tenants_user_id on tenants(user_id);
create index idx_services_tenant on services(tenant_id);
create index idx_staff_tenant on staff(tenant_id);
create index idx_availability_tenant on availability(tenant_id);
create index idx_bookings_tenant on bookings(tenant_id);
create index idx_bookings_date on bookings(booking_date);
create index idx_bookings_email on bookings(customer_email);
create index idx_blocked_tenant on blocked_times(tenant_id);
create index idx_reminders_booking on reminders(booking_id);
create index idx_reminders_status on reminders(status);
create index idx_reviews_tenant on reviews(tenant_id);
create index idx_reviews_booking on reviews(booking_id);
create index idx_reviews_staff on reviews(staff_id);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════
alter table tenants enable row level security;
alter table services enable row level security;
alter table staff enable row level security;
alter table availability enable row level security;
alter table bookings enable row level security;
alter table blocked_times enable row level security;
alter table reminders enable row level security;
alter table reviews enable row level security;

-- Helper function to get tenant_id from Supabase auth user
create or replace function get_my_tenant_id()
returns uuid
language sql
security definer
as $$
  select id from tenants
  where user_id = auth.uid()
  order by onboarding_completed desc, created_at desc
  limit 1;
$$;

-- Tenants: Users can only read/write their own tenant
create policy "Tenants: own record only"
  on tenants for all
  using (user_id = auth.uid());

-- Services: scoped to tenant
create policy "Services: own tenant only"
  on services for all
  using (tenant_id = get_my_tenant_id());

create policy "Services: public read for active"
  on services for select
  using (is_active = true);

-- Staff: scoped to tenant
create policy "Staff: own tenant only"
  on staff for all
  using (tenant_id = get_my_tenant_id());

create policy "Staff: public read for active"
  on staff for select
  using (is_active = true);

-- Availability: scoped to tenant
create policy "Availability: own tenant only"
  on availability for all
  using (tenant_id = get_my_tenant_id());

create policy "Availability: public read"
  on availability for select
  using (is_active = true);

-- Bookings: scoped to tenant
create policy "Bookings: own tenant only"
  on bookings for all
  using (tenant_id = get_my_tenant_id());

create policy "Bookings: public insert"
  on bookings for insert
  with check (true);

-- Blocked times: scoped to tenant
create policy "Blocked: own tenant only"
  on blocked_times for all
  using (tenant_id = get_my_tenant_id());

create policy "Blocked: public read"
  on blocked_times for select
  using (true);

-- Reminders: scoped via booking
create policy "Reminders: own tenant only"
  on reminders for all
  using (
    booking_id in (
      select id from bookings where tenant_id = get_my_tenant_id()
    )
  );

create policy "Reviews: own tenant only"
  on reviews for select
  using (tenant_id = get_my_tenant_id());

-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public) values ('logos', 'logos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('posters', 'posters', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('imports', 'imports', false)
  on conflict (id) do nothing;

create policy "Logo upload: authenticated"
  on storage.objects for insert
  with check (bucket_id = 'logos' and auth.role() = 'authenticated');

create policy "Logo read: public"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Avatar upload: authenticated"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Avatar read: public"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Poster upload: authenticated"
  on storage.objects for insert
  with check (bucket_id = 'posters' and auth.role() = 'authenticated');

create policy "Poster read: public"
  on storage.objects for select
  using (bucket_id = 'posters');

create policy "Import upload: authenticated"
  on storage.objects for insert
  with check (bucket_id = 'imports' and auth.role() = 'authenticated');

create policy "Import read: authenticated"
  on storage.objects for select
  using (bucket_id = 'imports' and auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════════
-- OPTIONAL MIGRATIONS
-- ═══════════════════════════════════════════════════════════════════
alter type vertical_enum add value if not exists 'hairsalon';

alter table tenants
  add column if not exists booking_page_headline text,
  add column if not exists booking_page_subtext text,
  add column if not exists booking_page_theme text default 'soft',
  add column if not exists booking_page_cta_label text,
  add column if not exists booking_page_font text default 'sans',
  add column if not exists booking_page_button_style text default 'solid',
  add column if not exists booking_page_ab_enabled boolean not null default false,
  add column if not exists booking_page_ab_split integer not null default 50,
  add column if not exists booking_page_ab_auto_apply boolean not null default true,
  add column if not exists booking_page_variant_b_headline text,
  add column if not exists booking_page_variant_b_subtext text,
  add column if not exists booking_page_variant_b_cta_label text,
  add column if not exists booking_page_variant_b_theme text default 'soft',
  add column if not exists booking_page_variant_b_font text default 'sans',
  add column if not exists booking_page_variant_b_button_style text default 'solid',
  add column if not exists booking_page_variant_b_brand_colour text,
  add column if not exists wait_page_enabled boolean not null default true,
  add column if not exists wait_qr_headline text,
  add column if not exists wait_qr_subtext text,
  add column if not exists wait_qr_cta text,
  add column if not exists queue_delay_minutes integer not null default 0,
  add column if not exists booking_poster_offer text,
  add column if not exists booking_poster_headline text,
  add column if not exists booking_poster_subtext text,
  add column if not exists booking_poster_cta text,
  add column if not exists booking_poster_image_url text,
  add column if not exists booking_page_show_live_availability boolean not null default false,
  add column if not exists booking_page_live_window_minutes integer not null default 60,
  add column if not exists booking_page_live_buffer_minutes integer not null default 20,
  add column if not exists rental_min_days integer not null default 1,
  add column if not exists rental_requirements text,
  add column if not exists job_offers_enabled boolean not null default false,
  add column if not exists stripe_last_event_at timestamptz,
  add column if not exists stripe_last_event_type text,
  add column if not exists staff_guidelines text[] not null default array[]::text[];

alter table bookings
  add column if not exists queue_status text default 'scheduled',
  add column if not exists queue_updated_at timestamptz,
  add column if not exists metadata jsonb,
  add column if not exists customer_concerns text;

alter table reviews
  add column if not exists staff_id uuid references staff(id) on delete set null;

create table if not exists booking_page_ab_stats (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  variant text not null check (variant in ('A','B')),
  views integer not null default 0,
  bookings integer not null default 0,
  updated_at timestamptz not null default now()
);

create unique index if not exists booking_page_ab_stats_unique on booking_page_ab_stats(tenant_id, variant);

alter table booking_page_ab_stats enable row level security;

create policy "AB stats: own tenant only"
  on booking_page_ab_stats for select
  using (tenant_id = get_my_tenant_id());

create or replace function increment_booking_page_ab_stat(
  p_tenant uuid,
  p_variant text,
  p_views integer,
  p_bookings integer
)
returns void
language plpgsql
security definer
as $$
begin
  insert into booking_page_ab_stats (tenant_id, variant, views, bookings)
  values (p_tenant, p_variant, p_views, p_bookings)
  on conflict (tenant_id, variant) do update
    set views = booking_page_ab_stats.views + excluded.views,
        bookings = booking_page_ab_stats.bookings + excluded.bookings,
        updated_at = now();
end;
$$;

create index if not exists idx_reviews_tenant_mig on reviews(tenant_id);
create index if not exists idx_reviews_booking_mig on reviews(booking_id);
create index if not exists idx_reviews_staff_mig on reviews(staff_id);
