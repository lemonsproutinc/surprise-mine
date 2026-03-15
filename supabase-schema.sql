-- ============================================================
-- Surprise Mine — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
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

-- ── Daily Questions (per-couple assignment) ──────────────────
create table if not exists public.daily_questions (
  id              uuid default gen_random_uuid() primary key,
  couple_id       uuid references public.couples(id) on delete cascade not null,
  question_id     uuid references public.questions(id) not null,
  assigned_date   date not null default current_date,
  unique(couple_id, assigned_date)
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
  to_user_id      uuid references public.profiles(id) on delete cascade not null,
  couple_id       uuid references public.couples(id) on delete cascade not null,
  gift_type       text not null,
  message         text not null,
  photo_url       text,
  opened          boolean default false,
  scheduled_for   timestamptz,
  created_at      timestamptz default now()
);

-- ── Milestones ───────────────────────────────────────────────
create table if not exists public.milestones (
  id              uuid default gen_random_uuid() primary key,
  couple_id       uuid references public.couples(id) on delete cascade not null,
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

-- ── Feedback ─────────────────────────────────────────────────
create table if not exists public.feedback (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  rating      integer not null check (rating >= 1 and rating <= 5),
  message     text not null,
  created_at  timestamptz default now()
);

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

-- Daily questions: couple members can read/insert
create policy "daily_questions_select" on public.daily_questions for select using (
  exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "daily_questions_insert" on public.daily_questions for insert with check (
  exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);

-- Question answers: couple members can read; only self can insert
create policy "answers_select" on public.question_answers for select using (
  exists (
    select 1 from public.daily_questions dq
    join public.couples c on c.id = dq.couple_id
    where dq.id = daily_question_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);
create policy "answers_insert" on public.question_answers for insert with check (auth.uid() = user_id);

-- Gifts: couple members can read; sender can insert
create policy "gifts_select" on public.gifts for select using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);
create policy "gifts_insert" on public.gifts for insert with check (auth.uid() = from_user_id);
create policy "gifts_update" on public.gifts for update using (auth.uid() = to_user_id);

-- Milestones: couple members can read/insert/update
create policy "milestones_select" on public.milestones for select using (
  exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "milestones_insert" on public.milestones for insert with check (
  exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "milestones_update" on public.milestones for update using (
  exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "milestones_delete" on public.milestones for delete using (
  exists (select 1 from public.couples c where c.id = couple_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
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

-- Feedback: users can insert own and select own
alter table public.feedback enable row level security;
create policy "feedback_select" on public.feedback for select using (auth.uid() = user_id);
create policy "feedback_insert" on public.feedback for insert with check (auth.uid() = user_id);

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

-- ── Additional Questions (100 more) ──────────────────────────
insert into public.questions (text, category, category_emoji, intensity) values
-- Communication (13 more)
('What''s something I do that makes you feel truly understood?', 'Communication', '💬', 'light'),
('Do you feel comfortable telling me when I''ve hurt your feelings? Why or why not?', 'Communication', '💬', 'balanced'),
('What''s the best compliment I''ve ever given you?', 'Communication', '💬', 'light'),
('Is there a way I shut down conversations without realizing it?', 'Communication', '💬', 'deep'),
('What''s something I do non-verbally that communicates love to you?', 'Communication', '💬', 'light'),
('How do you prefer to be approached when I need to bring up something difficult?', 'Communication', '💬', 'balanced'),
('Are there words or phrases I use that unknowingly sting you?', 'Communication', '💬', 'deep'),
('What''s something you wish I''d ask you more often?', 'Communication', '💬', 'balanced'),
('Do you feel like you can be fully honest with me without fear of judgment?', 'Communication', '💬', 'deep'),
('What does "feeling heard" actually look like to you in practice?', 'Communication', '💬', 'balanced'),
('Is there something you''ve been hinting at that you wish I''d just ask about directly?', 'Communication', '💬', 'deep'),
('What''s your love language, and do you feel I speak it fluently?', 'Communication', '💬', 'balanced'),
('If you could change one thing about how we communicate, what would it be?', 'Communication', '💬', 'deep'),

-- Love & Romance (13 more)
('What''s a small, everyday thing I do that you secretly adore?', 'Love & Romance', '❤️', 'light'),
('When did you first realize you were falling for me?', 'Love & Romance', '❤️', 'balanced'),
('What''s a romantic experience you''ve always dreamed of having with me?', 'Love & Romance', '❤️', 'balanced'),
('Is there a song that reminds you of us? What memory does it bring up?', 'Love & Romance', '❤️', 'light'),
('What''s the most romantic thing I''ve ever done for you?', 'Love & Romance', '❤️', 'light'),
('How do you know when you''re most in love with me — what does that feeling feel like?', 'Love & Romance', '❤️', 'deep'),
('Do you think we have a strong friendship underneath our romance?', 'Love & Romance', '❤️', 'balanced'),
('What''s something you''d love for us to create or build together?', 'Love & Romance', '❤️', 'balanced'),
('What does being with me add to your life that nothing else could?', 'Love & Romance', '❤️', 'deep'),
('Is there a part of our relationship that still gives you butterflies?', 'Love & Romance', '❤️', 'light'),
('What moment in our relationship made you think "yes, this is the one"?', 'Love & Romance', '❤️', 'deep'),
('If you could relive any moment with me, what would it be?', 'Love & Romance', '❤️', 'light'),
('What do you believe is the foundation that holds us together?', 'Love & Romance', '❤️', 'deep'),

-- Intimacy & Desires (12 more)
('What makes you feel most vulnerable with me, and is that a good thing?', 'Intimacy & Desires', '🔥', 'deep'),
('What''s something you''ve always wanted us to experience together but never said?', 'Intimacy & Desires', '🔥', 'balanced'),
('Do you feel emotionally safe enough with me to be completely yourself?', 'Intimacy & Desires', '🔥', 'deep'),
('What does physical affection mean to you beyond just touch?', 'Intimacy & Desires', '🔥', 'balanced'),
('Is there something that used to excite you about us that you miss now?', 'Intimacy & Desires', '🔥', 'deep'),
('What''s your idea of perfect intimacy — physical, emotional, or both?', 'Intimacy & Desires', '🔥', 'balanced'),
('What''s a way I could make you feel more desired?', 'Intimacy & Desires', '🔥', 'balanced'),
('Do you feel we prioritize our connection enough amid the busyness of life?', 'Intimacy & Desires', '🔥', 'balanced'),
('What''s one thing you wish we did more of when we''re just the two of us?', 'Intimacy & Desires', '🔥', 'light'),
('How do you feel about the balance of giving and receiving in our relationship?', 'Intimacy & Desires', '🔥', 'deep'),
('What''s one way you wish I initiated connection more?', 'Intimacy & Desires', '🔥', 'balanced'),
('What environment makes you feel most romantically connected to me?', 'Intimacy & Desires', '🔥', 'light'),

-- Money & Finances (12 more)
('What''s the most meaningful thing you''d spend money on for us as a couple?', 'Money & Finances', '💰', 'balanced'),
('Do you feel financially secure in our relationship? Why or why not?', 'Money & Finances', '💰', 'deep'),
('Is there a financial habit of mine that worries or frustrates you?', 'Money & Finances', '💰', 'deep'),
('How do you feel about combining finances in a relationship — fully, partially, or not at all?', 'Money & Finances', '💰', 'balanced'),
('What was money like in your home growing up, and how does that affect you today?', 'Money & Finances', '💰', 'deep'),
('What''s a financial milestone you want us to hit together in the next year?', 'Money & Finances', '💰', 'balanced'),
('Do you feel we talk about money enough, or does it feel like a taboo topic?', 'Money & Finances', '💰', 'balanced'),
('What''s a purchase we''ve made together that you''re most proud of?', 'Money & Finances', '💰', 'light'),
('How do you define financial success, and do we share that definition?', 'Money & Finances', '💰', 'deep'),
('Is there something you want to save for that you haven''t told me about?', 'Money & Finances', '💰', 'balanced'),
('What''s the best financial decision we''ve made as a couple?', 'Money & Finances', '💰', 'light'),
('How do you feel when one of us earns or spends significantly more than the other?', 'Money & Finances', '💰', 'deep'),

-- Future Planning (12 more)
('What''s one tradition you''d love for us to create and keep every year?', 'Future Planning', '🏠', 'light'),
('If we could live anywhere in the world together, where would it be and why?', 'Future Planning', '🏠', 'balanced'),
('How do you envision our lives when we''re old and grey?', 'Future Planning', '🏠', 'balanced'),
('Is there something on your bucket list that you really want me to be a part of?', 'Future Planning', '🏠', 'light'),
('What kind of home environment do you dream of us creating together?', 'Future Planning', '🏠', 'balanced'),
('How do you feel about our life path — are we moving in the right direction together?', 'Future Planning', '🏠', 'deep'),
('What role do you see family playing in our future?', 'Future Planning', '🏠', 'deep'),
('What''s something you''d regret not having done with me if life were cut short?', 'Future Planning', '🏠', 'deep'),
('What does a perfect ordinary Tuesday look like for us in 10 years?', 'Future Planning', '🏠', 'balanced'),
('How do you feel about where we are in life relative to where you hoped we''d be?', 'Future Planning', '🏠', 'deep'),
('Is there a version of our future that scares you a little? Can you share it?', 'Future Planning', '🏠', 'deep'),
('What''s one adventure you want us to go on before we''re too old to enjoy it?', 'Future Planning', '🏠', 'light'),

-- Just for Fun (12 more)
('If our relationship was a movie, what genre would it be and who would play us?', 'Just for Fun', '😄', 'light'),
('What''s the most ridiculous inside joke we have, and do you remember how it started?', 'Just for Fun', '😄', 'light'),
('If we won the lottery tomorrow, what''s the first thing you''d want to do together?', 'Just for Fun', '😄', 'light'),
('What''s a weird habit of mine that you''ve secretly grown to love?', 'Just for Fun', '😄', 'light'),
('If you could plan our perfect 24 hours with unlimited budget, what would we do?', 'Just for Fun', '😄', 'balanced'),
('What fictional couple do you think we''re most like, and is that a compliment?', 'Just for Fun', '😄', 'light'),
('What''s a skill you wish we could learn together?', 'Just for Fun', '😄', 'light'),
('If you had to describe our relationship using only food, what would it be?', 'Just for Fun', '😄', 'light'),
('What''s the funniest misunderstanding we''ve ever had?', 'Just for Fun', '😄', 'light'),
('If we were stranded on a desert island, what''s the one thing you''d want me to have packed?', 'Just for Fun', '😄', 'balanced'),
('What superpower would you give me if you could, and why?', 'Just for Fun', '😄', 'light'),
('What''s the most spontaneous thing you''d want us to do together this year?', 'Just for Fun', '😄', 'balanced'),

-- Conflict Resolution (13 more)
('After a disagreement, how long does it typically take you to feel okay again?', 'Conflict Resolution', '🤝', 'balanced'),
('Is there something I do during arguments that makes things worse without knowing?', 'Conflict Resolution', '🤝', 'deep'),
('Do you feel like we resolve conflicts, or do we just let them fade?', 'Conflict Resolution', '🤝', 'deep'),
('What''s a topic we keep dancing around that we probably need to address?', 'Conflict Resolution', '🤝', 'deep'),
('How do you prefer to be treated immediately after a fight — space or closeness?', 'Conflict Resolution', '🤝', 'balanced'),
('Do you feel like our fights ever get personal in ways they shouldn''t?', 'Conflict Resolution', '🤝', 'deep'),
('What''s something you''ve forgiven me for that took real effort?', 'Conflict Resolution', '🤝', 'deep'),
('How do you know when you''re truly over an argument vs. just suppressing it?', 'Conflict Resolution', '🤝', 'deep'),
('What would make you feel safer bringing up difficult topics with me?', 'Conflict Resolution', '🤝', 'balanced'),
('Do you feel like we fight fair? What could we do better?', 'Conflict Resolution', '🤝', 'balanced'),
('Is there a past argument you feel was never fully resolved?', 'Conflict Resolution', '🤝', 'deep'),
('How do you feel about how we handle disagreements in front of others?', 'Conflict Resolution', '🤝', 'balanced'),
('What''s one rule you''d love for us to agree on for future disagreements?', 'Conflict Resolution', '🤝', 'balanced'),

-- Personal Growth (13 more)
('What''s a fear you''ve overcome since being with me?', 'Personal Growth', '🧠', 'balanced'),
('Is there a way I''ve helped you grow that you''ve never fully expressed?', 'Personal Growth', '🧠', 'balanced'),
('What''s something about yourself you''re still working to accept?', 'Personal Growth', '🧠', 'deep'),
('Do you think I bring out the best version of you? Where could I do better?', 'Personal Growth', '🧠', 'deep'),
('What''s a belief you held before us that I''ve changed?', 'Personal Growth', '🧠', 'deep'),
('What''s something you''ve always wanted to learn or try but haven''t committed to?', 'Personal Growth', '🧠', 'balanced'),
('How has being in this relationship changed what you value most in life?', 'Personal Growth', '🧠', 'deep'),
('What''s a version of yourself in the future you''re working toward?', 'Personal Growth', '🧠', 'balanced'),
('Is there something you''ve sacrificed for this relationship that you wonder about?', 'Personal Growth', '🧠', 'deep'),
('What''s the biggest risk you want to take in life that scares you to say out loud?', 'Personal Growth', '🧠', 'deep'),
('How do you recharge when life gets overwhelming, and do I support that enough?', 'Personal Growth', '🧠', 'balanced'),
('What does being truly happy look like to you — not just content, but genuinely happy?', 'Personal Growth', '🧠', 'deep'),
('What''s a compliment someone gave you that you still think about?', 'Personal Growth', '🧠', 'light');
