
import React, { useState } from 'react';

const sqlScript = `-- WARNING: This script will delete any existing FutMatch tables and data before recreating them.
-- This is safe for a first-time setup but will clear all matches and profiles.

-- Drop existing objects in reverse order of dependency to ensure a clean slate.
DROP TABLE IF EXISTS public.tokens CASCADE; 
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.match_messages CASCADE;
DROP TABLE IF EXISTS public.arenas CASCADE;
DROP TABLE IF EXISTS public.community_likes CASCADE;
DROP TABLE IF EXISTS public.community_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.match_participants CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.update_filled_slots() CASCADE;
DROP FUNCTION IF EXISTS public.cancel_match(bigint, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.increment_counter(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_comments_count() CASCADE;
DROP FUNCTION IF EXISTS public.add_tokens(uuid, int) CASCADE;
DROP FUNCTION IF EXISTS public.spend_tokens(uuid, int) CASCADE;
DROP FUNCTION IF EXISTS public.join_match_with_token(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.leave_match_with_refund(bigint) CASCADE;


-- Create the profiles table to store user data
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  photo_url text,
  date_of_birth text,
  city text,
  state text,
  sport text[],
  "position" text[],
  bio text,
  points integer default 0 not null,
  matches_played integer default 0 not null,
  reputation text default 'Iniciante'::text not null,
  banner_url text,
  favorite_team text,
  favorite_team_logo_url text,
  updated_at timestamp with time zone
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

-- TOKENS TABLE (MatchCoins)
create table public.tokens (
  user_id uuid references public.profiles on delete cascade not null primary key,
  balance integer default 10 not null,
  updated_at timestamp with time zone default now()
);

alter table public.tokens enable row level security;
create policy "Users can view their own tokens." on tokens for select using (auth.uid() = user_id);
-- Updates restricted to RPC functions for security


-- Create a function to handle new user creation (Profile + Initial Tokens)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create Profile
  insert into public.profiles (id, name, photo_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  -- Initialize Tokens (10 MatchCoins start)
  insert into public.tokens (user_id, balance)
  values (new.id, 10);
  
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- RPC Functions for Tokens

-- Add Tokens
create function public.add_tokens(p_user_id uuid, amount int)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.tokens (user_id, balance)
  values (p_user_id, amount)
  on conflict (user_id)
  do update set balance = tokens.balance + amount, updated_at = now();
end;
$$;

-- Spend Tokens (Manual/Generic)
create function public.spend_tokens(p_user_id uuid, amount int)
returns text
language plpgsql
security definer
as $$
declare
  current_bal int;
begin
  select balance into current_bal from public.tokens where user_id = p_user_id;
  
  if current_bal is null then
    return 'INSUFFICIENT_FUNDS'; 
  end if;

  if current_bal >= amount then
    update public.tokens
    set balance = balance - amount, updated_at = now()
    where user_id = p_user_id;
    return 'OK';
  else
    return 'INSUFFICIENT_FUNDS';
  end if;
end;
$$;

-- TRANSACTIONAL JOIN MATCH (Cost: 1 Token)
-- This ensures atomicity: money is only taken if join is successful.
create function public.join_match_with_token(p_match_id bigint)
returns text
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_balance int;
  v_match record;
  v_is_participant boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return 'NOT_AUTHENTICATED';
  end if;

  -- Check Match Status
  select * into v_match from public.matches where id = p_match_id;
  if v_match is null then
    return 'MATCH_NOT_FOUND';
  end if;
  
  if v_match.status != 'Convocando' then
    return 'MATCH_CLOSED';
  end if;
  
  if v_match.filled_slots >= v_match.slots then
    return 'MATCH_FULL';
  end if;

  -- Check if already in match
  select exists(select 1 from public.match_participants where match_id = p_match_id and user_id = v_user_id) into v_is_participant;
  if v_is_participant then
    return 'ALREADY_IN';
  end if;

  -- Check Token Balance
  select balance into v_balance from public.tokens where user_id = v_user_id;
  if v_balance is null or v_balance < 1 then
    return 'NO_TOKENS';
  end if;

  -- EXECUTE TRANSACTION
  -- 1. Deduct Token
  update public.tokens set balance = balance - 1 where user_id = v_user_id;
  
  -- 2. Add Participant
  insert into public.match_participants (match_id, user_id) values (p_match_id, v_user_id);

  return 'OK';
end;
$$;

-- TRANSACTIONAL LEAVE MATCH (Refund: 1 Token)
-- This ensures atomicity: money is refunded only if the user was actually in the match and leaves.
create function public.leave_match_with_refund(p_match_id bigint)
returns text
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_deleted_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return 'NOT_AUTHENTICATED';
  end if;

  -- Delete Participant and check if deletion happened
  with deleted as (
    delete from public.match_participants 
    where match_id = p_match_id and user_id = v_user_id
    returning *
  )
  select count(*) into v_deleted_count from deleted;

  if v_deleted_count = 0 then
    return 'NOT_IN_MATCH';
  end if;

  -- Refund Token
  update public.tokens set balance = balance + 1 where user_id = v_user_id;

  return 'OK';
end;
$$;


-- Create the matches table
create table public.matches (
  id bigint generated by default as identity primary key,
  created_by uuid references auth.users not null,
  name text not null,
  sport text not null,
  location text not null,
  lat real null,
  lng real null,
  date timestamp with time zone not null,
  slots integer not null,
  filled_slots integer default 0 not null,
  rules text,
  status text default 'Convocando'::text not null,
  cancellation_reason text,
  is_boosted boolean default false,
  boost_until timestamp with time zone,
  is_private boolean default false,
  invite_code text,
  created_at timestamp with time zone default now() not null
);

alter table public.matches enable row level security;
create policy "Matches are viewable by everyone." on matches for select using (true);
create policy "Authenticated users can create matches." on matches for insert with check (auth.role() = 'authenticated');
create policy "Users can update their own matches." on matches for update using (auth.uid() = created_by);
create policy "Users can delete their own matches." on matches for delete using (auth.uid() = created_by);


-- Create the match_participants table
create table public.match_participants (
  match_id bigint references matches on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  joined_at timestamp with time zone default now() not null,
  primary key (match_id, user_id)
);

alter table public.match_participants enable row level security;
create policy "Participants are viewable by everyone." on match_participants for select using (true);
create policy "Users can join a match." on match_participants for insert with check (auth.uid() = user_id);
create policy "Users can leave their own match." on match_participants for delete using (auth.uid() = user_id);
create policy "Users can update their own participation." on match_participants for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- MATCH CHAT TABLE
create table public.match_messages (
  id uuid default gen_random_uuid() primary key,
  match_id bigint references matches on delete cascade not null,
  sender_id uuid references profiles on delete set null not null,
  message text not null,
  sent_at timestamp with time zone default now()
);

alter table public.match_messages enable row level security;

create policy "Participants can view messages" on match_messages for select using (
  exists (
    select 1 from match_participants mp 
    where mp.match_id = match_messages.match_id and mp.user_id = auth.uid()
  )
  or
  exists (
    select 1 from matches m 
    where m.id = match_messages.match_id and m.created_by = auth.uid()
  )
);

create policy "Participants can send messages" on match_messages for insert with check (
  (auth.uid() = sender_id) AND (
    exists (
        select 1 from match_participants mp 
        where mp.match_id = match_messages.match_id and mp.user_id = auth.uid()
    )
    or
    exists (
        select 1 from matches m 
        where m.id = match_messages.match_id and m.created_by = auth.uid()
    )
  )
);


-- COMMUNITY TABLES
create table public.community_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  content text not null,
  image_url text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default now()
);

alter table public.community_posts enable row level security;
create policy "Posts are viewable by everyone." on community_posts for select using (true);
create policy "Authenticated users can insert posts." on community_posts for insert with check (auth.role() = 'authenticated');
create policy "Users can update their own posts." on community_posts for update using (auth.uid() = user_id);

create table public.community_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references community_posts on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table public.community_comments enable row level security;
create policy "Comments are viewable by everyone." on community_comments for select using (true);
create policy "Authenticated users can insert comments." on community_comments for insert with check (auth.role() = 'authenticated');

create table public.community_likes (
  post_id uuid references community_posts on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  created_at timestamp with time zone default now(),
  primary key (post_id, user_id)
);

alter table public.community_likes enable row level security;
create policy "Likes are viewable by everyone." on community_likes for select using (true);
create policy "Authenticated users can like posts." on community_likes for insert with check (auth.role() = 'authenticated');
create policy "Users can remove their own likes." on community_likes for delete using (auth.uid() = user_id);


-- ARENAS TABLE
create table public.arenas (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  city text not null,
  state text not null,
  neighborhood text,
  address text,
  location_link text,
  sports text[],
  price_info text,
  phone text,
  whatsapp text,
  is_partner boolean default false,
  banner_url text,
  created_at timestamp with time zone default now()
);

alter table public.arenas enable row level security;
create policy "Arenas are viewable by everyone." on arenas for select using (true);

insert into public.arenas (name, city, state, neighborhood, address, sports, price_info, phone, whatsapp, is_partner, banner_url)
values 
('Arena FutMatch Pro', 'Sorocaba', 'SP', 'Campolim', 'Av. Gisele Constantino, 1200', ARRAY['Futebol Society', 'Futsal'], 'R$ 150/hora', '(15) 99999-0000', '5515999990000', true, 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070&auto=format&fit=crop'),
('Quadra do Zé', 'Sorocaba', 'SP', 'Centro', 'Rua da Penha, 500', ARRAY['Futebol Society'], 'R$ 100/hora', '(15) 3333-4444', null, false, 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=2071&auto=format&fit=crop'),
('Complexo Esportivo Vôlei & Cia', 'Itu', 'SP', 'Vila Nova', 'Rua Floriano Peixoto, 10', ARRAY['Vôlei de Quadra', 'Vôlei de Praia / Areia', 'Futevôlei'], 'R$ 80/hora', '(11) 98888-7777', '5511988887777', true, 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2007&auto=format&fit=crop'),
('Beach Tennis Point', 'Sorocaba', 'SP', 'Santa Rosália', 'Av. Dom Aguirre, 2000', ARRAY['Beach Tennis'], 'R$ 120/hora', '(15) 97777-6666', '5515977776666', true, 'https://images.unsplash.com/photo-1632919661367-454109336799?q=80&w=2070&auto=format&fit=crop');


-- NOTIFICATIONS TABLE
create table public.notifications (
  id bigint generated by default as identity primary key,
  user_id uuid references profiles on delete cascade not null,
  type text not null,
  title text not null,
  body text not null,
  data jsonb,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.notifications enable row level security;
create policy "Users can view own notifications." on notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications." on notifications for update using (auth.uid() = user_id);
create policy "Authenticated users can insert notifications." on notifications for insert with check (auth.role() = 'authenticated');


-- TRIGGERS
create function public.update_likes_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.community_posts
    set likes_count = likes_count + 1
    where id = new.post_id;
  elsif (TG_OP = 'DELETE') then
    update public.community_posts
    set likes_count = likes_count - 1
    where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger on_like_change
  after insert or delete on public.community_likes
  for each row execute procedure public.update_likes_count();

create function public.update_comments_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.community_posts
    set comments_count = comments_count + 1
    where id = new.post_id;
  elsif (TG_OP = 'DELETE') then
    update public.community_posts
    set comments_count = comments_count - 1
    where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger on_comment_change
  after insert or delete on public.community_comments
  for each row execute procedure public.update_comments_count();

-- Trigger for filled_slots
create function public.update_filled_slots()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.matches
    set filled_slots = filled_slots + 1
    where id = new.match_id;
  elsif (TG_OP = 'DELETE') then
    update public.matches
    set filled_slots = filled_slots - 1
    where id = old.match_id;
  end if;
  return null;
end;
$$;

create trigger on_participant_change
  after insert or delete on public.match_participants
  for each row execute procedure public.update_filled_slots();

-- RPC function to cancel a match
create function public.cancel_match(p_match_id bigint, p_user_id uuid, p_reason text)
returns text
language plpgsql
security definer set search_path = public
as $$
begin
  update public.matches
  set
    status = 'Cancelado',
    cancellation_reason = p_reason
  where
    id = p_match_id and
    created_by = p_user_id;
  
  if not found then
    raise exception 'User is not the creator of the match or match not found.';
  end if;
  
  return 'Partida cancelada com sucesso!';
end;
$$;

-- Helper function for increment checks
create function public.increment_counter(row_id uuid, col_name text)
returns void
language plpgsql
security definer
as $$
begin
end;

-- TRANSACTIONAL CREATE MATCH (Cost: 3 Tokens)
create function public.create_match_with_tokens(
  p_name text,
  p_sport text,
  p_location text,
  p_lat real,
  p_lng real,
  p_date timestamp with time zone,
  p_slots int,
  p_rules text,
  p_is_private boolean,
  p_invite_code text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_balance int;
  v_new_match_id bigint;
  v_match_data jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- Check Token Balance
  select balance into v_balance from public.tokens where user_id = v_user_id;
  if v_balance is null or v_balance < 3 then
    raise exception 'INSUFFICIENT_FUNDS';
  end if;

  -- 1. Deduct Tokens
  update public.tokens set balance = balance - 3 where user_id = v_user_id;

  -- 2. Create Match
  insert into public.matches (
    created_by, name, sport, location, lat, lng, date, slots, rules, is_private, invite_code
  ) values (
    v_user_id, p_name, p_sport, p_location, p_lat, p_lng, p_date, p_slots, p_rules, p_is_private, p_invite_code
  ) returning id into v_new_match_id;

  -- 3. Return the created match data
  select to_jsonb(m) into v_match_data from public.matches m where id = v_new_match_id;
  
  return v_match_data;
end;
$$;
`;

const DatabaseSetup: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
        <h1 className="text-3xl font-bold text-red-500 mb-4 flex items-center gap-2">
          ⚠️ Configuração do Banco de Dados Necessária
        </h1>
        <p className="text-gray-300 mb-6 text-lg leading-relaxed">
          O aplicativo detectou que as tabelas necessárias não existem no seu projeto Supabase ou estão incompletas.
          Para corrigir isso, você precisa executar o script SQL de configuração.
        </p>

        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-400 mb-2">Como resolver:</h3>
          <ol className="list-decimal list-inside text-gray-300 space-y-2">
            <li>Copie o código SQL abaixo.</li>
            <li>Vá para o seu painel do Supabase.</li>
            <li>Abra o <strong>SQL Editor</strong>.</li>
            <li>Cole o código e clique em <strong>Run</strong>.</li>
            <li>Recarregue esta página.</li>
          </ol>
        </div>

        <div className="relative mb-6">
          <div className="absolute top-2 right-2">
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {copied ? 'Copiado!' : 'Copiar SQL'}
            </button>
          </div>
          <pre className="bg-black/50 p-4 rounded-lg text-xs text-green-400 font-mono h-64 overflow-y-auto border border-gray-700">
            {sqlScript}
          </pre>
        </div>

        <div className="text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg"
          >
            Já executei o script, Recarregar Página
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;
