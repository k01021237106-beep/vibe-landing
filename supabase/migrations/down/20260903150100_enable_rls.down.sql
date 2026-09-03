-- 역방향: 20260903150100_enable_rls.sql
--
-- ⚠️ 이걸 실행하면 데이터베이스가 무방비가 된다.
--    운영 중인 프로젝트에서는 실행하지 않는다. 개발 중 되돌릴 때만 쓴다.

drop policy if exists faqs_select_admin on public.faqs;
drop policy if exists faqs_select_published on public.faqs;
drop policy if exists reviews_select_admin on public.reviews;
drop policy if exists reviews_select_published on public.reviews;
drop policy if exists leads_select_admin on public.leads;
drop policy if exists leads_insert_anyone on public.leads;
drop policy if exists enrollments_select_admin on public.enrollments;
drop policy if exists enrollments_select_own on public.enrollments;
drop policy if exists orders_select_admin on public.orders;
drop policy if exists orders_select_own on public.orders;
drop policy if exists lessons_select_published_course on public.lessons;
drop policy if exists courses_select_admin on public.courses;
drop policy if exists courses_select_published on public.courses;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;
drop policy if exists profiles_select_own on public.profiles;

revoke all on public.faqs        from anon, authenticated;
revoke all on public.reviews     from anon, authenticated;
revoke all on public.leads       from anon, authenticated;
revoke all on public.enrollments from anon, authenticated;
revoke all on public.orders      from anon, authenticated;
revoke all on public.lessons     from anon, authenticated;
revoke all on public.courses     from anon, authenticated;
revoke all on public.profiles    from anon, authenticated;

alter table public.faqs        disable row level security;
alter table public.reviews     disable row level security;
alter table public.leads       disable row level security;
alter table public.enrollments disable row level security;
alter table public.orders      disable row level security;
alter table public.lessons     disable row level security;
alter table public.courses     disable row level security;
alter table public.profiles    disable row level security;

drop function if exists public.is_admin();
