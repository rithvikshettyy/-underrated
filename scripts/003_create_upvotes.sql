-- Create upvotes table (one upvote per user per place)
create table if not exists public.upvotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, place_id)
);

-- Enable RLS
alter table public.upvotes enable row level security;

-- Policies for upvotes
create policy "upvotes_select_own" on public.upvotes for select using (auth.uid() = user_id);
create policy "upvotes_insert_own" on public.upvotes for insert with check (auth.uid() = user_id);
create policy "upvotes_delete_own" on public.upvotes for delete using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists upvotes_place_id_idx on public.upvotes(place_id);
create index if not exists upvotes_user_id_idx on public.upvotes(user_id);

-- Trigger to update upvote_count on places
create or replace function public.update_place_upvote_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.places set upvote_count = upvote_count + 1 where id = new.place_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.places set upvote_count = upvote_count - 1 where id = old.place_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists on_upvote_change on public.upvotes;

create trigger on_upvote_change
  after insert or delete on public.upvotes
  for each row
  execute function public.update_place_upvote_count();
