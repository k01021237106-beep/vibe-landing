-- 되돌리면 서버가 결제를 완료하지 못한다. 결제 기능을 끄는 것과 같다.
revoke execute on function public.complete_paid_order(text, text, text, jsonb) from service_role;
revoke execute on function public.refund_order(text) from service_role;
