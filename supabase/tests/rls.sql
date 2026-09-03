-- RLS 정책 검증
--
-- 실행 방법
--   psql "$SUPABASE_DB_URL" -f supabase/tests/rls.sql
--   또는 Supabase 대시보드 SQL Editor에 붙여넣기
--
-- 통과하면 마지막에 결과 표가 나오고 모든 행이 PASS다.
-- 하나라도 FAIL이면 스크립트가 예외를 던지며 멈춘다.
--
-- 배경: RLS를 켜고 `for select using (true)` 정책을 넣어도 anon이 vimeo_id를 읽었다.
--       RLS는 행 단위라 컬럼을 가리지 못한다. 그래서 컬럼 권한 회수가 진짜 방어선이고,
--       아래 1번·2번 검사가 그걸 지킨다. 이 두 개가 깨지면 유료 영상이 통째로 샌다.

create temp table rls_check (
  seq serial,
  name text,
  outcome text,
  detail text
) on commit drop;

-- ============================================================ 1. vimeo_id 차단
do $$
declare
  leaked text;
begin
  begin
    set local role anon;
    select min(vimeo_id) into leaked from public.lessons;
    reset role;
    insert into rls_check (name, outcome, detail)
    values ('anon은 lessons.vimeo_id를 읽을 수 없다', 'FAIL', format('읽힘: %s', leaked));
  exception when insufficient_privilege then
    reset role;
    insert into rls_check (name, outcome, detail)
    values ('anon은 lessons.vimeo_id를 읽을 수 없다', 'PASS', '권한 부족으로 차단');
  end;
end $$;

do $$
declare
  leaked text;
begin
  begin
    set local role authenticated;
    select min(vimeo_id) into leaked from public.lessons;
    reset role;
    insert into rls_check (name, outcome, detail)
    values ('로그인 사용자도 vimeo_id를 직접 읽을 수 없다', 'FAIL', format('읽힘: %s', leaked));
  exception when insufficient_privilege then
    reset role;
    insert into rls_check (name, outcome, detail)
    values ('로그인 사용자도 vimeo_id를 직접 읽을 수 없다', 'PASS', '권한 부족으로 차단 — 서버만 읽는다');
  end;
end $$;

-- 구조적 확인: 데이터를 읽고 쓰는 권한이 없어야 한다 (정책 실수와 무관하게).
-- REFERENCES는 제외한다 — Supabase가 기본으로 주는 권한이고
-- 외래키를 걸 수 있을 뿐 값을 읽지는 못한다. anon은 테이블도 못 만든다.
insert into rls_check (name, outcome, detail)
select
  'vimeo_id 읽기·쓰기 권한이 anon·authenticated에 없다',
  case when count(*) = 0 then 'PASS' else 'FAIL' end,
  coalesce(nullif(string_agg(grantee || ':' || privilege_type, ', '), ''), '없음')
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'lessons'
  and column_name = 'vimeo_id'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('SELECT', 'INSERT', 'UPDATE');

-- ============================================================ 2. 커리큘럼은 공개
do $$
declare
  n integer;
begin
  set local role anon;
  select count(*) into n from public.lessons;
  reset role;
  insert into rls_check (name, outcome, detail)
  values (
    '공개 강의의 차시 목록은 anon에게 보인다',
    case when n > 0 then 'PASS' else 'FAIL' end,
    format('%s건 조회', n)
  );
exception when others then
  reset role;
  insert into rls_check (name, outcome, detail)
  values ('공개 강의의 차시 목록은 anon에게 보인다', 'FAIL', sqlerrm);
end $$;

-- ============================================================ 3. 미공개 강의 차단
do $$
declare
  n integer;
begin
  insert into public.courses (slug, title, list_price, sale_price, is_published)
  values ('rls-test-hidden', 'RLS 검사용 미공개 강의', 10000, 10000, false)
  on conflict (slug) do nothing;

  set local role anon;
  select count(*) into n from public.courses where slug = 'rls-test-hidden';
  reset role;

  insert into rls_check (name, outcome, detail)
  values (
    'anon은 미공개 강의를 볼 수 없다',
    case when n = 0 then 'PASS' else 'FAIL' end,
    format('%s건 조회', n)
  );

  delete from public.courses where slug = 'rls-test-hidden';
exception when others then
  reset role;
  delete from public.courses where slug = 'rls-test-hidden';
  insert into rls_check (name, outcome, detail)
  values ('anon은 미공개 강의를 볼 수 없다', 'FAIL', sqlerrm);
end $$;

-- ============================================================ 4. 개인정보 테이블
do $$
declare
  tbl text;
  n integer;
begin
  foreach tbl in array array['leads', 'orders', 'enrollments', 'profiles'] loop
    begin
      set local role anon;
      execute format('select count(*) from public.%I', tbl) into n;
      reset role;
      insert into rls_check (name, outcome, detail)
      values (
        format('anon은 %s를 조회할 수 없다', tbl), 'FAIL', format('%s건 조회됨', n)
      );
    exception when insufficient_privilege then
      reset role;
      insert into rls_check (name, outcome, detail)
      values (format('anon은 %s를 조회할 수 없다', tbl), 'PASS', '권한 부족으로 차단');
    when others then
      reset role;
      insert into rls_check (name, outcome, detail)
      values (format('anon은 %s를 조회할 수 없다', tbl), 'PASS', sqlerrm);
    end;
  end loop;
end $$;

-- ============================================================ 5. 무료 신청은 열려 있다
do $$
begin
  set local role anon;
  insert into public.leads (name, phone, consent_privacy)
  values ('RLS검사', '01000000000', true);
  reset role;
  insert into rls_check (name, outcome, detail)
  values ('anon은 무료 1강 신청(leads insert)을 할 수 있다', 'PASS', '삽입 성공');
  delete from public.leads where phone = '01000000000';
exception when others then
  reset role;
  delete from public.leads where phone = '01000000000';
  insert into rls_check (name, outcome, detail)
  values ('anon은 무료 1강 신청(leads insert)을 할 수 있다', 'FAIL', sqlerrm);
end $$;

-- ============================================================ 6. 동의 없는 신청 거부
do $$
begin
  set local role anon;
  insert into public.leads (name, phone, consent_privacy)
  values ('RLS검사무동의', '01000000001', false);
  reset role;
  delete from public.leads where phone = '01000000001';
  insert into rls_check (name, outcome, detail)
  values ('개인정보 수집에 동의하지 않으면 신청이 거부된다', 'FAIL', '삽입이 통과됨');
exception when others then
  reset role;
  insert into rls_check (name, outcome, detail)
  values ('개인정보 수집에 동의하지 않으면 신청이 거부된다', 'PASS', '거부됨');
end $$;

-- ============================================================ 7. 자기 승격 차단
insert into rls_check (name, outcome, detail)
select
  '사용자는 자기 profiles.role을 바꿀 수 없다',
  case when count(*) = 0 then 'PASS' else 'FAIL' end,
  format('부여된 권한 %s건', count(*))
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'role'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE');

-- ============================================================ 8. 전 테이블 RLS
insert into rls_check (name, outcome, detail)
select
  '8개 테이블 전부 RLS가 켜져 있다',
  case when count(*) filter (where not c.relrowsecurity) = 0 then 'PASS' else 'FAIL' end,
  format(
    '%s/%s 활성 %s',
    count(*) filter (where c.relrowsecurity),
    count(*),
    coalesce(nullif(string_agg(c.relname, ', ') filter (where not c.relrowsecurity), ''), '')
  )
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('profiles','courses','lessons','orders','enrollments','leads','reviews','faqs');

-- ============================================================ 결과
select seq, name, outcome, detail from rls_check order by seq;

do $$
declare
  failures integer;
begin
  select count(*) into failures from rls_check where outcome <> 'PASS';
  if failures > 0 then
    raise exception 'RLS 검증 실패 %건 — 위 표를 확인하세요', failures;
  end if;
  raise notice 'RLS 검증 전부 통과';
end $$;
