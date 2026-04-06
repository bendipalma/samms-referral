-- SAMMs Clinical Referral Form — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enum types
create type triage_urgency as enum ('low', 'medium', 'high', 'critical');
create type consent_status as enum ('yes', 'no');
create type awareness_level as enum ('yes', 'partial', 'no');
create type gender_identity as enum ('female', 'male', 'non-binary', 'other');
create type functional_capacity as enum ('highly-dysregulated', 'intermittently-engaged', 'engaged-with-support', 'ready-for-activation');
create type financial_approval_status as enum ('approved', 'pending', 'not-requested');
create type financial_responsibility_type as enum ('referring-organisation', 'funding-body', 'third-party', 'private');
create type invoicing_method as enum ('purchase-order', 'accounts-liaise', 'no-po');
create type referral_status as enum ('submitted', 'under-review', 'accepted', 'declined', 'closed');

-- Main referrals table
create table referrals (
  id uuid primary key default gen_random_uuid(),
  reference_number text unique not null,
  status referral_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Section 1: Referrer Details
  organisation_name text not null,
  organisation_suburb text not null,
  referrer_name text not null,
  position text not null,
  referrer_phone text not null,
  referrer_email text not null,

  -- Section 2: Triage & Risk
  triage_urgency triage_urgency not null,
  crisis_acknowledgement boolean not null default false,

  -- Section 3: Participant Consent
  informed_consent consent_status not null,
  participant_awareness awareness_level not null,
  participant_awareness_elaboration text,

  -- Section 4: Participant Information
  participant_name text not null,
  participant_dob date not null,
  gender_identity gender_identity,
  gender_other text,
  participant_phone text not null,
  participant_email text,
  participant_address text,
  safe_to_leave_message consent_status not null,
  interpreter_required consent_status not null,

  -- Section 5: Case Management & Clinical Triage
  reason_for_referral text not null,
  known_barriers jsonb not null default '[]',
  intervention_areas jsonb default '[]',
  support_type_required jsonb default '[]',
  alerts_and_risks jsonb default '[]',
  additional_risk_info text,
  current_supports jsonb default '[]',
  current_supports_other text,
  functional_capacity functional_capacity not null,
  additional_info text,

  -- Section 6: Funding, Approval & Accounts
  funding_sources jsonb not null default '[]',
  funding_source_other text,
  program_funding_body text,
  claim_reference_number text,
  ndis_number text,
  financial_approval financial_approval_status not null,
  approver_name text,
  approver_position text,
  approver_email text,
  sessions_approved integer,
  total_budget_approved numeric(10,2),
  approval_scope_unknown boolean default false,
  financial_responsibility financial_responsibility_type not null,
  invoicing_method invoicing_method not null,
  accounts_contact_name text,
  accounts_contact_email text,
  accounts_contact_phone text,
  billing_org_name text,
  billing_contact_name text,
  billing_email text,
  billing_accounts_payable text,
  billing_address text,

  -- Section 7: Agreements
  funding_responsibility_ack boolean not null default false,
  services_not_commence_ack boolean not null default false,
  referral_review_ack boolean not null default false,
  referrer_declaration boolean not null default false,

  -- File uploads (stored as array of storage paths)
  uploaded_files jsonb default '[]',

  -- Constraints
  constraint chk_consent check (informed_consent = 'yes'),
  constraint chk_crisis_ack check (crisis_acknowledgement = true),
  constraint chk_funding_ack check (funding_responsibility_ack = true),
  constraint chk_services_ack check (services_not_commence_ack = true),
  constraint chk_review_ack check (referral_review_ack = true),
  constraint chk_declaration check (referrer_declaration = true)
);

-- Indexes
create index idx_referrals_status on referrals (status);
create index idx_referrals_created_at on referrals (created_at desc);
create index idx_referrals_reference on referrals (reference_number);
create index idx_referrals_triage on referrals (triage_urgency);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_referrals_updated_at
  before update on referrals
  for each row execute function update_updated_at();

-- Audit log table
create table referral_audit_log (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references referrals(id),
  action text not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  old_values jsonb,
  new_values jsonb
);

create index idx_audit_referral_id on referral_audit_log (referral_id);
create index idx_audit_changed_at on referral_audit_log (changed_at desc);

-- Audit trigger
create or replace function audit_referral_changes()
returns trigger as $$
begin
  insert into referral_audit_log (referral_id, action, old_values, new_values)
  values (
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    case when tg_op != 'DELETE' then to_jsonb(new) else null end
  );
  return new;
end;
$$ language plpgsql;

create trigger trg_referrals_audit
  after insert or update on referrals
  for each row execute function audit_referral_changes();

-- Row Level Security
alter table referrals enable row level security;
alter table referral_audit_log enable row level security;

-- Public can INSERT (for form submissions via service role)
create policy "Allow public insert" on referrals
  for insert with check (true);

-- Only authenticated users can SELECT
create policy "Authenticated can select" on referrals
  for select to authenticated using (true);

-- Only authenticated users can UPDATE
create policy "Authenticated can update" on referrals
  for update to authenticated using (true);

-- No DELETE policy — compliance requirement

-- Audit log: only authenticated can read
create policy "Authenticated can read audit" on referral_audit_log
  for select to authenticated using (true);

create policy "Allow audit insert" on referral_audit_log
  for insert with check (true);

-- Storage bucket for referral files
-- Run in Supabase Dashboard > Storage > Create bucket
-- Bucket name: referral-files
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, application/msword,
--   application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--   image/jpeg, image/png, image/gif

-- Storage policies (run in SQL editor)
-- Allow uploads via service role (handled server-side)
-- Allow authenticated users to read files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'referral-files',
  'referral-files',
  false,
  10485760,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif']
)
on conflict (id) do nothing;
