-- ============================================
-- Mundial 2026 - Esquema inicial
-- ============================================

-- --------------------------------------------
-- 1) Tabla de grupos
-- --------------------------------------------
create table if not exists public.groups (
  id integer primary key,
  name text not null
);

-- --------------------------------------------
-- 2) Tabla de equipos
-- --------------------------------------------
create table if not exists public.teams (
  id integer primary key,
  name text not null,
  code text not null,
  flag_code text not null,
  group_id integer not null references public.groups(id) on delete cascade
);

-- Constraint para poder validar FK compuesta desde group_predictions
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'teams_id_group_id_unique'
  ) then
    alter table public.teams
    add constraint teams_id_group_id_unique unique (id, group_id);
  end if;
end $$;

-- --------------------------------------------
-- 3) Datos de grupos
-- --------------------------------------------
insert into public.groups (id, name) values
(1, 'A'),
(2, 'B'),
(3, 'C'),
(4, 'D'),
(5, 'E'),
(6, 'F'),
(7, 'G'),
(8, 'H'),
(9, 'I'),
(10, 'J'),
(11, 'K'),
(12, 'L')
on conflict (id) do update set
  name = excluded.name;

-- --------------------------------------------
-- 4) Datos de equipos
-- --------------------------------------------
insert into public.teams (id, name, code, flag_code, group_id) values
(4, 'Czechia', 'CZE', 'cz', 1),
(2, 'Korea Republic', 'KOR', 'kr', 1),
(1, 'Mexico', 'MEX', 'mx', 1),
(3, 'South Africa', 'RSA', 'za', 1),

(8, 'Bosnia-Herzegovina', 'BIH', 'ba', 2),
(5, 'Canada', 'CAN', 'ca', 2),
(6, 'Qatar', 'QAT', 'qa', 2),
(7, 'Switzerland', 'SUI', 'ch', 2),

(9, 'Brazil', 'BRA', 'br', 3),
(10, 'Haiti', 'HAI', 'ht', 3),
(12, 'Morocco', 'MAR', 'ma', 3),
(11, 'Scotland', 'SCO', 'gb-sct', 3),

(14, 'Australia', 'AUS', 'au', 4),
(15, 'Paraguay', 'PAR', 'py', 4),
(16, 'Turkey', 'TUR', 'tr', 4),
(13, 'USA', 'USA', 'us', 4),

(17, 'Côte d''Ivoire', 'CIV', 'ci', 5),
(20, 'Curaçao', 'CUW', 'cw', 5),
(18, 'Ecuador', 'ECU', 'ec', 5),
(19, 'Germany', 'GER', 'de', 5),

(22, 'Japan', 'JPN', 'jp', 6),
(21, 'Netherlands', 'NED', 'nl', 6),
(24, 'Sweden', 'SWE', 'se', 6),
(23, 'Tunisia', 'TUN', 'tn', 6),

(25, 'Belgium', 'BEL', 'be', 7),
(26, 'Egypt', 'EGY', 'eg', 7),
(27, 'IR Iran', 'IRN', 'ir', 7),
(28, 'New Zealand', 'NZL', 'nz', 7),

(32, 'Cabo Verde', 'CPV', 'cv', 8),
(29, 'Saudi Arabia', 'KSA', 'sa', 8),
(30, 'Spain', 'ESP', 'es', 8),
(31, 'Uruguay', 'URU', 'uy', 8),

(33, 'France', 'FRA', 'fr', 9),
(36, 'Iraq', 'IRQ', 'iq', 9),
(35, 'Norway', 'NOR', 'no', 9),
(34, 'Senegal', 'SEN', 'sn', 9),

(38, 'Algeria', 'ALG', 'dz', 10),
(37, 'Argentina', 'ARG', 'ar', 10),
(39, 'Austria', 'AUT', 'at', 10),
(40, 'Jordan', 'JOR', 'jo', 10),

(43, 'Colombia', 'COL', 'co', 11),
(44, 'Congo DR', 'COD', 'cd', 11),
(41, 'Portugal', 'POR', 'pt', 11),
(42, 'Uzbekistan', 'UZB', 'uz', 11),

(48, 'Croatia', 'CRO', 'hr', 12),
(47, 'England', 'ENG', 'gb-eng', 12),
(45, 'Ghana', 'GHA', 'gh', 12),
(46, 'Panama', 'PAN', 'pa', 12)
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  flag_code = excluded.flag_code,
  group_id = excluded.group_id;

-- --------------------------------------------
-- 5) Tabla de predicciones de grupos
-- --------------------------------------------
create table if not exists public.group_predictions (
  id bigint generated always as identity primary key,

  user_id uuid not null references auth.users(id) on delete cascade,
  group_id integer not null references public.groups(id) on delete cascade,

  first_team_id integer not null,
  second_team_id integer not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint group_predictions_user_group_unique
    unique (user_id, group_id),

  constraint group_predictions_two_distinct_teams
    check (first_team_id <> second_team_id),

  constraint group_predictions_first_team_in_group_fk
    foreign key (first_team_id, group_id)
    references public.teams (id, group_id),

  constraint group_predictions_second_team_in_group_fk
    foreign key (second_team_id, group_id)
    references public.teams (id, group_id)
);

-- --------------------------------------------
-- 6) Función para updated_at
-- --------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------
-- 7) Trigger para updated_at
-- --------------------------------------------
drop trigger if exists set_group_predictions_updated_at on public.group_predictions;

create trigger set_group_predictions_updated_at
before update on public.group_predictions
for each row
execute function public.set_updated_at();

-- --------------------------------------------
-- 8) Row Level Security
-- --------------------------------------------
alter table public.group_predictions enable row level security;

-- Borrado previo por si vuelves a ejecutar el script
drop policy if exists "Users can view their own group predictions" on public.group_predictions;
drop policy if exists "Users can insert their own group predictions" on public.group_predictions;
drop policy if exists "Users can update their own group predictions" on public.group_predictions;
drop policy if exists "Users can delete their own group predictions" on public.group_predictions;

create policy "Users can view their own group predictions"
on public.group_predictions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own group predictions"
on public.group_predictions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own group predictions"
on public.group_predictions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own group predictions"
on public.group_predictions
for delete
to authenticated
using ((select auth.uid()) = user_id);