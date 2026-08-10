-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/xzcbxliiazrzoqfwhlpr/sql



-- ── Email Templates ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  subject     text NOT NULL DEFAULT 'Your Offer Letter from RGTvertex',
  body_html   text NOT NULL,
  is_default  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_templates_default_idx
  ON email_templates (is_default)
  WHERE is_default = true;

-- ── Per-Offer Email Overrides ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offer_email_overrides (
  offer_id    text PRIMARY KEY,
  subject     text,
  body_html   text,
  updated_at  timestamptz DEFAULT now()
);

-- ── Insert the Default Template ──────────────────────────────────────
INSERT INTO email_templates (name, subject, body_html, is_default)
VALUES (
  'Default Internship Offer',
  'Your Internship Offer Letter from RGTvertex',
  '<p>Dear <strong>{{candidate_name}}</strong>,</p>
<p>Congratulations! We are thrilled to offer you the position of <strong>{{role}}</strong> at <strong>RGTvertex</strong>.</p>
<p>Your internship will begin on <strong>{{joining_date}}</strong> and end on <strong>{{end_date}}</strong>. The mode of work is <strong>{{mode}}</strong>.</p>
<p>Please find your official offer letter attached to this email. This offer is valid until <strong>{{valid_until}}</strong>.</p>
<p>We look forward to welcoming you to the team!</p>
<p>Best regards,<br/><strong>HR Team</strong><br/>RGTvertex</p>',
  true
)
ON CONFLICT DO NOTHING;

-- ── Audit Logs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id    text NOT NULL,
  actor_email text NOT NULL,
  action      text NOT NULL,
  diff        jsonb,
  created_at  timestamptz DEFAULT now()
);

-- ── Candidate Response Tokens ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS response_tokens (
  token        text PRIMARY KEY,
  offer_id     text NOT NULL,
  expires_at   timestamptz NOT NULL,
  responded_at timestamptz,
  response     text
);

-- ── PDF Templates ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pdf_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  employment_type text,
  html_content    text NOT NULL,
  is_default      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pdf_templates_default_idx
  ON pdf_templates (is_default)
  WHERE is_default = true;

-- ── Users ────────────────────────────────────────────────────────────
-- Note: If you have dummy data, you may want to back it up first.
DROP TABLE IF EXISTS rejections;
DROP TABLE IF EXISTS offers;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL CHECK (role IN ('admin', 'manager')),
  department    text, -- Optional for admin, required for manager
  reset_token   text,
  reset_token_expires timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- ── Offers ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name    text NOT NULL,
  candidate_email   text NOT NULL,
  designation       text NOT NULL,
  department        text NOT NULL,
  start_date        date,
  end_date          date,
  mode              text,
  compensation      text,
  offer_issue_date  date,
  valid_until       date,
  pdf_template_id   uuid REFERENCES pdf_templates(id),
  status            text DEFAULT 'Pending' CHECK (status IN ('Draft', 'Pending Approval', 'Pending', 'Sent', 'Failed', 'Accepted', 'Rejected', 'Expired')),
  approval_status   text DEFAULT 'Pending Approval',
  generated_by      uuid REFERENCES users(id),
  created_at        timestamptz DEFAULT now()
);

-- ── Rejections ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rejections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id          uuid REFERENCES offers(id) ON DELETE CASCADE,
  candidate_name    text NOT NULL,
  candidate_email   text NOT NULL,
  reason            text,
  rejected_at       timestamptz DEFAULT now()
);

-- ── Disable RLS ──────────────────────────────────────────────────────
-- Since the backend uses the anon key and manages authentication/authorization itself,
-- we must ensure Row Level Security is disabled so the Node.js server can insert rows.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE rejections DISABLE ROW LEVEL SECURITY;


-- ── RLS Policies ─────────────────────────────────────────────────────
-- Assuming the backend will use the Supabase Service Role key to bypass RLS,
-- but if we want strict enforcement, we can add it here.
-- For now, we rely on the Service Role and explicit WHERE clauses in the API,
-- as custom JWT signing doesn't naturally interop with Supabase's auth.jwt()
-- unless the secrets match.

