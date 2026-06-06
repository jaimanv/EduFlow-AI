create table if not exists study_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete cascade,
  is_active boolean default true,
  timer_ends_at timestamptz,
  timer_status text default 'stopped', -- 'running', 'paused', 'stopped'
  timer_duration integer default 25, -- in minutes
  created_at timestamptz default now()
);

create table if not exists room_members (
  room_id uuid references study_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

create table if not exists room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references study_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists room_notes (
  room_id uuid primary key references study_rooms(id) on delete cascade,
  content text default '',
  updated_at timestamptz default now()
);

-- Enable RLS
alter table study_rooms enable row level security;
alter table room_members enable row level security;
alter table room_messages enable row level security;
alter table room_notes enable row level security;

-- Study Rooms RLS
create policy "Authenticated users can view study rooms"
  on study_rooms for select to authenticated using (true);

create policy "Users can create study rooms"
  on study_rooms for insert to authenticated with check (auth.uid() = created_by);

create policy "Room creator can update room"
  on study_rooms for update to authenticated using (auth.uid() = created_by);

-- Room Members RLS
create policy "Room members can view room members"
  on room_members for select to authenticated using (true);

create policy "Users can join rooms"
  on room_members for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can leave rooms"
  on room_members for delete to authenticated using (auth.uid() = user_id);

-- Room Messages RLS
create policy "Room members can view messages"
  on room_messages for select to authenticated using (
    exists (select 1 from room_members where room_id = room_messages.room_id and user_id = auth.uid())
  );

create policy "Room members can insert messages"
  on room_messages for insert to authenticated with check (
    auth.uid() = user_id and
    exists (select 1 from room_members where room_id = room_messages.room_id and user_id = auth.uid())
  );

-- Room Notes RLS
create policy "Room members can view notes"
  on room_notes for select to authenticated using (
    exists (select 1 from room_members where room_id = room_notes.room_id and user_id = auth.uid())
  );

create policy "Room members can update notes"
  on room_notes for update to authenticated using (
    exists (select 1 from room_members where room_id = room_notes.room_id and user_id = auth.uid())
  );

-- Function to handle note creation when a room is created
create or replace function handle_new_study_room()
returns trigger as $$
begin
  insert into room_notes (room_id, content) values (new.id, '');
  insert into room_members (room_id, user_id) values (new.id, new.created_by);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_study_room_created
  after insert on study_rooms
  for each row execute procedure handle_new_study_room();

-- Add tables to realtime publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table study_rooms;
alter publication supabase_realtime add table room_members;
alter publication supabase_realtime add table room_messages;
alter publication supabase_realtime add table room_notes;
