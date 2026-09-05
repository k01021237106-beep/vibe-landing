-- 결제 함수를 서버(service_role)가 부를 수 있게 한다.
--
-- 무엇이 잘못됐었나 (2026-09-05, 첫 실결제 테스트에서 드러남)
--
--   Phase 5에서 이렇게 막았다:
--     revoke all on function public.complete_paid_order(...) from public, anon, authenticated;
--
--   의도는 "브라우저에서 부를 수 있는 역할에서 회수"였다. 그건 맞다.
--   그런데 `public`에서 회수하면 **기본으로 딸려 있던 실행 권한이 통째로** 사라진다.
--   그 안에 service_role도 들어 있었고, 다시 부여하지 않았다.
--
--   결과: 우리 서버가 승인 직후 함수를 부르지 못했다.
--     POST | 403 | .../rpc/complete_paid_order
--     permission denied for function complete_paid_order
--
--   토스 승인은 났는데 주문은 pending에 머물고 수강권은 생기지 않았다.
--   실제 손님이었다면 "돈은 냈는데 강의를 못 보는" 상태였다.
--
-- 왜 SQL 테스트가 못 잡았나
--   supabase/tests/payments.sql은 postgres 권한으로 돈다. 그 권한은 남아 있었으므로
--   함수는 정상 동작했다. **로직은 맞았고 부를 권한이 없었을 뿐이다.**
--   권한은 실제 호출 경로로 불러 봐야 드러난다.
--
-- anon·authenticated는 계속 막힌 채로 둔다. 그 둘은 브라우저에서 오는 역할이고,
-- 이 함수는 돈과 접근권을 다룬다.

grant execute on function public.complete_paid_order(text, text, text, jsonb) to service_role;
grant execute on function public.refund_order(text) to service_role;
