-- 관리자 권한 검증
--
-- 실행 방법
--   psql "$SUPABASE_DB_URL" -f supabase/tests/admin.sql
--   또는 Supabase 대시보드 SQL Editor에 붙여넣기
--
-- 확인하는 것
--   1. 일반 수강생은 남의 주문·수강권·신청자 명단을 볼 수 없다
--   2. 관리자는 전부 볼 수 있다 (is_admin() 정책이 실제로 통과시킨다)
--   3. 사용자가 스스로 관리자가 될 수 없다
--
-- ⚠️ 주의: '남의 것'을 검사하려면 반드시 제3자 데이터를 만들어야 한다.
--    검사 대상 본인 이름으로 주문을 만들어 놓고 "남의 주문"이라 단언하면
--    정상 동작(본인 주문 조회)이 실패로 잡힌다. 실제로 한 번 그렇게 틀렸다.
--
-- 검사용 데이터는 스크립트가 스스로 만들고 지운다.

create temp table admin_check (seq serial, name text, outcome text, detail text) on commit drop;

do $$
declare
  v_admin uuid := gen_random_uuid();
  v_student uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();   -- 제3자. 이 사람의 데이터를 수강생이 못 봐야 한다.
  v_course uuid;
  n integer;
  b boolean;
begin
  select id into v_course from public.courses where slug = 'first-deploy-vibecoding';

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'admin-test@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
         (v_student, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'student-test@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
         (v_other, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'other-test@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

  update public.profiles set role = 'admin' where id = v_admin;

  insert into public.orders (user_id, course_id, order_code, amount, status)
  values (v_other, v_course, 'ADMIN-TEST-OTHER', 99000, 'paid');
  insert into public.enrollments (user_id, course_id, source, status)
  values (v_other, v_course, 'purchase', 'active');
  insert into public.leads (name, phone, consent_privacy)
  values ('관리자검사', '01088887777', true);

  -- ───────────────────────── 일반 수강생
  perform set_config('request.jwt.claims', json_build_object('sub', v_student::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.orders;
  reset role;
  insert into admin_check (name, outcome, detail)
  values ('일반 수강생은 남의 주문을 볼 수 없다', case when n = 0 then 'PASS' else 'FAIL' end, format('%s건 조회', n));

  perform set_config('request.jwt.claims', json_build_object('sub', v_student::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.enrollments;
  reset role;
  insert into admin_check (name, outcome, detail)
  values ('일반 수강생은 남의 수강권을 볼 수 없다', case when n = 0 then 'PASS' else 'FAIL' end, format('%s건 조회', n));

  perform set_config('request.jwt.claims', json_build_object('sub', v_student::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.leads;
  reset role;
  insert into admin_check (name, outcome, detail)
  values ('일반 수강생은 신청자 명단을 볼 수 없다', case when n = 0 then 'PASS' else 'FAIL' end, format('%s건 조회', n));

  perform set_config('request.jwt.claims', json_build_object('sub', v_student::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles;
  reset role;
  insert into admin_check (name, outcome, detail)
  values ('일반 수강생은 본인 프로필만 본다', case when n = 1 then 'PASS' else 'FAIL' end, format('%s건 조회', n));

  perform set_config('request.jwt.claims', json_build_object('sub', v_student::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select public.is_admin() into b;
  reset role;
  insert into admin_check (name, outcome, detail)
  values ('일반 수강생에게 is_admin()은 거짓이다', case when b = false then 'PASS' else 'FAIL' end, format('%s', b));

  -- ───────────────────────── 관리자
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.orders;
  reset role;
  insert into admin_check (name, outcome, detail)
  values ('관리자는 모든 주문을 본다', case when n >= 1 then 'PASS' else 'FAIL' end, format('%s건 조회', n));

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.leads;
  reset role;
  insert into admin_check (name, outcome, detail)
  values ('관리자는 신청자 명단을 본다', case when n >= 1 then 'PASS' else 'FAIL' end, format('%s건 조회', n));

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select public.is_admin() into b;
  reset role;
  insert into admin_check (name, outcome, detail)
  values ('관리자에게 is_admin()은 참이다', case when b = true then 'PASS' else 'FAIL' end, format('%s', b));

  -- ───────────────────────── 자기 승격
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_student::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.profiles set role = 'admin' where id = v_student;
    reset role;
    insert into admin_check (name, outcome, detail)
    values ('사용자는 스스로 관리자가 될 수 없다', 'FAIL', '승격됨');
  exception when others then
    reset role;
    insert into admin_check (name, outcome, detail)
    values ('사용자는 스스로 관리자가 될 수 없다', 'PASS', '권한 부족으로 차단');
  end;

  delete from public.leads where phone = '01088887777';
  delete from public.enrollments where user_id = v_other;
  delete from public.orders where order_code = 'ADMIN-TEST-OTHER';
  delete from auth.users where id in (v_admin, v_student, v_other);
end $$;

select seq, name, outcome, detail from admin_check order by seq;

do $$
declare failures integer;
begin
  select count(*) into failures from admin_check where outcome <> 'PASS';
  if failures > 0 then
    raise exception '관리자 권한 검증 실패 %건 — 위 표를 확인하세요', failures;
  end if;
  raise notice '관리자 권한 검증 전부 통과';
end $$;
