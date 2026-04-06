-- ============================================
-- MUNDIAL 2026 - BASE INICIAL
-- Perfiles + grupos + equipos
-- ============================================

-- ============================================
-- 1) PROFILES
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- --------------------------------------------
-- RLS para profiles
-- --------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Users can view all profiles" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- Puedes elegir una de estas dos políticas de lectura:
-- A) Ver todos los perfiles (útil para leaderboard)
create policy "Users can view all profiles"
on public.profiles
for select
to authenticated
using (true);

-- B) Si quisieras solo perfil propio, usarías esta en lugar de la anterior
-- create policy "Users can view their own profile"
-- on public.profiles
-- for select
-- to authenticated
-- using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- ============================================
-- FUNCIÓN: crear profile + user_points al crear usuario
-- ============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do nothing;

  insert into public.user_points (
    user_id,
    group_points,
    match_points,
    extra_points,
    tournament_points,
    total_points
  )
  values (
    new.id,
    0,
    0,
    0,
    0,
    0
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- --------------------------------------------
-- Trigger de creación automática del profile
-- --------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================
-- 3) GROUPS
-- ============================================
create table if not exists public.groups (
  id integer primary key,
  name text not null unique,

  qualified_team_a_id integer,
  qualified_team_b_id integer
);

-- ============================================
-- 4) TEAMS
-- ============================================
create table if not exists public.teams (
  id integer primary key,
  name text not null,
  code text not null unique,
  flag_code text not null,
  group_id integer not null references public.groups(id) on delete cascade
);

-- --------------------------------------------
-- Constraint para validar FK compuesta
-- (sirve para predicciones de grupo después)
-- --------------------------------------------
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
-- Añadir FK de equipos clasificados en groups
-- después de crear teams
-- --------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'groups_qualified_team_a_id_fkey'
  ) then
    alter table public.groups
    add constraint groups_qualified_team_a_id_fkey
    foreign key (qualified_team_a_id)
    references public.teams(id)
    on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'groups_qualified_team_b_id_fkey'
  ) then
    alter table public.groups
    add constraint groups_qualified_team_b_id_fkey
    foreign key (qualified_team_b_id)
    references public.teams(id)
    on delete set null;
  end if;
end $$;

-- --------------------------------------------
-- Evitar mismo equipo en ambas columnas
-- --------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'groups_two_distinct_qualified_teams'
  ) then
    alter table public.groups
    add constraint groups_two_distinct_qualified_teams
    check (
      qualified_team_a_id is null
      or qualified_team_b_id is null
      or qualified_team_a_id <> qualified_team_b_id
    );
  end if;
end $$;

-- ============================================
-- 5) DATOS DE GRUPOS
-- ============================================
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

-- ============================================
-- 6) DATOS DE EQUIPOS
-- ============================================
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

-- ============================================
-- GROUP PREDICTIONS
-- ============================================

create table if not exists public.group_predictions (
  id bigint generated always as identity primary key,

  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id integer not null references public.groups(id) on delete cascade,

  team_a_id integer not null,
  team_b_id integer not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint group_predictions_user_group_unique
    unique (user_id, group_id),

  constraint group_predictions_two_distinct_teams
    check (team_a_id <> team_b_id),

  constraint group_predictions_team_a_in_group_fk
    foreign key (team_a_id, group_id)
    references public.teams (id, group_id),

  constraint group_predictions_team_b_in_group_fk
    foreign key (team_b_id, group_id)
    references public.teams (id, group_id)
);

-- ============================================
-- FUNCIÓN GENERAL updated_at
-- ============================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================
-- TRIGGER updated_at
-- ============================================
drop trigger if exists set_group_predictions_updated_at on public.group_predictions;

create trigger set_group_predictions_updated_at
before update on public.group_predictions
for each row
execute function public.set_updated_at();

-- ============================================
-- RLS
-- ============================================
alter table public.group_predictions enable row level security;

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

-- ============================================
-- MATCHES
-- ============================================

create table if not exists public.matches (
  id bigint generated always as identity primary key,

  api_match_id integer not null unique,
  match_number integer not null,
  round text not null,

  group_id integer references public.groups(id) on delete set null,

  home_team_id integer references public.teams(id) on delete set null,
  away_team_id integer references public.teams(id) on delete set null,

  stadium text,
  stadium_city text,
  stadium_country text,

  kickoff_at timestamptz not null,

  status text not null default 'scheduled',

  home_score integer,
  away_score integer,

  last_processed_key text,
  points_calculated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint matches_home_and_away_different
    check (
      home_team_id is null
      or away_team_id is null
      or home_team_id <> away_team_id
    ),

  constraint matches_scores_non_negative
    check (
      (home_score is null or home_score >= 0)
      and (away_score is null or away_score >= 0)
    ),

  constraint matches_status_allowed
    check (
      status in ('scheduled', 'live', 'completed')
    )
);

-- ============================================
-- TRIGGER updated_at
-- Reutiliza la función public.set_updated_at()
-- ============================================

drop trigger if exists set_matches_updated_at on public.matches;

create trigger set_matches_updated_at
before update on public.matches
for each row
execute function public.set_updated_at();

-- ============================================
-- ÍNDICES ÚTILES
-- ============================================

create index if not exists matches_round_idx
  on public.matches (round);

create index if not exists matches_group_id_idx
  on public.matches (group_id);

create index if not exists matches_kickoff_at_idx
  on public.matches (kickoff_at);

create index if not exists matches_status_idx
  on public.matches (status);

create index if not exists matches_home_team_id_idx
  on public.matches (home_team_id);

create index if not exists matches_away_team_id_idx
  on public.matches (away_team_id);

  -- ============================================
-- MATCH PREDICTIONS
-- ============================================

create table if not exists public.match_predictions (
  id bigint generated always as identity primary key,

  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id bigint not null references public.matches(id) on delete cascade,

  predicted_home_score integer not null,
  predicted_away_score integer not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint match_predictions_user_match_unique
    unique (user_id, match_id),

  constraint match_predictions_scores_non_negative
    check (
      predicted_home_score >= 0
      and predicted_away_score >= 0
    )
);

-- ============================================
-- TRIGGER updated_at
-- Reutiliza la función public.set_updated_at()
-- ============================================

drop trigger if exists set_match_predictions_updated_at on public.match_predictions;

create trigger set_match_predictions_updated_at
before update on public.match_predictions
for each row
execute function public.set_updated_at();

-- ============================================
-- RLS
-- ============================================

alter table public.match_predictions enable row level security;

drop policy if exists "Users can view their own match predictions" on public.match_predictions;
drop policy if exists "Users can insert their own match predictions" on public.match_predictions;
drop policy if exists "Users can update their own match predictions" on public.match_predictions;
drop policy if exists "Users can delete their own match predictions" on public.match_predictions;

create policy "Users can view their own match predictions"
on public.match_predictions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own match predictions"
on public.match_predictions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own match predictions"
on public.match_predictions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own match predictions"
on public.match_predictions
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ============================================
-- ÍNDICES ÚTILES
-- ============================================

create index if not exists match_predictions_match_id_idx
  on public.match_predictions (match_id);

create index if not exists match_predictions_user_id_idx
  on public.match_predictions (user_id);

  -- ============================================
-- PREDICTION POINTS
-- ============================================

create table if not exists public.prediction_points (
  id bigint generated always as identity primary key,

  user_id uuid not null references public.profiles(id) on delete cascade,

  prediction_type text not null,
  prediction_id bigint not null,

  match_id bigint references public.matches(id) on delete cascade,
  group_id integer references public.groups(id) on delete cascade,

  points integer not null default 0,
  breakdown jsonb,

  created_at timestamptz not null default now(),

  constraint prediction_points_points_non_negative
    check (points >= 0),

  constraint prediction_points_type_allowed
    check (
      prediction_type in ('group', 'match', 'match_extra', 'tournament')
    ),

  constraint prediction_points_unique_prediction
    unique (prediction_type, prediction_id)
);

-- ============================================
-- RLS
-- ============================================

alter table public.prediction_points enable row level security;

drop policy if exists "Users can view their own prediction points" on public.prediction_points;
drop policy if exists "Users can insert their own prediction points" on public.prediction_points;
drop policy if exists "Users can update their own prediction points" on public.prediction_points;
drop policy if exists "Users can delete their own prediction points" on public.prediction_points;

create policy "Users can view their own prediction points"
on public.prediction_points
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own prediction points"
on public.prediction_points
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own prediction points"
on public.prediction_points
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own prediction points"
on public.prediction_points
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ============================================
-- ÍNDICES ÚTILES
-- ============================================

create index if not exists prediction_points_user_id_idx
  on public.prediction_points (user_id);

create index if not exists prediction_points_match_id_idx
  on public.prediction_points (match_id);

create index if not exists prediction_points_group_id_idx
  on public.prediction_points (group_id);

create index if not exists prediction_points_prediction_type_idx
  on public.prediction_points (prediction_type);

  -- ============================================
-- MATCH EXTRA PREDICTIONS
-- Predicciones especiales/manuales por partido
-- ============================================

create table if not exists public.match_extra_predictions (
  id bigint generated always as identity primary key,

  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id bigint not null references public.matches(id) on delete cascade,

  halftime_result text,
  red_card boolean,
  penalty boolean,
  clean_sheet_home boolean,
  clean_sheet_away boolean,
  over_2_5_goals boolean,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint match_extra_predictions_user_match_unique
    unique (user_id, match_id),

  constraint match_extra_predictions_halftime_result_allowed
    check (
      halftime_result is null
      or halftime_result in ('home', 'draw', 'away')
    )
);

-- ============================================
-- TRIGGER updated_at
-- Reutiliza la función public.set_updated_at()
-- ============================================

drop trigger if exists set_match_extra_predictions_updated_at on public.match_extra_predictions;

create trigger set_match_extra_predictions_updated_at
before update on public.match_extra_predictions
for each row
execute function public.set_updated_at();

-- ============================================
-- RLS
-- ============================================

alter table public.match_extra_predictions enable row level security;

drop policy if exists "Users can view their own match extra predictions" on public.match_extra_predictions;
drop policy if exists "Users can insert their own match extra predictions" on public.match_extra_predictions;
drop policy if exists "Users can update their own match extra predictions" on public.match_extra_predictions;
drop policy if exists "Users can delete their own match extra predictions" on public.match_extra_predictions;

create policy "Users can view their own match extra predictions"
on public.match_extra_predictions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own match extra predictions"
on public.match_extra_predictions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own match extra predictions"
on public.match_extra_predictions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own match extra predictions"
on public.match_extra_predictions
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ============================================
-- ÍNDICES ÚTILES
-- ============================================

create index if not exists match_extra_predictions_match_id_idx
  on public.match_extra_predictions (match_id);

create index if not exists match_extra_predictions_user_id_idx
  on public.match_extra_predictions (user_id);

  -- ============================================
-- MATCH EXTRA RESULTS
-- Resultado real/manual de las predicciones especiales
-- ============================================

create table if not exists public.match_extra_results (
  match_id bigint primary key references public.matches(id) on delete cascade,

  halftime_result text,
  red_card boolean,
  penalty boolean,
  clean_sheet_home boolean,
  clean_sheet_away boolean,
  over_2_5_goals boolean,

  updated_at timestamptz not null default now(),

  constraint match_extra_results_halftime_result_allowed
    check (
      halftime_result is null
      or halftime_result in ('home', 'draw', 'away')
    )
);

-- ============================================
-- TRIGGER updated_at
-- Reutiliza la función public.set_updated_at()
-- ============================================

drop trigger if exists set_match_extra_results_updated_at on public.match_extra_results;

create trigger set_match_extra_results_updated_at
before update on public.match_extra_results
for each row
execute function public.set_updated_at();

-- ============================================
-- RLS
-- Normalmente esto lo tocarás tú desde panel admin / service role.
-- Dejo lectura abierta a usuarios autenticados por si quieres mostrar
-- el resultado resuelto después en la app.
-- ============================================

alter table public.match_extra_results enable row level security;

drop policy if exists "Users can view all match extra results" on public.match_extra_results;

create policy "Users can view all match extra results"
on public.match_extra_results
for select
to authenticated
using (true);

-- ============================================
-- TOURNAMENT PREDICTIONS
-- Predicciones globales del Mundial
-- ============================================

create table if not exists public.tournament_predictions (
  id bigint generated always as identity primary key,

  user_id uuid not null references public.profiles(id) on delete cascade,

  world_cup_winner_team_id integer references public.teams(id) on delete set null,
  top_scorer text,
  top_assist text,
  hat_trick_player text,
  most_goal_difference_team_id integer references public.teams(id) on delete set null,
  least_goal_difference_team_id integer references public.teams(id) on delete set null,
  biggest_match_goal_difference_team_id integer references public.teams(id) on delete set null,
  more_than_4_penalty_shootouts boolean,
  underdog_quarterfinal_team_id integer references public.teams(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tournament_predictions_user_unique
    unique (user_id)
);

-- ============================================
-- TRIGGER updated_at
-- Reutiliza la función public.set_updated_at()
-- ============================================

drop trigger if exists set_tournament_predictions_updated_at on public.tournament_predictions;

create trigger set_tournament_predictions_updated_at
before update on public.tournament_predictions
for each row
execute function public.set_updated_at();

-- ============================================
-- RLS
-- ============================================

alter table public.tournament_predictions enable row level security;

drop policy if exists "Users can view their own tournament predictions" on public.tournament_predictions;
drop policy if exists "Users can insert their own tournament predictions" on public.tournament_predictions;
drop policy if exists "Users can update their own tournament predictions" on public.tournament_predictions;
drop policy if exists "Users can delete their own tournament predictions" on public.tournament_predictions;

create policy "Users can view their own tournament predictions"
on public.tournament_predictions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own tournament predictions"
on public.tournament_predictions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own tournament predictions"
on public.tournament_predictions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tournament predictions"
on public.tournament_predictions
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ============================================
-- TOURNAMENT RESULTS
-- Resultado real/manual de las predicciones globales
-- Solo habrá una fila con id = 1
-- ============================================

create table if not exists public.tournament_results (
  id integer primary key default 1,

  world_cup_winner_team_id integer references public.teams(id) on delete set null,
  top_scorer text,
  top_assist text,
  hat_trick_player text,
  most_goal_difference_team_id integer references public.teams(id) on delete set null,
  least_goal_difference_team_id integer references public.teams(id) on delete set null,
  biggest_match_goal_difference_team_id integer references public.teams(id) on delete set null,
  more_than_4_penalty_shootouts boolean,
  underdog_quarterfinal_team_id integer references public.teams(id) on delete set null,

  updated_at timestamptz not null default now(),

  constraint tournament_results_single_row_check
    check (id = 1)
);

-- ============================================
-- TRIGGER updated_at
-- Reutiliza la función public.set_updated_at()
-- ============================================

drop trigger if exists set_tournament_results_updated_at on public.tournament_results;

create trigger set_tournament_results_updated_at
before update on public.tournament_results
for each row
execute function public.set_updated_at();

-- ============================================
-- RLS
-- Lectura abierta para usuarios autenticados.
-- Escritura pensada para admin / service role.
-- ============================================

alter table public.tournament_results enable row level security;

drop policy if exists "Users can view tournament results" on public.tournament_results;

create policy "Users can view tournament results"
on public.tournament_results
for select
to authenticated
using (true);

-- ============================================
-- USER POINTS
-- ============================================

create table if not exists public.user_points (
  user_id uuid primary key references public.profiles(id) on delete cascade,

  group_points integer not null default 0,
  match_points integer not null default 0,
  extra_points integer not null default 0,
  tournament_points integer not null default 0,
  total_points integer not null default 0,

  updated_at timestamptz not null default now(),

  constraint user_points_group_points_non_negative
    check (group_points >= 0),

  constraint user_points_match_points_non_negative
    check (match_points >= 0),

  constraint user_points_extra_points_non_negative
    check (extra_points >= 0),

  constraint user_points_tournament_points_non_negative
    check (tournament_points >= 0),

  constraint user_points_total_points_non_negative
    check (total_points >= 0)
);

-- ============================================
-- TRIGGER updated_at
-- Reutiliza la función public.set_updated_at()
-- ============================================

drop trigger if exists set_user_points_updated_at on public.user_points;

create trigger set_user_points_updated_at
before update on public.user_points
for each row
execute function public.set_updated_at();

-- ============================================
-- RLS
-- ============================================

alter table public.user_points enable row level security;

drop policy if exists "Users can view all user points" on public.user_points;
drop policy if exists "Users can insert their own user points" on public.user_points;
drop policy if exists "Users can update their own user points" on public.user_points;
drop policy if exists "Users can delete their own user points" on public.user_points;

create policy "Users can view all user points"
on public.user_points
for select
to authenticated
using (true);

create policy "Users can insert their own user points"
on public.user_points
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own user points"
on public.user_points
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own user points"
on public.user_points
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ============================================
-- ÍNDICE ÚTIL PARA LEADERBOARD
-- ============================================

create index if not exists user_points_total_points_idx
  on public.user_points (total_points desc);

-- ============================================
-- LEADERBOARD VIEW
-- ============================================

create or replace view public.leaderboard as
select
  p.id as user_id,
  p.full_name,
  p.avatar_url,

  up.group_points,
  up.match_points,
  up.extra_points,
  up.tournament_points,
  up.total_points,
  up.updated_at,

  row_number() over (
    order by up.total_points desc, up.updated_at asc, p.full_name asc
  ) as rank
from public.profiles p
join public.user_points up
  on up.user_id = p.id;

-- ============================================
-- VISTA PARA PARTIDOS Y PREDICCIÓN DEL PROPIO USUARIO 
-- ============================================

create or replace view public.matches_with_user_prediction as
select
  m.id,
  m.api_match_id,
  m.match_number,
  m.round,
  m.kickoff_at,
  m.status,
  m.home_score,
  m.away_score,
  m.stadium,
  m.stadium_city,
  m.stadium_country,
  m.last_processed_key,
  m.points_calculated_at,
  m.created_at,
  m.updated_at,

  g.id as group_id,
  g.name as group_name,

  ht.id as home_team_id,
  ht.name as home_team_name,
  ht.code as home_team_code,
  ht.flag_code as home_team_flag_code,

  at.id as away_team_id,
  at.name as away_team_name,
  at.code as away_team_code,
  at.flag_code as away_team_flag_code,

  mp.id as prediction_id,
  mp.user_id as prediction_user_id,
  mp.predicted_home_score,
  mp.predicted_away_score,
  mp.created_at as prediction_created_at,
  mp.updated_at as prediction_updated_at

from matches m
left join groups g
  on g.id = m.group_id
left join teams ht
  on ht.id = m.home_team_id
left join teams at
  on at.id = m.away_team_id
left join match_predictions mp
  on mp.match_id = m.id
 and mp.user_id = auth.uid();