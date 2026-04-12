-- ============================================================
-- ScudoSystems — Schema Fixes (Safe to re-run)
-- Adds missing tables/columns/policies used by the app
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- Helper: current tenant for RLS
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

-- ============================================================
-- TENANTS: missing columns used by dashboard + booking
-- ============================================================
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

-- ============================================================
-- STORAGE BUCKETS (logos, avatars, posters, imports)
-- ============================================================
insert into storage.buckets (id, name, public) values ('logos', 'logos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('posters', 'posters', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('imports', 'imports', false)
  on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Logo upload: authenticated'
  ) then
    create policy "Logo upload: authenticated"
      on storage.objects for insert
      with check (bucket_id = 'logos' and auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Logo read: public'
  ) then
    create policy "Logo read: public"
      on storage.objects for select
      using (bucket_id = 'logos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Avatar upload: authenticated'
  ) then
    create policy "Avatar upload: authenticated"
      on storage.objects for insert
      with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Avatar read: public'
  ) then
    create policy "Avatar read: public"
      on storage.objects for select
      using (bucket_id = 'avatars');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Poster upload: authenticated'
  ) then
    create policy "Poster upload: authenticated"
      on storage.objects for insert
      with check (bucket_id = 'posters' and auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Poster read: public'
  ) then
    create policy "Poster read: public"
      on storage.objects for select
      using (bucket_id = 'posters');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Import upload: authenticated'
  ) then
    create policy "Import upload: authenticated"
      on storage.objects for insert
      with check (bucket_id = 'imports' and auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Import read: authenticated'
  ) then
    create policy "Import read: authenticated"
      on storage.objects for select
      using (bucket_id = 'imports' and auth.role() = 'authenticated');
  end if;
end$$;

-- Public read for booking + wait pages (safe to re-run)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'tenants'
      and policyname = 'Tenants: public read for booking & wait'
  ) then
    create policy "Tenants: public read for booking & wait"
      on tenants for select
      using (booking_page_enabled = true or wait_page_enabled = true);
  end if;
end$$;

-- ============================================================
-- BOOKINGS: wait-time + concerns fields
-- ============================================================
alter table bookings
  add column if not exists queue_status text default 'scheduled',
  add column if not exists queue_updated_at timestamptz,
  add column if not exists metadata jsonb,
  add column if not exists customer_concerns text;

-- ============================================================
-- REVIEWS
-- ============================================================
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

alter table reviews
  add column if not exists staff_id uuid references staff(id) on delete set null;

create index if not exists idx_reviews_tenant on reviews(tenant_id);
create index if not exists idx_reviews_booking on reviews(booking_id);
create index if not exists idx_reviews_staff on reviews(staff_id);

alter table reviews enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'Reviews: own tenant only'
  ) then
    create policy "Reviews: own tenant only"
      on reviews for select
      using (tenant_id = get_my_tenant_id());
  end if;
end$$;

-- ============================================================
-- AFFILIATES + COMMISSIONS + PRICING TIERS + EVENT POSTERS
-- ============================================================
create table if not exists affiliates (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  name            text not null,
  email           text,
  phone           text,
  code            text not null,
  commission_type text not null default 'percentage',
  commission_rate numeric(5,2) not null default 15.00,
  fixed_amount_pence integer not null default 0,
  notes           text,
  status          text not null default 'active',
  total_clicks    integer not null default 0,
  total_bookings  integer not null default 0,
  total_earned_pence integer not null default 0,
  total_pending_pence integer not null default 0,
  total_paid_pence integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(tenant_id, code)
);
alter table affiliates add column if not exists fixed_amount_pence integer not null default 0;
create index if not exists idx_affiliates_tenant on affiliates(tenant_id);
create index if not exists idx_affiliates_code on affiliates(code);

create table if not exists affiliate_clicks (
  id              uuid primary key default uuid_generate_v4(),
  affiliate_id    uuid not null references affiliates(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  ip_hash         text,
  user_agent      text,
  referrer        text,
  landing_url     text,
  converted       boolean not null default false,
  clicked_at      timestamptz not null default now()
);
create index if not exists idx_affiliate_clicks_affiliate on affiliate_clicks(affiliate_id);
create index if not exists idx_affiliate_clicks_tenant on affiliate_clicks(tenant_id);
create index if not exists idx_affiliate_clicks_ip_hash on affiliate_clicks(ip_hash);
create index if not exists idx_affiliate_clicks_time on affiliate_clicks(clicked_at);

create table if not exists affiliate_commissions (
  id                  uuid primary key default uuid_generate_v4(),
  affiliate_id        uuid not null references affiliates(id) on delete cascade,
  tenant_id           uuid not null references tenants(id) on delete cascade,
  booking_id          uuid references bookings(id) on delete set null,
  click_id            uuid references affiliate_clicks(id) on delete set null,
  booking_amount_pence integer not null default 0,
  platform_fee_pence   integer not null default 100,
  net_amount_pence     integer not null default 0,
  commission_rate      numeric(5,2) not null,
  commission_type      text not null default 'percentage',
  commission_pence     integer not null default 0,
  status              text not null default 'pending',
  hold_until           timestamptz,
  paid_at              timestamptz,
  fraud_score         integer not null default 0,
  fraud_reasons       text[],
  fraud_verdict       text not null default 'clean',
  ip_hash             text,
  booking_email       text,
  attributed_at       timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_commissions_affiliate on affiliate_commissions(affiliate_id);
create index if not exists idx_commissions_tenant on affiliate_commissions(tenant_id);
create index if not exists idx_commissions_booking on affiliate_commissions(booking_id);
create index if not exists idx_commissions_status on affiliate_commissions(status);
create index if not exists idx_commissions_fraud on affiliate_commissions(fraud_score);

create table if not exists pricing_tiers (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  service_id      uuid references services(id) on delete cascade,
  tier_name       text not null,
  price_pence     integer not null,
  capacity        integer,
  bookings_used   integer not null default 0,
  starts_at       timestamptz,
  ends_at         timestamptz,
  is_active       boolean not null default true,
  display_countdown boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_pricing_tiers_tenant on pricing_tiers(tenant_id);
create index if not exists idx_pricing_tiers_service on pricing_tiers(service_id);
create index if not exists idx_pricing_tiers_active on pricing_tiers(is_active);

create table if not exists event_posters (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  service_id      uuid references services(id) on delete cascade,
  title           text not null,
  description     text,
  poster_url      text,
  event_date      date,
  event_time      time,
  venue_name      text,
  venue_address   text,
  min_age         integer,
  dress_code      text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_event_posters_tenant on event_posters(tenant_id);
create index if not exists idx_event_posters_service on event_posters(service_id);
create index if not exists idx_event_posters_active on event_posters(is_active);

alter table affiliates enable row level security;
alter table affiliate_clicks enable row level security;
alter table affiliate_commissions enable row level security;
alter table pricing_tiers enable row level security;
alter table event_posters enable row level security;

-- Policies (safe)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='affiliates' and policyname='affiliates_select') then
    create policy "affiliates_select" on affiliates for select using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='affiliates' and policyname='affiliates_insert') then
    create policy "affiliates_insert" on affiliates for insert with check (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='affiliates' and policyname='affiliates_update') then
    create policy "affiliates_update" on affiliates for update using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='affiliates' and policyname='affiliates_delete') then
    create policy "affiliates_delete" on affiliates for delete using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='affiliates' and policyname='affiliates_public_read') then
    create policy "affiliates_public_read" on affiliates for select using (status = 'active');
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='affiliate_clicks' and policyname='clicks_select') then
    create policy "clicks_select" on affiliate_clicks for select using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='affiliate_clicks' and policyname='clicks_insert_public') then
    create policy "clicks_insert_public" on affiliate_clicks for insert with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='affiliate_commissions' and policyname='commissions_select') then
    create policy "commissions_select" on affiliate_commissions for select using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='affiliate_commissions' and policyname='commissions_insert') then
    create policy "commissions_insert" on affiliate_commissions for insert with check (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='affiliate_commissions' and policyname='commissions_update') then
    create policy "commissions_update" on affiliate_commissions for update using (tenant_id = get_my_tenant_id());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pricing_tiers' and policyname='tiers_select_owner') then
    create policy "tiers_select_owner" on pricing_tiers for select using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pricing_tiers' and policyname='tiers_select_public') then
    create policy "tiers_select_public" on pricing_tiers for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pricing_tiers' and policyname='tiers_insert') then
    create policy "tiers_insert" on pricing_tiers for insert with check (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pricing_tiers' and policyname='tiers_update') then
    create policy "tiers_update" on pricing_tiers for update using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pricing_tiers' and policyname='tiers_delete') then
    create policy "tiers_delete" on pricing_tiers for delete using (tenant_id = get_my_tenant_id());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='event_posters' and policyname='posters_select_owner') then
    create policy "posters_select_owner" on event_posters for select using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='event_posters' and policyname='posters_select_public') then
    create policy "posters_select_public" on event_posters for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='event_posters' and policyname='posters_insert') then
    create policy "posters_insert" on event_posters for insert with check (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='event_posters' and policyname='posters_update') then
    create policy "posters_update" on event_posters for update using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='event_posters' and policyname='posters_delete') then
    create policy "posters_delete" on event_posters for delete using (tenant_id = get_my_tenant_id());
  end if;
end$$;

-- ============================================================
-- STAFF PORTAL ACCESS + JOB OFFERS
-- ============================================================
create table if not exists staff_portal_access (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  staff_id        uuid references staff(id) on delete set null,
  display_name    text not null,
  email           text not null,
  access_code     text not null,
  role            text not null default 'staff',
  permissions     jsonb not null default '{
    "view_own_bookings": true,
    "view_own_schedule": true,
    "view_own_reviews": true,
    "view_team_bookings": false,
    "view_financials": false
  }'::jsonb,
  reviews_opt_out boolean not null default false,
  is_active       boolean not null default true,
  last_login_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(tenant_id, email)
);
create index if not exists idx_staff_portal_tenant on staff_portal_access(tenant_id);
create index if not exists idx_staff_portal_email on staff_portal_access(email, access_code);

create table if not exists staff_job_offers (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  staff_id        uuid not null references staff(id) on delete cascade,
  role_title      text not null,
  start_at        timestamptz not null,
  end_at          timestamptz not null,
  hourly_rate_pence integer not null default 0,
  notes           text,
  status          text not null default 'pending',
  responded_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_staff_offers_tenant on staff_job_offers(tenant_id);
create index if not exists idx_staff_offers_staff on staff_job_offers(staff_id);
create index if not exists idx_staff_offers_status on staff_job_offers(status);

alter table staff_portal_access enable row level security;
alter table staff_job_offers enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staff_portal_access' and policyname='staff_portal_select') then
    create policy "staff_portal_select" on staff_portal_access for select using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staff_portal_access' and policyname='staff_portal_insert') then
    create policy "staff_portal_insert" on staff_portal_access for insert with check (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staff_portal_access' and policyname='staff_portal_update') then
    create policy "staff_portal_update" on staff_portal_access for update using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staff_portal_access' and policyname='staff_portal_delete') then
    create policy "staff_portal_delete" on staff_portal_access for delete using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staff_portal_access' and policyname='staff_portal_login_check') then
    create policy "staff_portal_login_check" on staff_portal_access for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staff_job_offers' and policyname='staff_offers_select') then
    create policy "staff_offers_select" on staff_job_offers for select using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staff_job_offers' and policyname='staff_offers_insert') then
    create policy "staff_offers_insert" on staff_job_offers for insert with check (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staff_job_offers' and policyname='staff_offers_update') then
    create policy "staff_offers_update" on staff_job_offers for update using (tenant_id = get_my_tenant_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staff_job_offers' and policyname='staff_offers_delete') then
    create policy "staff_offers_delete" on staff_job_offers for delete using (tenant_id = get_my_tenant_id());
  end if;
end$$;

-- ============================================================
-- UPDATED_AT TRIGGERS (safe)
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'affiliates_updated_at') then
    create trigger affiliates_updated_at before update on affiliates
      for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'commissions_updated_at') then
    create trigger commissions_updated_at before update on affiliate_commissions
      for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'pricing_tiers_updated_at') then
    create trigger pricing_tiers_updated_at before update on pricing_tiers
      for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'event_posters_updated_at') then
    create trigger event_posters_updated_at before update on event_posters
      for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'staff_portal_updated_at') then
    create trigger staff_portal_updated_at before update on staff_portal_access
      for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'staff_offers_updated_at') then
    create trigger staff_offers_updated_at before update on staff_job_offers
      for each row execute function set_updated_at();
  end if;
end$$;
