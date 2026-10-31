-- ============================================================================
-- NOVA — seed plan catalog (demonstration pricing).
-- Prices/limits are editable from the admin dashboard (plans table).
-- ============================================================================

-- Add a monthly credit allowance column used by reset_monthly_credits().
alter table public.plans add column if not exists monthly_credits int not null default 0;

insert into public.plans (
  id, name, description, price_monthly_cents, price_yearly_cents,
  ai_questions, document_processing, storage_bytes, projects_allowed,
  priority_processing, features, active, sort_order, monthly_credits
) values
  (
    'free', 'Starter', 'For getting started with NOVA.',
    0, 0, 20, 5, 2147483648, false, false,
    '["20 AI questions/month","5 documents processed/month","2 GB storage","Basic summaries"]',
    true, 0, 20
  ),
  (
    'pro', 'Pro', 'For serious researchers and knowledge workers.',
    1200, 12000, 500, 200, 21474836480, true, true,
    '["500 AI questions/month","200 documents processed/month","20 GB storage","Research projects","Advanced summaries","Priority processing"]',
    true, 1, 500
  ),
  (
    'team', 'Research Team', 'For teams collaborating on shared research.',
    3900, 39000, 5000, 2000, 107374182400, true, true,
    '["5,000 AI questions/month","2,000 documents processed/month","100 GB storage","Team workspace","Shared research","Collaboration features"]',
    true, 2, 5000
  );

-- Default system settings (admin-editable).
insert into public.system_settings (key, value) values
  ('billing.mode', '{"mode": "test"}'),
  ('limits.upload_max_bytes', '{"value": 10485760}'),
  ('limits.chunk_size_chars', '{"value": 2200}'),
  ('limits.chunk_overlap_chars', '{"value": 300}'),
  ('ai.default_models', '{"chat": "", "summary": "", "embeddings": ""}')
on conflict (key) do nothing;
