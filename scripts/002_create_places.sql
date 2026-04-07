-- Create places table
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null, -- 'eat', 'chill', 'hangout'
  city text not null,
  address text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  image_url text,
  upvote_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_published boolean default true
);

-- Enable RLS
alter table public.places enable row level security;

-- Policies for places
create policy "places_select_published" on public.places for select using (is_published = true);
create policy "places_select_own_unpublished" on public.places for select using (auth.uid() = user_id);
create policy "places_insert_own" on public.places for insert with check (auth.uid() = user_id);
create policy "places_update_own" on public.places for update using (auth.uid() = user_id);
create policy "places_delete_own" on public.places for delete using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists places_user_id_idx on public.places(user_id);
create index if not exists places_category_idx on public.places(category);
create index if not exists places_city_idx on public.places(city);
create index if not exists places_created_at_idx on public.places(created_at desc);
