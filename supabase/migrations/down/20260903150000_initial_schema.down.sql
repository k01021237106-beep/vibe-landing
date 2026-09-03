-- 역방향: 20260903150000_initial_schema.sql
--
-- ⚠️ 실사용자 데이터가 있으면 실행하지 않는다. 주문·수강권이 사라진다.
-- 실행 전 반드시 확인:
--   select count(*) from public.orders where status = 'paid';

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.faqs;
drop table if exists public.reviews;
drop table if exists public.leads;
drop table if exists public.enrollments;
drop table if exists public.orders;
drop table if exists public.lessons;
drop table if exists public.courses;
drop table if exists public.profiles;

drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();
