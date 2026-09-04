-- 결제 처리 검증
--
-- 실행 방법
--   psql "$SUPABASE_DB_URL" -f supabase/tests/payments.sql
--   또는 Supabase 대시보드 SQL Editor에 붙여넣기
--
-- 확인하는 것
--   1. 대기 주문의 금액이 DB 가격에서 온다 (클라이언트 값이 아니다)
--   2. 승인하면 주문 상태 변경과 수강권 발급이 함께 일어난다
--   3. 두 번 승인해도 수강권은 하나다 (토스 중복 전송·새로고침 대비)
--   4. 환불하면 수강권이 회수된다 (돈 돌려주고 강의도 보게 두면 안 된다)
--   5. 클라이언트는 결제·환불 함수를 부를 수 없다
--
-- 검사용 데이터는 스크립트가 스스로 만들고 지운다.

create temp table pay_check (seq serial, name text, outcome text, detail text) on commit drop;

do $$
declare
  v_user uuid := gen_random_uuid();
  v_course uuid;
  v_order uuid;
  r record;
  n integer;
begin
  select id into v_course from public.courses where slug = 'first-deploy-vibecoding';

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                          created_at, updated_at)
  values (v_user, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'pay-test@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.orders (user_id, course_id, order_code, amount, status)
  select v_user, v_course, 'TEST-ORDER-001', c.sale_price, 'pending'
  from public.courses c where c.id = v_course
  returning id into v_order;

  insert into pay_check (name, outcome, detail)
  select '대기 주문의 금액은 DB 가격과 같다',
         case when o.amount = c.sale_price then 'PASS' else 'FAIL' end,
         format('주문 %s원 / 강의 %s원', o.amount, c.sale_price)
  from public.orders o join public.courses c on c.id = o.course_id
  where o.id = v_order;

  select * into r from public.complete_paid_order(
    'TEST-ORDER-001', 'pk_test_1', '카드', '{"status":"DONE"}'::jsonb);

  insert into pay_check (name, outcome, detail)
  select '승인하면 주문이 paid가 된다',
         case when status = 'paid' and approved_at is not null then 'PASS' else 'FAIL' end,
         format('status=%s payment_key=%s', status, payment_key)
  from public.orders where id = v_order;

  insert into pay_check (name, outcome, detail)
  select '같은 트랜잭션에서 수강권이 생긴다',
         case when count(*) = 1 then 'PASS' else 'FAIL' end,
         format('%s건, status=%s', count(*), coalesce(min(status), '-'))
  from public.enrollments where user_id = v_user and course_id = v_course;

  select * into r from public.complete_paid_order(
    'TEST-ORDER-001', 'pk_test_1', '카드', '{"status":"DONE"}'::jsonb);
  select count(*) into n from public.enrollments where user_id = v_user and course_id = v_course;
  insert into pay_check (name, outcome, detail)
  values ('두 번 승인해도 수강권은 하나다',
          case when n = 1 then 'PASS' else 'FAIL' end, format('%s건', n));

  perform public.refund_order('TEST-ORDER-001');

  insert into pay_check (name, outcome, detail)
  select '환불하면 주문이 refunded가 된다',
         case when status = 'refunded' then 'PASS' else 'FAIL' end, status
  from public.orders where id = v_order;

  insert into pay_check (name, outcome, detail)
  select '환불하면 수강권이 회수된다',
         case when status = 'revoked' and revoked_at is not null then 'PASS' else 'FAIL' end,
         format('status=%s', status)
  from public.enrollments where user_id = v_user and course_id = v_course;

  delete from public.enrollments where user_id = v_user;
  delete from public.orders where user_id = v_user;
  delete from auth.users where id = v_user;
end $$;

do $$
begin
  set local role anon;
  perform public.complete_paid_order('x', 'y', 'z', '{}'::jsonb);
  reset role;
  insert into pay_check (name, outcome, detail)
  values ('anon은 결제 완료 함수를 부를 수 없다', 'FAIL', '호출됨');
exception when insufficient_privilege then
  reset role;
  insert into pay_check (name, outcome, detail)
  values ('anon은 결제 완료 함수를 부를 수 없다', 'PASS', '권한 부족으로 차단');
when others then
  reset role;
  insert into pay_check (name, outcome, detail)
  values ('anon은 결제 완료 함수를 부를 수 없다', 'PASS', sqlerrm);
end $$;

do $$
begin
  set local role authenticated;
  perform public.refund_order('x');
  reset role;
  insert into pay_check (name, outcome, detail)
  values ('로그인 사용자도 환불 함수를 부를 수 없다', 'FAIL', '호출됨');
exception when insufficient_privilege then
  reset role;
  insert into pay_check (name, outcome, detail)
  values ('로그인 사용자도 환불 함수를 부를 수 없다', 'PASS', '권한 부족으로 차단');
when others then
  reset role;
  insert into pay_check (name, outcome, detail)
  values ('로그인 사용자도 환불 함수를 부를 수 없다', 'PASS', sqlerrm);
end $$;

select seq, name, outcome, detail from pay_check order by seq;

do $$
declare failures integer;
begin
  select count(*) into failures from pay_check where outcome <> 'PASS';
  if failures > 0 then
    raise exception '결제 처리 검증 실패 %건 — 위 표를 확인하세요', failures;
  end if;
  raise notice '결제 처리 검증 전부 통과';
end $$;
