-- 무료 1강 퍼널 검증
--
-- 실행 방법
--   psql "$SUPABASE_DB_URL" -f supabase/tests/free_funnel.sql
--   또는 Supabase 대시보드 SQL Editor에 붙여넣기
--
-- 확인하는 것
--   1. 신청하면 leads에 행이 생긴다
--   2. 같은 번호로 다시 신청하면 유일 제약(23505)에 걸린다
--      → 서버는 이 오류를 '이미 신청함'으로 보고 성공 처리한다.
--        (app/free/actions.ts의 UNIQUE_VIOLATION 분기)
--        여기서 오류를 그대로 내보내면 표를 잃어버린 사람이 다시는 안 온다.
--   3. 동의하지 않으면 저장되지 않는다
--   4. 신청자 명단은 anon이 못 읽는다
--
-- 검사용 데이터는 스크립트가 스스로 만들고 지운다.

create temp table free_check (
  seq serial,
  name text,
  outcome text,
  detail text
) on commit drop;

-- 남아 있을 수 있는 이전 검사 데이터를 먼저 치운다
delete from public.leads where phone in ('01099998888', '01099997777');

-- ============================================================ 1. 신청 저장
do $$
declare
  n integer;
begin
  set local role anon;
  insert into public.leads (name, phone, consent_privacy, consent_marketing, source)
  values ('검사용신청자', '01099998888', true, false, 'web');
  reset role;

  select count(*) into n from public.leads where phone = '01099998888';
  insert into free_check (name, outcome, detail)
  values ('신청하면 leads에 행이 생긴다',
          case when n = 1 then 'PASS' else 'FAIL' end,
          format('%s건', n));
exception when others then
  reset role;
  insert into free_check (name, outcome, detail)
  values ('신청하면 leads에 행이 생긴다', 'FAIL', sqlerrm);
end $$;

-- ============================================================ 2. 중복 신청
do $$
declare
  err_code text;
begin
  set local role anon;
  insert into public.leads (name, phone, consent_privacy, source)
  values ('검사용신청자', '01099998888', true, 'web');
  reset role;
  insert into free_check (name, outcome, detail)
  values ('같은 번호 재신청은 유일 제약에 걸린다', 'FAIL', '중복이 그대로 저장됨');
exception when unique_violation then
  reset role;
  get stacked diagnostics err_code = returned_sqlstate;
  insert into free_check (name, outcome, detail)
  values ('같은 번호 재신청은 유일 제약에 걸린다', 'PASS',
          format('SQLSTATE %s — 서버가 이 코드를 성공으로 처리한다', err_code));
when others then
  reset role;
  insert into free_check (name, outcome, detail)
  values ('같은 번호 재신청은 유일 제약에 걸린다', 'FAIL', sqlerrm);
end $$;

-- 중복이 실제로 안 쌓였는지
insert into free_check (name, outcome, detail)
select '재신청해도 행은 하나뿐이다',
       case when count(*) = 1 then 'PASS' else 'FAIL' end,
       format('%s건', count(*))
from public.leads where phone = '01099998888';

-- ============================================================ 3. 동의 없는 신청
do $$
begin
  set local role anon;
  insert into public.leads (name, phone, consent_privacy, source)
  values ('무동의', '01099997777', false, 'web');
  reset role;
  insert into free_check (name, outcome, detail)
  values ('동의하지 않으면 저장되지 않는다', 'FAIL', '저장됨');
exception when others then
  reset role;
  insert into free_check (name, outcome, detail)
  values ('동의하지 않으면 저장되지 않는다', 'PASS', '거부됨');
end $$;

-- ============================================================ 4. 명단 보호
do $$
declare
  n integer;
begin
  set local role anon;
  select count(*) into n from public.leads;
  reset role;
  insert into free_check (name, outcome, detail)
  values ('anon은 신청자 명단을 읽을 수 없다', 'FAIL', format('%s건 조회됨', n));
exception when insufficient_privilege then
  reset role;
  insert into free_check (name, outcome, detail)
  values ('anon은 신청자 명단을 읽을 수 없다', 'PASS', '권한 부족으로 차단');
when others then
  reset role;
  insert into free_check (name, outcome, detail)
  values ('anon은 신청자 명단을 읽을 수 없다', 'PASS', sqlerrm);
end $$;

-- ============================================================ 5. 무료 1강 존재
insert into free_check (name, outcome, detail)
select '무료 공개 차시가 정확히 하나 있다',
       case when count(*) = 1 then 'PASS' else 'FAIL' end,
       format('%s개', count(*))
from public.lessons l
join public.courses c on c.id = l.course_id
where c.slug = 'first-deploy-vibecoding' and l.is_free_preview;

-- ============================================================ 정리
delete from public.leads where phone in ('01099998888', '01099997777');

select seq, name, outcome, detail from free_check order by seq;

do $$
declare
  failures integer;
begin
  select count(*) into failures from free_check where outcome <> 'PASS';
  if failures > 0 then
    raise exception '무료 1강 퍼널 검증 실패 %건 — 위 표를 확인하세요', failures;
  end if;
  raise notice '무료 1강 퍼널 검증 전부 통과';
end $$;
