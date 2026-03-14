-- ============================================================
-- Surprise Mine — Supabase Schema v2
-- Run this entire file in your Supabase SQL Editor
-- If upgrading from v1, run the MIGRATION section at the bottom
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id                      uuid references auth.users on delete cascade primary key,
  name                    text not null,
  email                   text not null,
  avatar_url              text,
  relationship_stage      text not null default 'dating',
  partner_name            text,
  invite_code             text unique,
  couple_id               uuid,
  relationship_start_date date,
  created_at              timestamptz default now()
);

-- ── Couples ─────────────────────────────────────────────────
create table if not exists public.couples (
  id          uuid default gen_random_uuid() primary key,
  user1_id    uuid references public.profiles(id) on delete cascade not null,
  user2_id    uuid references public.profiles(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique(user1_id, user2_id)
);

-- Back-reference from profiles to couples
alter table public.profiles
  add constraint profiles_couple_id_fkey
  foreign key (couple_id) references public.couples(id) on delete set null;

-- ── Invite Codes ─────────────────────────────────────────────
create table if not exists public.invite_codes (
  id          uuid default gen_random_uuid() primary key,
  code        text unique not null,
  creator_id  uuid references public.profiles(id) on delete cascade not null,
  used        boolean default false,
  used_by     uuid references public.profiles(id),
  created_at  timestamptz default now()
);

-- ── Questions Bank ───────────────────────────────────────────
create table if not exists public.questions (
  id              uuid default gen_random_uuid() primary key,
  text            text not null,
  category        text not null,
  category_emoji  text not null default '💬',
  intensity       text not null check (intensity in ('light','balanced','deep')),
  created_at      timestamptz default now()
);

-- ── Daily Questions (per-couple or per-user assignment) ──────
create table if not exists public.daily_questions (
  id              uuid default gen_random_uuid() primary key,
  couple_id       uuid references public.couples(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  question_id     uuid references public.questions(id) not null,
  assigned_date   date not null default current_date
  -- partial unique indexes created below for couple and solo modes
);

-- ── Question Answers ─────────────────────────────────────────
create table if not exists public.question_answers (
  id                  uuid default gen_random_uuid() primary key,
  daily_question_id   uuid references public.daily_questions(id) on delete cascade not null,
  user_id             uuid references public.profiles(id) on delete cascade not null,
  answer              text not null,
  created_at          timestamptz default now(),
  unique(daily_question_id, user_id)
);

-- ── Gifts ────────────────────────────────────────────────────
create table if not exists public.gifts (
  id              uuid default gen_random_uuid() primary key,
  from_user_id    uuid references public.profiles(id) on delete cascade not null,
  to_user_id      uuid references public.profiles(id) on delete cascade,
  couple_id       uuid references public.couples(id) on delete cascade,
  gift_type       text not null,
  message         text not null,
  photo_url       text,
  opened          boolean default false,
  pending         boolean default false,
  share_token     text unique,
  scheduled_for   timestamptz,
  created_at      timestamptz default now()
);

-- ── Milestones ───────────────────────────────────────────────
create table if not exists public.milestones (
  id              uuid default gen_random_uuid() primary key,
  couple_id       uuid references public.couples(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  title           text not null,
  milestone_date  date not null,
  note            text,
  photo_url       text,
  milestone_type  text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz default now()
);

-- ── Hearts Transactions ──────────────────────────────────────
create table if not exists public.hearts_transactions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  amount      integer not null,
  reason      text not null,
  created_at  timestamptz default now()
);

-- ── Streaks ──────────────────────────────────────────────────
create table if not exists public.streaks (
  user_id             uuid references public.profiles(id) on delete cascade primary key,
  current_streak      integer default 0,
  longest_streak      integer default 0,
  last_activity_date  date,
  updated_at          timestamptz default now()
);

-- ── Question Ratings (user feedback on questions) ────────────
create table if not exists public.question_ratings (
  id                uuid default gen_random_uuid() primary key,
  daily_question_id uuid references public.daily_questions(id) on delete cascade not null,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  rating            integer not null check (rating >= 1 and rating <= 5),
  created_at        timestamptz default now(),
  unique(daily_question_id, user_id)
);

-- ── Partial unique indexes for daily_questions ────────────────
-- Only one question per couple per day (when couple_id is set)
create unique index if not exists daily_questions_couple_date
  on public.daily_questions(couple_id, assigned_date)
  where couple_id is not null;

-- Only one question per solo user per day (when user_id is set and no couple)
create unique index if not exists daily_questions_user_date
  on public.daily_questions(user_id, assigned_date)
  where user_id is not null and couple_id is null;

-- ── User Preferences ─────────────────────────────────────────
create table if not exists public.user_preferences (
  user_id               uuid references public.profiles(id) on delete cascade primary key,
  question_intensity    text default 'balanced' check (question_intensity in ('light','balanced','deep')),
  question_categories   text[] default '{}',
  notification_time     text default '09:00',
  created_at            timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles           enable row level security;
alter table public.couples            enable row level security;
alter table public.invite_codes       enable row level security;
alter table public.questions          enable row level security;
alter table public.daily_questions    enable row level security;
alter table public.question_answers   enable row level security;
alter table public.question_ratings   enable row level security;
alter table public.gifts              enable row level security;
alter table public.milestones         enable row level security;
alter table public.hearts_transactions enable row level security;
alter table public.streaks            enable row level security;
alter table public.user_preferences   enable row level security;

-- Profiles: users can read all profiles (needed for partner lookup), only edit own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Couples: members of the couple can read/write
create policy "couples_select" on public.couples for select using (
  auth.uid() = user1_id or auth.uid() = user2_id
);
create policy "couples_insert" on public.couples for insert with check (
  auth.uid() = user1_id or auth.uid() = user2_id
);

-- Invite codes: anyone can read (needed to validate), only creator can insert
create policy "invite_codes_select" on public.invite_codes for select using (true);
create policy "invite_codes_insert" on public.invite_codes for insert with check (auth.uid() = creator_id);
create policy "invite_codes_update" on public.invite_codes for update using (true);

-- Questions: publicly readable
create policy "questions_select" on public.questions for select using (true);

-- Daily questions: couple members OR solo user can read/insert
create policy "daily_questions_select" on public.daily_questions for select using (
  auth.uid() = user_id
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "daily_questions_insert" on public.daily_questions for insert with check (
  auth.uid() = user_id
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "daily_questions_update" on public.daily_questions for update using (
  auth.uid() = user_id
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);

-- Question answers: solo user OR couple members can read; only self can insert
create policy "answers_select" on public.question_answers for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.daily_questions dq
    join public.couples c on c.id = dq.couple_id
    where dq.id = daily_question_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);
create policy "answers_insert" on public.question_answers for insert with check (auth.uid() = user_id);

-- Question ratings: only own records
create policy "ratings_select" on public.question_ratings for select using (auth.uid() = user_id);
create policy "ratings_insert" on public.question_ratings for insert with check (auth.uid() = user_id);
create policy "ratings_update" on public.question_ratings for update using (auth.uid() = user_id);

-- Gifts: sender/recipient can read; sender can insert/update; public share_token lookup
create policy "gifts_select" on public.gifts for select using (
  auth.uid() = from_user_id
  or auth.uid() = to_user_id
  or share_token is not null  -- public access for shareable gift links
);
create policy "gifts_insert" on public.gifts for insert with check (auth.uid() = from_user_id);
create policy "gifts_update" on public.gifts for update using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

-- Milestones: couple members OR solo user can read/insert/update/delete
create policy "milestones_select" on public.milestones for select using (
  auth.uid() = user_id
  or auth.uid() = created_by
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "milestones_insert" on public.milestones for insert with check (
  auth.uid() = created_by
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "milestones_update" on public.milestones for update using (
  auth.uid() = created_by
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "milestones_delete" on public.milestones for delete using (
  auth.uid() = created_by
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);

-- Hearts: only own records
create policy "hearts_select" on public.hearts_transactions for select using (auth.uid() = user_id);
create policy "hearts_insert" on public.hearts_transactions for insert with check (auth.uid() = user_id);

-- Streaks: only own
create policy "streaks_select" on public.streaks for select using (auth.uid() = user_id);
create policy "streaks_insert" on public.streaks for insert with check (auth.uid() = user_id);
create policy "streaks_update" on public.streaks for update using (auth.uid() = user_id);

-- Preferences: only own
create policy "prefs_select" on public.user_preferences for select using (auth.uid() = user_id);
create policy "prefs_insert" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "prefs_update" on public.user_preferences for update using (auth.uid() = user_id);

-- ============================================================
-- Seed Questions
-- ============================================================

insert into public.questions (text, category, category_emoji, intensity) values
-- Communication
('What''s your favorite way for me to show you I''m listening?', 'Communication', '💬', 'light'),
('Is there something you wish I understood better about how you communicate?', 'Communication', '💬', 'balanced'),
('What topic do you think we should talk about more often?', 'Communication', '💬', 'balanced'),
('Is there something you''ve been wanting to tell me but haven''t found the right moment?', 'Communication', '💬', 'deep'),

-- Love & Romance
('What''s one thing I do that always makes you smile?', 'Love & Romance', '❤️', 'light'),
('What''s your favorite memory of our relationship so far?', 'Love & Romance', '❤️', 'light'),
('How do you feel most loved — words, actions, time together, or something else?', 'Love & Romance', '❤️', 'balanced'),
('What does love mean to you, and do you feel it fully in our relationship?', 'Love & Romance', '❤️', 'deep'),

-- Intimacy & Desires
('What''s your idea of a perfect cozy night together?', 'Intimacy & Desires', '🔥', 'light'),
('When do you feel closest to me — physically or emotionally?', 'Intimacy & Desires', '🔥', 'balanced'),
('Is there something new you''d like us to explore or try together?', 'Intimacy & Desires', '🔥', 'balanced'),
('What''s one desire or fantasy you''ve never shared with me?', 'Intimacy & Desires', '🔥', 'deep'),

-- Money & Finances
('What''s one thing you''d splurge on if money was no object?', 'Money & Finances', '💰', 'light'),
('How did your family talk about money growing up, and how has that shaped you?', 'Money & Finances', '💰', 'balanced'),
('Do you feel we''re aligned on our financial goals right now?', 'Money & Finances', '💰', 'balanced'),
('What''s your biggest financial fear, and how can I support you with it?', 'Money & Finances', '💰', 'deep'),

-- Future Planning
('Where''s one place in the world you''d love for us to visit together?', 'Future Planning', '🏠', 'light'),
('In 5 years, where do you see us and what does our life look like?', 'Future Planning', '🏠', 'balanced'),
('What''s one big life goal you haven''t told me about?', 'Future Planning', '🏠', 'balanced'),
('What does your ideal future look like — and am I in it the way you''d hope?', 'Future Planning', '🏠', 'deep'),

-- Just for Fun
('If we had a theme song as a couple, what would it be?', 'Just for Fun', '😄', 'light'),
('What animal do you think best represents you, and why?', 'Just for Fun', '😄', 'light'),
('If we could swap lives with any couple from a movie for a week, who would it be?', 'Just for Fun', '😄', 'balanced'),
('What''s the weirdest thing you find attractive about me?', 'Just for Fun', '😄', 'balanced'),

-- Conflict Resolution
('What''s the silliest thing we''ve ever argued about?', 'Conflict Resolution', '🤝', 'light'),
('When we disagree, do you feel heard? What could I do better?', 'Conflict Resolution', '🤝', 'balanced'),
('What''s your go-to way to calm down when we''re in an argument?', 'Conflict Resolution', '🤝', 'balanced'),
('Is there a recurring conflict between us that we keep avoiding?', 'Conflict Resolution', '🤝', 'deep'),

-- Personal Growth
('What''s one hobby or skill you wish you had more time to develop?', 'Personal Growth', '🧠', 'light'),
('How have you grown as a person since we''ve been together?', 'Personal Growth', '🧠', 'balanced'),
('What''s one thing you''re working on about yourself that you''d love my support with?', 'Personal Growth', '🧠', 'balanced'),
('Is there a dream you''ve given up on that you wish you hadn''t?', 'Personal Growth', '🧠', 'deep');

-- ============================================================
-- v2 MIGRATION — Run these if upgrading from v1
-- ============================================================

-- Add relationship_start_date to profiles
alter table public.profiles add column if not exists relationship_start_date date;

-- Make daily_questions.couple_id nullable, add user_id
alter table public.daily_questions alter column couple_id drop not null;
alter table public.daily_questions add column if not exists user_id uuid references public.profiles(id) on delete cascade;

-- Drop old unique constraint on daily_questions (if it exists)
alter table public.daily_questions drop constraint if exists daily_questions_couple_id_assigned_date_key;

-- Add partial unique indexes for daily_questions
create unique index if not exists daily_questions_couple_date
  on public.daily_questions(couple_id, assigned_date)
  where couple_id is not null;
create unique index if not exists daily_questions_user_date
  on public.daily_questions(user_id, assigned_date)
  where user_id is not null and couple_id is null;

-- Make gifts.to_user_id and couple_id nullable, add pending + share_token
alter table public.gifts alter column to_user_id drop not null;
alter table public.gifts alter column couple_id drop not null;
alter table public.gifts add column if not exists pending boolean default false;
alter table public.gifts add column if not exists share_token text unique;

-- Make milestones.couple_id nullable, add user_id
alter table public.milestones alter column couple_id drop not null;
alter table public.milestones add column if not exists user_id uuid references public.profiles(id) on delete cascade;

-- Create question_ratings table
create table if not exists public.question_ratings (
  id                uuid default gen_random_uuid() primary key,
  daily_question_id uuid references public.daily_questions(id) on delete cascade not null,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  rating            integer not null check (rating >= 1 and rating <= 5),
  created_at        timestamptz default now(),
  unique(daily_question_id, user_id)
);
alter table public.question_ratings enable row level security;
create policy if not exists "ratings_select" on public.question_ratings for select using (auth.uid() = user_id);
create policy if not exists "ratings_insert" on public.question_ratings for insert with check (auth.uid() = user_id);
create policy if not exists "ratings_update" on public.question_ratings for update using (auth.uid() = user_id);

-- Update daily_questions RLS policies
drop policy if exists "daily_questions_select" on public.daily_questions;
drop policy if exists "daily_questions_insert" on public.daily_questions;
create policy "daily_questions_select" on public.daily_questions for select using (
  auth.uid() = user_id
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "daily_questions_insert" on public.daily_questions for insert with check (
  auth.uid() = user_id
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "daily_questions_update" on public.daily_questions for update using (
  auth.uid() = user_id
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);

-- Update answers RLS to allow solo users
drop policy if exists "answers_select" on public.question_answers;
create policy "answers_select" on public.question_answers for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.daily_questions dq
    join public.couples c on c.id = dq.couple_id
    where dq.id = daily_question_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);

-- Update gifts RLS to allow share_token public access
drop policy if exists "gifts_select" on public.gifts;
drop policy if exists "gifts_update" on public.gifts;
create policy "gifts_select" on public.gifts for select using (
  auth.uid() = from_user_id
  or auth.uid() = to_user_id
  or share_token is not null
);
create policy "gifts_update" on public.gifts for update using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

-- Update milestones RLS to allow solo users
drop policy if exists "milestones_select" on public.milestones;
drop policy if exists "milestones_insert" on public.milestones;
drop policy if exists "milestones_update" on public.milestones;
drop policy if exists "milestones_delete" on public.milestones;
create policy "milestones_select" on public.milestones for select using (
  auth.uid() = user_id
  or auth.uid() = created_by
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "milestones_insert" on public.milestones for insert with check (
  auth.uid() = created_by
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "milestones_update" on public.milestones for update using (
  auth.uid() = created_by
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "milestones_delete" on public.milestones for delete using (
  auth.uid() = created_by
  or exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
