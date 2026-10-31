-- Stores the latest generated summary JSON on the document row.
alter table public.documents
  add column if not exists summary jsonb;
