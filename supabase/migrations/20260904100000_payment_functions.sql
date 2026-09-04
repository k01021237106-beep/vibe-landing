-- 결제 완료 처리를 한 트랜잭션으로 묶는다
--
-- 왜 데이터베이스 함수인가:
--   주문을 '결제됨'으로 바꾸는 일과 수강권을 만드는 일은 **함께 성공하거나 함께 실패**해야 한다.
--   애플리케이션에서 두 번 호출하면 그 사이에 실패했을 때
--   "돈은 냈는데 강의를 못 보는" 상태가 남는다. 가장 나쁜 실패다.
--   supabase-js로는 여러 문장을 한 트랜잭션으로 묶을 수 없어 함수로 만든다.
--
-- 역방향: supabase/migrations/down/20260904100000_payment_functions.down.sql

create or replace function public.complete_paid_order(
  p_order_code text,
  p_payment_key text,
  p_method text,
  p_raw jsonb
)
returns table (order_id uuid, enrollment_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_enrollment_id uuid;
begin
  -- 같은 주문에 대한 승인이 동시에 두 번 들어와도 한 번만 처리되도록 행을 잠근다.
  select * into v_order
  from public.orders
  where order_code = p_order_code
  for update;

  if not found then
    raise exception 'order_not_found: %', p_order_code
      using errcode = 'no_data_found';
  end if;

  /*
   * 이미 결제된 주문이면 아무것도 바꾸지 않고 기존 결과를 돌려준다.
   * 토스가 같은 승인을 두 번 보내거나 사용자가 완료 화면을 새로고침할 수 있다.
   */
  if v_order.status = 'paid' then
    select e.id into v_enrollment_id
    from public.enrollments e
    where e.user_id = v_order.user_id and e.course_id = v_order.course_id;

    order_id := v_order.id;
    enrollment_id := v_enrollment_id;
    return next;
    return;
  end if;

  if v_order.status <> 'pending' then
    raise exception 'order_not_payable: % (status=%)', p_order_code, v_order.status
      using errcode = 'check_violation';
  end if;

  update public.orders
  set status = 'paid',
      payment_key = p_payment_key,
      method = p_method,
      approved_at = now(),
      raw_response = p_raw
  where id = v_order.id;

  -- 같은 강의를 이미 갖고 있으면(환불 후 재구매 등) 되살린다.
  insert into public.enrollments (user_id, course_id, order_id, source, status)
  values (v_order.user_id, v_order.course_id, v_order.id, 'purchase', 'active')
  on conflict (user_id, course_id) do update
    set status = 'active',
        order_id = excluded.order_id,
        granted_at = now(),
        revoked_at = null
  returning id into v_enrollment_id;

  order_id := v_order.id;
  enrollment_id := v_enrollment_id;
  return next;
end;
$$;

comment on function public.complete_paid_order is
  '결제 승인 후 주문 상태 변경과 수강권 발급을 한 트랜잭션으로 처리한다. 서버(service_role)만 호출한다.';

-- ⚠️ 이 함수는 돈과 접근권을 다룬다. 클라이언트가 부를 수 있으면 안 된다.
revoke all on function public.complete_paid_order(text, text, text, jsonb) from public, anon, authenticated;

-- 환불 시 수강권 회수도 함께 처리한다 (Phase 6 관리자 화면에서 쓴다)
create or replace function public.refund_order(p_order_code text)
returns table (order_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where order_code = p_order_code for update;

  if not found then
    raise exception 'order_not_found: %', p_order_code using errcode = 'no_data_found';
  end if;

  if v_order.status <> 'paid' then
    raise exception 'order_not_refundable: % (status=%)', p_order_code, v_order.status
      using errcode = 'check_violation';
  end if;

  update public.orders
  set status = 'refunded', canceled_at = now()
  where id = v_order.id;

  -- 환불하면 수강권을 거둔다. 돈을 돌려주고 강의도 보게 두면 안 된다.
  update public.enrollments
  set status = 'revoked', revoked_at = now()
  where user_id = v_order.user_id and course_id = v_order.course_id;

  order_id := v_order.id;
  return next;
end;
$$;

comment on function public.refund_order is
  '환불 처리와 수강권 회수를 한 트랜잭션으로 처리한다. 서버(service_role)만 호출한다.';

revoke all on function public.refund_order(text) from public, anon, authenticated;
