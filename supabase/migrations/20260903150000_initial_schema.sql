-- 첫배포 초기 스키마
--
-- 8개 테이블: profiles courses lessons orders enrollments leads reviews faqs
-- RLS는 다음 마이그레이션(20260903150100_enable_rls.sql)에서 켠다.
-- 이 순서는 의도적이다 — RLS가 없을 때 anon이 실제로 읽을 수 있음을 테스트로 확인한 뒤
-- 정책을 켜서 차단되는 것을 증명한다. (supabase/tests/rls.sql)
--
-- 역방향: supabase/migrations/down/20260903150000_initial_schema.down.sql

-- 갱신 시각 자동 반영
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- profiles
-- auth.users를 확장한다. role로 관리자를 판별한다.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  phone text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is '사용자 프로필. auth.users 가입 시 트리거로 자동 생성된다.';
comment on column public.profiles.role is 'student | admin — 관리자 판별의 유일한 근거';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 가입 시 프로필 자동 생성.
-- 카카오 로그인은 raw_user_meta_data에 이름·프로필 이미지를 넣어 준다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'preferred_username'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- courses
-- 여기에 행을 추가하는 것 = 새 강의 오픈. 코드 수정이 필요 없다.
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  -- 금액은 원 단위 정수다. 부동소수를 쓰지 않는다.
  list_price integer not null check (list_price >= 0),
  sale_price integer not null check (sale_price >= 0),
  thumbnail_url text,
  is_published boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_sale_price_lte_list_price check (sale_price <= list_price)
);

comment on table public.courses is '강의. 행 추가만으로 새 강의를 연다.';
comment on column public.courses.sale_price is '실제 청구 금액(원). 결제 승인 시 서버가 이 값으로 재검증한다.';

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- lessons
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position integer not null,
  title text not null,
  summary text,
  duration_seconds integer check (duration_seconds >= 0),
  -- 민감 정보: 수강권이 있는 사람에게만 서버가 넘긴다.
  -- 다음 마이그레이션에서 anon·authenticated의 이 컬럼 조회 권한을 회수한다.
  vimeo_id text,
  is_free_preview boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

comment on column public.lessons.vimeo_id is
  '⚠️ 클라이언트에 절대 노출 금지. anon·authenticated는 컬럼 권한이 회수돼 있고 service_role만 읽는다.';

create index lessons_course_id_position_idx on public.lessons (course_id, position);

create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  -- 토스에 넘기는 주문번호
  order_code text not null unique,
  -- 승인 시점에 서버가 DB에서 다시 조회해 검증한 금액
  amount integer not null check (amount >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'canceled', 'refunded')),
  payment_key text unique,
  method text,
  fail_reason text,
  approved_at timestamptz,
  canceled_at timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.orders.amount is
  '클라이언트가 보낸 금액이 아니라 서버가 courses에서 재조회해 검증한 금액이다.';

create index orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- enrollments
-- 수강권. 이게 있어야 영상을 본다.
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  source text not null default 'purchase' check (source in ('purchase', 'free', 'manual')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 같은 강의를 두 번 등록할 수 없다
  unique (user_id, course_id)
);

comment on table public.enrollments is '수강권. status=active인 행이 있어야 영상 접근이 허용된다.';

create index enrollments_user_id_idx on public.enrollments (user_id);

create trigger enrollments_set_updated_at
  before update on public.enrollments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- leads
-- 무료 1강 신청자. 사이트 최우선 전환 목표다.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- 숫자만 남긴 정규화된 형태로 저장한다 (01012345678)
  phone text not null unique,
  email text,
  user_id uuid references public.profiles (id) on delete set null,
  course_id uuid references public.courses (id) on delete set null,
  -- 개인정보 수집 동의 없이는 저장하지 않는다
  consent_privacy boolean not null default false,
  consent_marketing boolean not null default false,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_requires_privacy_consent check (consent_privacy)
);

comment on table public.leads is '무료 1강 신청자. 개인정보이므로 anon은 삽입만 가능하고 조회할 수 없다.';
comment on column public.leads.phone is '숫자만 남긴 정규화 형태. 재신청 시 이 값으로 중복을 판정한다.';

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete cascade,
  author_name text not null,
  author_role text,
  rating smallint check (rating between 1 and 5),
  body text not null,
  -- ⚠️ 기본값이 true인 것은 의도적이다.
  -- 실제 후기임이 확인되기 전까지 모든 후기는 샘플로 취급한다.
  -- 샘플을 실제처럼 노출하면 표시광고법 위반이다.
  is_sample boolean not null default true,
  is_published boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.reviews.is_sample is
  '⚠️ 기본 true. 화면에서 반드시 «샘플 후기» 배지를 붙여야 한다. 표시광고법.';

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- faqs
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete cascade,
  question text not null,
  answer text not null,
  is_published boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger faqs_set_updated_at
  before update on public.faqs
  for each row execute function public.set_updated_at();
