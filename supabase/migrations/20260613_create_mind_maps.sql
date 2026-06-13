-- Create mind_maps table
create table if not exists mind_maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  topic text not null,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table mind_maps enable row level security;

-- RLS Policies
create policy "Users can view their own mind maps"
  on mind_maps for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert their own mind maps"
  on mind_maps for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update their own mind maps"
  on mind_maps for update to authenticated using (auth.uid() = user_id);

create policy "Users can delete their own mind maps"
  on mind_maps for delete to authenticated using (auth.uid() = user_id);
