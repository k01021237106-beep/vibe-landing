-- 역방향: 20260904100000_payment_functions.sql
-- ⚠️ 실결제 데이터가 있으면 실행하지 않는다.
drop function if exists public.refund_order(text);
drop function if exists public.complete_paid_order(text, text, text, jsonb);
