-- ============================================================================
-- NOVA — initial schema
-- All user-owned data is protected by Row Level Security. Ownership is always
-- derived from the authenticated server-side session (auth.uid()), never from
-- client-supplied values.
-- ============================================================================

-- pgvector (used for embeddings-driven retrieval; function guards allow the
-- rest of the schema to exist even when the extension is unavailable).
create extension if not exists vector with schema extensions;

-- ============================================================================
-- EXTENSIONS / HELPERS
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================================
-- PROFILES
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  profession text,
  interests text[] not null default '{}',
  role text not null default 'user' check (role in ('user', 'admin')),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_admin_all" on public.profiles
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================================
-- WORKSPACES / MEMBERS
-- ============================================================================

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_idx on public.workspace_members (user_id);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create or replace function public.is_workspace_member(wid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = wid and m.user_id = auth.uid()
  );
$$;

create policy "workspaces_member_select" on public.workspaces
  for select using (public.is_workspace_member(id));
create policy "workspaces_owner_insert" on public.workspaces
  for insert with check (owner_id = auth.uid());
create policy "workspaces_owner_update" on public.workspaces
  for update using (owner_id = auth.uid());
create policy "workspaces_owner_delete" on public.workspaces
  for delete using (owner_id = auth.uid());

create policy "members_select" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
create policy "members_owner_insert" on public.workspace_members
  for insert with check (public.is_workspace_member(workspace_id));
create policy "members_owner_delete" on public.workspace_members
  for delete using (public.is_workspace_member(workspace_id));

-- ============================================================================
-- FOLDERS / TAGS
-- ============================================================================

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  parent_id uuid references public.folders (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index folders_workspace_idx on public.folders (workspace_id);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  color text not null default '#7568FF',
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

alter table public.folders enable row level security;
alter table public.tags enable row level security;

create policy "folders_member_all" on public.folders
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "tags_member_all" on public.tags
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete set null,
  title text not null,
  original_filename text not null,
  file_type text not null check (file_type in ('pdf', 'docx', 'txt')),
  file_size bigint not null default 0,
  storage_path text not null,
  status text not null default 'uploading'
    check (status in ('uploading', 'queued', 'processing', 'completed', 'failed')),
  extracted_text_available boolean not null default false,
  summary_available boolean not null default false,
  page_count int,
  error_message text,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_workspace_idx on public.documents (workspace_id);
create index documents_owner_idx on public.documents (owner_id);
create index documents_status_idx on public.documents (status);
create index documents_created_idx on public.documents (created_at desc);

create trigger documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

create policy "documents_member_select" on public.documents
  for select using (public.is_workspace_member(workspace_id));
create policy "documents_member_insert" on public.documents
  for insert with check (public.is_workspace_member(workspace_id));
create policy "documents_member_update" on public.documents
  for update using (public.is_workspace_member(workspace_id));
create policy "documents_member_delete" on public.documents
  for delete using (public.is_workspace_member(workspace_id));

-- ============================================================================
-- DOCUMENT CHUNKS + EMBEDDINGS (pgvector)
-- ============================================================================

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  idx int not null,
  content text not null,
  char_count int not null default 0,
  page_hint int,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (document_id, idx)
);

create index document_chunks_document_idx on public.document_chunks (document_id);

-- RPC used by the retrieval layer. Falls back to keyword search in the app
-- when the vector extension / embeddings are unavailable.
create or replace function public.match_documents(
  workspace_id uuid,
  query_embedding vector(1536),
  match_count int default 8,
  filter_document_ids uuid[] default null
)
returns table (chunk_id uuid, document_id uuid, content text, page_hint int, similarity float)
language plpgsql as $$
begin
  if filter_document_ids is null then
    return query
      select c.id, c.document_id, c.content, c.page_hint, 1 - (c.embedding <=> query_embedding) as similarity
      from public.document_chunks c
      join public.documents d on d.id = c.document_id
      where d.workspace_id = match_documents.workspace_id
        and c.embedding is not null
      order by c.embedding <=> query_embedding
      limit match_count;
  else
    return query
      select c.id, c.document_id, c.content, c.page_hint, 1 - (c.embedding <=> query_embedding) as similarity
      from public.document_chunks c
      join public.documents d on d.id = c.document_id
      where d.workspace_id = match_documents.workspace_id
        and c.document_id = any(filter_document_ids)
        and c.embedding is not null
      order by c.embedding <=> query_embedding
      limit match_count;
  end if;
end $$;

alter table public.document_chunks enable row level security;

create policy "chunks_member_select" on public.document_chunks
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and public.is_workspace_member(d.workspace_id)
    )
  );
create policy "chunks_member_insert" on public.document_chunks
  for insert with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id and public.is_workspace_member(d.workspace_id)
    )
  );

-- ============================================================================
-- PROCESSING JOBS
-- ============================================================================

create table public.document_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  kind text not null default 'extract',
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  last_error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_document_idx on public.document_processing_jobs (document_id);
create index jobs_status_idx on public.document_processing_jobs (status);

alter table public.document_processing_jobs enable row level security;

create policy "jobs_member_select" on public.document_processing_jobs
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and public.is_workspace_member(d.workspace_id)
    )
  );
create policy "jobs_member_insert" on public.document_processing_jobs
  for insert with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id and public.is_workspace_member(d.workspace_id)
    )
  );
create policy "jobs_member_update" on public.document_processing_jobs
  for update using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and public.is_workspace_member(d.workspace_id)
    )
  );

-- ============================================================================
-- TAGS (documents)
-- ============================================================================

create table public.document_tags (
  document_id uuid not null references public.documents (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (document_id, tag_id)
);

alter table public.document_tags enable row level security;

create policy "document_tags_member_all" on public.document_tags
  for all using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and public.is_workspace_member(d.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id and public.is_workspace_member(d.workspace_id)
    )
  );

-- ============================================================================
-- RESEARCH PROJECTS
-- ============================================================================

create table public.research_projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_documents (
  project_id uuid not null references public.research_projects (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  added_by uuid not null references public.profiles (id),
  added_at timestamptz not null default now(),
  primary key (project_id, document_id)
);

create index project_documents_document_idx on public.project_documents (document_id);
create index projects_workspace_idx on public.research_projects (workspace_id);

alter table public.research_projects enable row level security;
alter table public.project_documents enable row level security;

create policy "projects_member_all" on public.research_projects
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "project_documents_member_all" on public.project_documents
  for all using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_workspace_member(p.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_workspace_member(p.workspace_id)
    )
  );

-- ============================================================================
-- CONVERSATIONS + MESSAGES
-- ============================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'New conversation',
  pinned boolean not null default false,
  archived boolean not null default false,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_documents (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  primary key (conversation_id, document_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations jsonb not null default '[]',
  model text,
  token_usage jsonb,
  created_at timestamptz not null default now()
);

create index conversations_owner_idx on public.conversations (owner_id);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.conversation_documents enable row level security;
alter table public.messages enable row level security;

create policy "conversations_member_all" on public.conversations
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "conversation_documents_member_all" on public.conversation_documents
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and public.is_workspace_member(c.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and public.is_workspace_member(c.workspace_id)
    )
  );
create policy "messages_member_all" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and public.is_workspace_member(c.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and public.is_workspace_member(c.workspace_id)
    )
  );

-- ============================================================================
-- NOTES
-- ============================================================================

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled note',
  content text not null default '',
  pinned boolean not null default false,
  document_id uuid references public.documents (id) on delete set null,
  project_id uuid references public.research_projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.note_tags (
  note_id uuid not null references public.notes (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (note_id, tag_id)
);

create index notes_owner_idx on public.notes (owner_id);
create index notes_document_idx on public.notes (document_id);

alter table public.notes enable row level security;
alter table public.note_tags enable row level security;

create policy "notes_member_all" on public.notes
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "note_tags_member_all" on public.note_tags
  for all using (
    exists (
      select 1 from public.notes n
      where n.id = note_id and public.is_workspace_member(n.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.notes n
      where n.id = note_id and public.is_workspace_member(n.workspace_id)
    )
  );

-- ============================================================================
-- KNOWLEDGE GRAPH
-- ============================================================================

create table public.knowledge_entities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  label text not null,
  type text not null default 'concept',
  meta jsonb not null default '{}',
  doc_count int not null default 1,
  created_at timestamptz not null default now()
);

create table public.knowledge_relationships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  source_id uuid not null references public.knowledge_entities (id) on delete cascade,
  target_id uuid not null references public.knowledge_entities (id) on delete cascade,
  relation text not null default 'related',
  weight float not null default 1,
  created_at timestamptz not null default now()
);

create index entities_workspace_idx on public.knowledge_entities (workspace_id);
create index relationships_workspace_idx on public.knowledge_relationships (workspace_id);

alter table public.knowledge_entities enable row level security;
alter table public.knowledge_relationships enable row level security;

create policy "entities_member_all" on public.knowledge_entities
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "relationships_member_all" on public.knowledge_relationships
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ============================================================================
-- PLANS / SUBSCRIPTIONS / BILLING
-- ============================================================================

create table public.plans (
  id text primary key,
  name text not null,
  description text not null default '',
  price_monthly_cents int not null default 0,
  price_yearly_cents int not null default 0,
  currency text not null default 'usd',
  ai_questions int not null default 0,
  document_processing int not null default 0,
  storage_bytes bigint not null default 0,
  projects_allowed boolean not null default false,
  priority_processing boolean not null default false,
  features jsonb not null default '[]',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id text not null references public.plans (id),
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default now() + interval '1 month',
  cancel_at_period_end boolean not null default false,
  provider text not null default 'manual',
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider_customer_id text not null,
  provider text not null default 'stripe',
  created_at timestamptz not null default now(),
  unique (user_id),
  unique (provider, provider_customer_id)
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  provider text not null default 'stripe',
  provider_transaction_id text,
  type text not null default 'payment' check (type in ('payment', 'refund', 'payout')),
  amount_cents int not null,
  currency text not null default 'usd',
  status text not null default 'succeeded',
  invoice_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (provider, provider_transaction_id)
);

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_customers enable row level security;
alter table public.payment_transactions enable row level security;

create policy "plans_public_read" on public.plans
  for select using (true);
create policy "plans_admin_write" on public.plans
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "subscriptions_own_all" on public.subscriptions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "customers_own_all" on public.billing_customers
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "transactions_own_select" on public.payment_transactions
  for select using (user_id = auth.uid());

-- ============================================================================
-- CREDITS / USAGE (immutable ledger)
-- ============================================================================

create table public.credit_accounts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance int not null default 0,
  lifetime_units int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount int not null,
  reason text not null,
  ref_type text,
  ref_id uuid,
  created_at timestamptz not null default now()
);

create index credit_transactions_user_idx on public.credit_transactions (user_id, created_at desc);

create table public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null default current_date,
  metric text not null,
  units int not null default 1,
  created_at timestamptz not null default now()
);

create index usage_records_user_date_idx on public.usage_records (user_id, date);

alter table public.credit_accounts enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.usage_records enable row level security;

create policy "credit_accounts_own_select" on public.credit_accounts
  for select using (user_id = auth.uid());
create policy "credit_transactions_own_select" on public.credit_transactions
  for select using (user_id = auth.uid());
create policy "usage_records_own_select" on public.usage_records
  for select using (user_id = auth.uid());

-- Atomic credit deduction. Used by server code only (service role). Raises an
-- exception when insufficient credits exist so the caller can roll back.
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_ref_type text default null,
  p_ref_id uuid default null
)
returns int language plpgsql security definer as $$
declare
  new_balance int;
begin
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  update public.credit_accounts
     set balance = balance - p_amount,
         updated_at = now()
   where user_id = p_user_id
     and balance >= p_amount
   returning balance into new_balance;

  if not found then
    raise exception 'insufficient_credits';
  end if;

  insert into public.credit_transactions (user_id, amount, reason, ref_type, ref_id)
  values (p_user_id, -p_amount, p_reason, p_ref_type, p_ref_id);

  insert into public.usage_records (user_id, metric, units)
  values (p_user_id, p_reason, p_amount);

  return new_balance;
end $$;

-- Admin grant / adjustment (audited by the caller for admin_audit_logs).
create or replace function public.adjust_credits(
  p_user_id uuid,
  p_amount int,
  p_reason text
)
returns int language plpgsql security definer as $$
declare
  new_balance int;
begin
  update public.credit_accounts
     set balance = balance + p_amount,
         lifetime_units = lifetime_units + greatest(p_amount, 0),
         updated_at = now()
   where user_id = p_user_id
   returning balance into new_balance;

  insert into public.credit_transactions (user_id, amount, reason)
  values (p_user_id, p_amount, p_reason);

  return new_balance;
end $$;

-- Monthly reset: called by a scheduled job (pg_cron or an Edge Function).
-- Resets balances to each user's current plan allowance.
create or replace function public.reset_monthly_credits()
returns int language plpgsql security definer as $$
declare
  updated int;
begin
  update public.credit_accounts ca
     set balance = coalesce(p.monthly_credits, 0),
         updated_at = now()
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
   where s.user_id = ca.user_id
     and s.status in ('active', 'trialing');

  get diagnostics updated = row_count;
  return updated;
end $$;

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_own_all" on public.notifications
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  theme text not null default 'dark',
  language text not null default 'en',
  notify_email boolean not null default true,
  ai_model_pref text,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "preferences_own_all" on public.user_preferences
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- ADMIN AUDIT LOG
-- ============================================================================

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id),
  action text not null,
  target_type text,
  target_id text,
  changes jsonb not null default '{}',
  ip text,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

create policy "audit_admin_select" on public.admin_audit_logs
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.system_settings enable row level security;

create policy "system_settings_admin_all" on public.system_settings
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================================
-- ON NEW USER: profile + workspace + membership + credits + prefs
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  workspace_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)))
  on conflict (id) do nothing;

  insert into public.workspaces (owner_id, name)
  values (new.id, 'My Research Workspace')
  returning id into workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (workspace_id, new.id, 'owner');

  insert into public.credit_accounts (user_id, balance)
  values (new.id, 100);

  insert into public.user_preferences (user_id)
  values (new.id);

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
