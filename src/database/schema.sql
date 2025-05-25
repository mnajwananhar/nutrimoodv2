-- =========================
-- USERS & PROFILE
-- =========================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  full_name text,
  email text,
  avatar_url text,
  joined_at timestamp with time zone,
  last_active timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table if not exists health_profiles (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  health_conditions text[], -- contoh: ['diabetes', 'hipertensi']
  allergies text[],
  dietary_preferences text[],
  health_goals text[],
  medications text[],
  activity_level text default 'moderate',
  updated_at timestamp with time zone default now()
);

-- =========================
-- NUTRITION ASSESSMENT & RECOMMENDATION
-- =========================

create table if not exists nutrition_assessments (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  calorie_level int,
  protein_level int,
  fat_level int,
  carb_level int,
  predicted_mood text,
  confidence_score float,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists food_recommendations (
  id bigserial primary key,
  assessment_id bigint references nutrition_assessments(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  food_name text,
  calories float,
  proteins float,
  fats float,
  carbohydrates float,
  mood_category text,
  similarity_score float,
  is_liked boolean default false,
  is_consumed boolean default false,
  consumed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- =========================
-- FOODS MASTER DATA
-- =========================

create table if not exists foods (
  id bigserial primary key,
  name text not null,
  description text,
  calories float,
  proteins float,
  fats float,
  carbohydrates float,
  primary_mood text,
  image_url text,
  created_at timestamp with time zone default now()
);

-- =========================
-- COMMUNITY
-- =========================

create table if not exists community_posts (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  user_avatar_url text, -- foto profil user
  type text check (type in ('recipe', 'story', 'question', 'tip', 'review')),
  title text,
  content text not null,
  images text[], -- array of image URLs
  tags text[],
  food_name text,
  rating int, -- 1-5 untuk review
  likes_count int default 0,
  comments_count int default 0,
  is_featured boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists post_likes (
  id bigserial primary key,
  post_id bigint references community_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (post_id, user_id)
);

create table if not exists comments (
  id bigserial primary key,
  post_id bigint references community_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);