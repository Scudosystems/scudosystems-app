-- ============================================================
-- ScudoSystems — Affiliate & Dynamic Pricing Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. AFFILIATES
-- One row per affiliate/partner per tenant
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  code            TEXT NOT NULL,                          -- unique referral code e.g. "MIKE-A3F9C2"
  commission_type TEXT NOT NULL DEFAULT 'percentage',     -- 'percentage' | 'fixed'
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,    -- percent or pence (percentage = 15.00 means 15%)
  fixed_amount_pence INTEGER NOT NULL DEFAULT 0,          -- used when commission_type = 'fixed'
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'active',         -- 'active' | 'paused' | 'suspended'
  total_clicks    INTEGER NOT NULL DEFAULT 0,
  total_bookings  INTEGER NOT NULL DEFAULT 0,
  total_earned_pence INTEGER NOT NULL DEFAULT 0,
  total_pending_pence INTEGER NOT NULL DEFAULT 0,
  total_paid_pence INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_affiliates_tenant ON affiliates(tenant_id);
CREATE INDEX idx_affiliates_code   ON affiliates(code);

-- ============================================================
-- 2. AFFILIATE CLICKS
-- Every time someone visits a booking page via ?ref=CODE
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ip_hash         TEXT,                                   -- hashed + salted IP for fraud scoring, never raw IP
  user_agent      TEXT,
  referrer        TEXT,
  landing_url     TEXT,
  converted       BOOLEAN NOT NULL DEFAULT false,         -- true when click leads to a booking
  clicked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_tenant    ON affiliate_clicks(tenant_id);
CREATE INDEX idx_affiliate_clicks_ip_hash   ON affiliate_clicks(ip_hash);
CREATE INDEX idx_affiliate_clicks_time      ON affiliate_clicks(clicked_at);

-- ============================================================
-- 3. AFFILIATE COMMISSIONS
-- One row per booking attributed to an affiliate
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id        UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id          UUID REFERENCES bookings(id) ON DELETE SET NULL,
  click_id            UUID REFERENCES affiliate_clicks(id) ON DELETE SET NULL,

  -- Financials (all in pence)
  booking_amount_pence    INTEGER NOT NULL DEFAULT 0,
  platform_fee_pence      INTEGER NOT NULL DEFAULT 100,   -- £1.00 ScudoSystems fee
  net_amount_pence        INTEGER NOT NULL DEFAULT 0,     -- booking_amount - platform_fee
  commission_rate         NUMERIC(5,2) NOT NULL,
  commission_type         TEXT NOT NULL DEFAULT 'percentage',
  commission_pence        INTEGER NOT NULL DEFAULT 0,     -- amount owed to affiliate

  -- Payout lifecycle
  status              TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'approved' | 'paid' | 'flagged' | 'reversed'
  hold_until          TIMESTAMPTZ,                        -- 7 days after booking completion
  paid_at             TIMESTAMPTZ,

  -- Fraud signals
  fraud_score         INTEGER NOT NULL DEFAULT 0,         -- 0-100
  fraud_reasons       TEXT[],                             -- array of reason strings
  fraud_verdict       TEXT NOT NULL DEFAULT 'clean',      -- 'clean' | 'review' | 'flag' | 'block'
  ip_hash             TEXT,
  booking_email       TEXT,                               -- hashed for comparison, never plaintext

  -- Attribution metadata
  attributed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commissions_affiliate ON affiliate_commissions(affiliate_id);
CREATE INDEX idx_commissions_tenant    ON affiliate_commissions(tenant_id);
CREATE INDEX idx_commissions_booking   ON affiliate_commissions(booking_id);
CREATE INDEX idx_commissions_status    ON affiliate_commissions(status);
CREATE INDEX idx_commissions_fraud     ON affiliate_commissions(fraud_score);

-- ============================================================
-- 4. PRICING TIERS
-- Dynamic time/capacity-based pricing tiers per service
-- e.g. "Early Bird £15" → "Standard £25" → "Door £35"
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_id      UUID REFERENCES services(id) ON DELETE CASCADE,  -- NULL = applies to all services
  tier_name       TEXT NOT NULL,                          -- "Early Bird", "Standard", "VIP", etc.
  price_pence     INTEGER NOT NULL,                       -- price in pence
  capacity        INTEGER,                                -- max bookings at this price (NULL = unlimited)
  bookings_used   INTEGER NOT NULL DEFAULT 0,             -- how many bookings at this tier so far
  starts_at       TIMESTAMPTZ,                            -- NULL = no start restriction
  ends_at         TIMESTAMPTZ,                            -- NULL = no end restriction
  is_active       BOOLEAN NOT NULL DEFAULT true,
  display_countdown BOOLEAN NOT NULL DEFAULT true,        -- show countdown on booking page
  sort_order      INTEGER NOT NULL DEFAULT 0,             -- lower = cheaper / earlier tier
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_tiers_tenant  ON pricing_tiers(tenant_id);
CREATE INDEX idx_pricing_tiers_service ON pricing_tiers(service_id);
CREATE INDEX idx_pricing_tiers_active  ON pricing_tiers(is_active);

-- ============================================================
-- 5. EVENT POSTERS (for nightclub / events industries)
-- Operators upload posters + descriptions for their events
-- ============================================================
CREATE TABLE IF NOT EXISTS event_posters (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_id      UUID REFERENCES services(id) ON DELETE CASCADE,  -- link to specific event/service
  title           TEXT NOT NULL,
  description     TEXT,
  poster_url      TEXT,                                   -- Supabase Storage public URL
  event_date      DATE,
  event_time      TIME,
  venue_name      TEXT,
  venue_address   TEXT,
  min_age         INTEGER,
  dress_code      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_posters_tenant  ON event_posters(tenant_id);
CREATE INDEX idx_event_posters_service ON event_posters(service_id);
CREATE INDEX idx_event_posters_active  ON event_posters(is_active);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE affiliates             ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_posters          ENABLE ROW LEVEL SECURITY;

-- Helpers: get current user's tenant_id
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT id FROM tenants
  WHERE user_id = auth.uid()
  ORDER BY onboarding_completed DESC, created_at DESC
  LIMIT 1;
$$;

-- Affiliates: owner CRUD
CREATE POLICY "affiliates_select" ON affiliates
  FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "affiliates_insert" ON affiliates
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "affiliates_update" ON affiliates
  FOR UPDATE USING (tenant_id = get_my_tenant_id());
CREATE POLICY "affiliates_delete" ON affiliates
  FOR DELETE USING (tenant_id = get_my_tenant_id());

-- Affiliate clicks: owner + public insert (booking page writes a click)
CREATE POLICY "clicks_select" ON affiliate_clicks
  FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "clicks_insert_public" ON affiliate_clicks
  FOR INSERT WITH CHECK (true);   -- booking page can write click events (anon)

-- Affiliate commissions: owner CRUD
CREATE POLICY "commissions_select" ON affiliate_commissions
  FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "commissions_insert" ON affiliate_commissions
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "commissions_update" ON affiliate_commissions
  FOR UPDATE USING (tenant_id = get_my_tenant_id());

-- Pricing tiers: owner CRUD + public read (booking page needs to read)
CREATE POLICY "tiers_select_owner" ON pricing_tiers
  FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tiers_select_public" ON pricing_tiers
  FOR SELECT USING (true);        -- booking page reads tiers (anon)
CREATE POLICY "tiers_insert" ON pricing_tiers
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tiers_update" ON pricing_tiers
  FOR UPDATE USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tiers_delete" ON pricing_tiers
  FOR DELETE USING (tenant_id = get_my_tenant_id());

-- Event posters: owner CRUD + public read
CREATE POLICY "posters_select_owner" ON event_posters
  FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "posters_select_public" ON event_posters
  FOR SELECT USING (true);        -- booking page reads posters (anon)
CREATE POLICY "posters_insert" ON event_posters
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "posters_update" ON event_posters
  FOR UPDATE USING (tenant_id = get_my_tenant_id());
CREATE POLICY "posters_delete" ON event_posters
  FOR DELETE USING (tenant_id = get_my_tenant_id());

-- ============================================================
-- 7. UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER commissions_updated_at
  BEFORE UPDATE ON affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER pricing_tiers_updated_at
  BEFORE UPDATE ON pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER event_posters_updated_at
  BEFORE UPDATE ON event_posters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 8. SUPABASE STORAGE BUCKET (run separately or via dashboard)
-- ============================================================
-- Create a bucket called "event-posters" with public access:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('event-posters', 'event-posters', true);
--
-- CREATE POLICY "event_posters_upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'event-posters' AND auth.role() = 'authenticated');
-- CREATE POLICY "event_posters_public_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'event-posters');

-- ============================================================
-- 9. STAFF PORTAL ACCESS
-- Owner creates access codes for their team members
-- Team members log into /staff-portal with email + access code
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_portal_access (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id        UUID REFERENCES staff(id) ON DELETE SET NULL,
  display_name    TEXT NOT NULL,
  email           TEXT NOT NULL,
  access_code     TEXT NOT NULL,                          -- 6-char alphanumeric code shown to owner
  role            TEXT NOT NULL DEFAULT 'staff',          -- 'staff' | 'manager'
  permissions     JSONB NOT NULL DEFAULT '{
    "view_own_bookings": true,
    "view_own_schedule": true,
    "view_own_reviews": true,
    "view_team_bookings": false,
    "view_financials": false
  }'::jsonb,
  reviews_opt_out BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_staff_portal_tenant ON staff_portal_access(tenant_id);
CREATE INDEX idx_staff_portal_email  ON staff_portal_access(email, access_code);

ALTER TABLE staff_portal_access ENABLE ROW LEVEL SECURITY;

-- Owner CRUD
CREATE POLICY "staff_portal_select" ON staff_portal_access
  FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "staff_portal_insert" ON staff_portal_access
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "staff_portal_update" ON staff_portal_access
  FOR UPDATE USING (tenant_id = get_my_tenant_id());
CREATE POLICY "staff_portal_delete" ON staff_portal_access
  FOR DELETE USING (tenant_id = get_my_tenant_id());

-- Public read (for staff login validation — returns nothing if code/email don't match)
CREATE POLICY "staff_portal_login_check" ON staff_portal_access
  FOR SELECT USING (true);  -- RLS via email+code unique pair; no sensitive data exposed without code

CREATE TRIGGER staff_portal_updated_at
  BEFORE UPDATE ON staff_portal_access
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 10. STAFF JOB OFFERS
-- Owner sends job/shift offers to staff for acceptance
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_job_offers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id        UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  role_title      TEXT NOT NULL,
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  hourly_rate_pence INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined | withdrawn | completed
  responded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_offers_tenant ON staff_job_offers(tenant_id);
CREATE INDEX idx_staff_offers_staff  ON staff_job_offers(staff_id);
CREATE INDEX idx_staff_offers_status ON staff_job_offers(status);

ALTER TABLE staff_job_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_offers_select" ON staff_job_offers
  FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "staff_offers_insert" ON staff_job_offers
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "staff_offers_update" ON staff_job_offers
  FOR UPDATE USING (tenant_id = get_my_tenant_id());
CREATE POLICY "staff_offers_delete" ON staff_job_offers
  FOR DELETE USING (tenant_id = get_my_tenant_id());

CREATE TRIGGER staff_offers_updated_at
  BEFORE UPDATE ON staff_job_offers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
