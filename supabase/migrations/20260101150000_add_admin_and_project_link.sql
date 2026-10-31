-- Admin management columns on profiles (suspension + email mirror).
alter table public.profiles
  add column if not exists email text,
  add column if not exists suspended boolean not null default false,
  add column if not exists suspension_reason text;

create index if not exists profiles_suspended_idx on public.profiles (suspended);

-- Link documents to a research project (optional).
alter table public.documents
  add column if not exists project_id uuid references public.research_projects (id) on delete set null;

create index if not exists documents_project_idx on public.documents (project_id);

-- Keep profiles.email in sync with auth.users.email.
create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
     set email = new.email
   where id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_email_sync on auth.users;
create trigger on_auth_user_email_sync
  after insert or update of email on auth.users
  for each row execute function public.sync_profile_email();
