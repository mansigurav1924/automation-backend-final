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

-- Ensure only one default template at a time
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
  action      text NOT NULL,   -- 'generated', 'sent', 'approved', 'resent', etc.
  diff        jsonb,           -- { before: {}, after: {} }
  created_at  timestamptz DEFAULT now()
);

-- ── Candidate Response Tokens ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS response_tokens (
  token        text PRIMARY KEY,
  offer_id     text NOT NULL,
  expires_at   timestamptz NOT NULL,
  responded_at timestamptz,
  response     text            -- 'accepted' | 'declined'
);

-- ── PDF Templates ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pdf_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  employment_type text,        -- 'intern' | 'full_time' | 'contract'
  html_content    text NOT NULL,
  is_default      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pdf_templates_default_idx
  ON pdf_templates (is_default)
  WHERE is_default = true;
