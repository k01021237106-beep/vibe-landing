-- 함수 보안 강화 (Supabase 보안 어드바이저 지적 사항)
--
-- 역방향: supabase/migrations/down/20260903150200_harden_functions.down.sql

-- 1) search_path 고정
--    검색 경로가 열려 있으면 호출자가 같은 이름의 함수를 자기 스키마에 만들어
--    함수 안의 호출을 가로챌 수 있다. 빈 문자열로 두면 pg_catalog만 남는다.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) 트리거 전용 함수를 REST로 부를 수 없게 한다.
--    handle_new_user는 auth.users의 트리거로만 쓰인다. PostgREST가 /rpc/로 노출하면 안 된다.
--    트리거의 실행 권한은 트리거를 만들 때 확인되므로, 지금 회수해도 가입은 정상 동작한다.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- is_admin()은 authenticated가 실행할 수 있어야 한다.
-- RLS 정책이 현재 역할의 권한으로 이 함수를 부르기 때문이다.
-- REST로 노출되지만 호출자 자신이 관리자인지만 알려 주므로 새는 정보가 없다.

-- 참고: public.rls_auto_enable()은 Supabase가 관리하는 이벤트 트리거 함수다.
--      (신규 테이블에 RLS를 자동으로 켜 준다) 반환 타입이 event_trigger라
--      REST로는 호출 자체가 불가능하다. 우리가 건드리지 않는다.
