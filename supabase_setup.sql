-- ============================================================
--  CARD CLASH — SUPABASE SETUP v2 (con Auth)
--  Ejecuta esto en SQL Editor de tu proyecto Supabase
--  Si ya ejecutaste el setup anterior, borra las tablas primero:
--  DROP TABLE IF EXISTS battles, decks, collections, players CASCADE;
-- ============================================================

-- Tabla de perfiles (vinculada a auth.users de Supabase)
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nickname    text unique not null,
  level       integer not null default 1,
  xp          integer not null default 0,
  created_at  timestamptz default now()
);

-- Colección de cartas
create table if not exists collections (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid references profiles(id) on delete cascade,
  card_id     integer not null,
  obtained_at timestamptz default now(),
  unique(player_id, card_id)
);

-- Mazo activo
create table if not exists decks (
  id        uuid primary key default gen_random_uuid(),
  player_id uuid references profiles(id) on delete cascade unique,
  card_ids  integer[] not null default '{}'
);

-- Historial de batallas
create table if not exists battles (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid references profiles(id) on delete cascade,
  player_card integer not null,
  enemy_card  integer not null,
  result      text not null check (result in ('win','loss')),
  xp_earned   integer not null default 0,
  played_at   timestamptz default now()
);

-- ---- RLS (Row Level Security) ----
alter table profiles    enable row level security;
alter table collections enable row level security;
alter table decks       enable row level security;
alter table battles     enable row level security;

-- Profiles: cualquiera puede leer (para check de nickname), solo tú editas el tuyo
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Resto de tablas: solo acceso a los tuyos
create policy "own_collections" on collections for all using (auth.uid() = player_id) with check (auth.uid() = player_id);
create policy "own_decks"       on decks       for all using (auth.uid() = player_id) with check (auth.uid() = player_id);
create policy "own_battles"     on battles     for all using (auth.uid() = player_id) with check (auth.uid() = player_id);

-- ---- Trigger: crea perfil automáticamente al registrarse ----
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, new.raw_user_meta_data->>'nickname');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
