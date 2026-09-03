-- RLS 활성화 + 최소 권한
--
-- 설계 원칙
--  1. 전 테이블 RLS를 켜고 기본은 차단이다. 필요한 정책만 더한다.
--  2. 권한은 테이블 단위가 아니라 **컬럼 단위**로 준다.
--
-- 왜 2번이 중요한가 — 실제로 확인한 사실:
--   lessons에 RLS를 켜고 `for select using (true)` 정책을 넣은 상태에서
--   anon이 vimeo_id를 8건 전부 읽었다. RLS는 '행'을 거르지 '컬럼'을 가리지 못한다.
--   커리큘럼(제목·길이)은 공개해야 하므로 행 자체는 열어야 하고,
--   그러면 같은 행의 vimeo_id도 따라 나온다.
--   → vimeo_id는 컬럼 권한 자체를 회수해야 막힌다. 정책만으로는 못 막는다.
--
-- 역방향: supabase/migrations/down/20260903150100_enable_rls.down.sql

-- RED 재현용으로 임시로 넣었던 것을 걷어낸다
drop policy if exists lessons_red_demo on public.lessons;
revoke select on public.lessons from anon;

-- ---------------------------------------------------------------- 관리자 판별
-- profiles를 직접 참조하면 profiles의 RLS 정책이 자기 자신을 다시 호출해 무한 재귀가 된다.
-- security definer로 RLS를 우회해서 읽되, search_path를 고정해 탈취를 막는다.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------- RLS 켜기
alter table public.profiles    enable row level security;
alter table public.courses     enable row level security;
alter table public.lessons     enable row level security;
alter table public.orders      enable row level security;
alter table public.enrollments enable row level security;
alter table public.leads       enable row level security;
alter table public.reviews     enable row level security;
alter table public.faqs        enable row level security;

-- 서버 전용 역할은 전부 다룰 수 있어야 한다 (RLS도 우회한다).
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ---------------------------------------------------------------- profiles
grant select on public.profiles to authenticated;
-- ⚠️ role은 일부러 뺐다. 본인이 자기를 관리자로 승격할 수 있으면 안 된다.
grant update (display_name, phone, avatar_url) on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (public.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- insert 정책은 두지 않는다. 가입 시 handle_new_user() 트리거가 만든다.

-- ---------------------------------------------------------------- courses
-- 공개 정보다. 가격도 공개돼야 한다 (결제 시 서버가 이 값으로 재검증한다).
grant select on public.courses to anon, authenticated;

create policy courses_select_published on public.courses
  for select to anon, authenticated
  using (is_published);

create policy courses_select_admin on public.courses
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------- lessons
-- ⚠️ vimeo_id를 뺀 컬럼만 준다. 이 회수가 유일한 방어선이다.
--    정책을 아무리 잘 써도 컬럼 권한이 있으면 새 나간다. (위 주석 참고)
grant select (
  id, course_id, position, title, summary,
  duration_seconds, is_free_preview, created_at, updated_at
) on public.lessons to anon, authenticated;

-- 커리큘럼은 공개 강의의 차시만 보인다.
create policy lessons_select_published_course on public.lessons
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = lessons.course_id and c.is_published
    )
  );

-- ---------------------------------------------------------------- orders
-- 본인 주문만 조회. 쓰기는 정책이 없으므로 전부 막힌다 — 서버(service_role)만 쓴다.
-- 금액을 클라이언트가 만들거나 고칠 수 있으면 안 된다.
grant select on public.orders to authenticated;

create policy orders_select_own on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy orders_select_admin on public.orders
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------- enrollments
-- 본인 수강권만 조회. 발급·회수는 서버만 한다.
grant select on public.enrollments to authenticated;

create policy enrollments_select_own on public.enrollments
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy enrollments_select_admin on public.enrollments
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------- leads
-- 무료 1강 신청은 로그인 없이 되어야 한다 → anon에게 insert만 준다.
-- ⚠️ select는 주지 않는다. 주면 누구나 신청자 이름·연락처를 긁어 갈 수 있다.
--    그래서 앱에서 insert할 때 반드시 returning을 끄고 넣어야 한다.
grant insert on public.leads to anon, authenticated;

create policy leads_insert_anyone on public.leads
  for insert to anon, authenticated
  with check (consent_privacy);

grant select on public.leads to authenticated;

create policy leads_select_admin on public.leads
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------- reviews
grant select on public.reviews to anon, authenticated;

create policy reviews_select_published on public.reviews
  for select to anon, authenticated
  using (is_published);

create policy reviews_select_admin on public.reviews
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------- faqs
grant select on public.faqs to anon, authenticated;

create policy faqs_select_published on public.faqs
  for select to anon, authenticated
  using (is_published);

create policy faqs_select_admin on public.faqs
  for select to authenticated
  using (public.is_admin());
