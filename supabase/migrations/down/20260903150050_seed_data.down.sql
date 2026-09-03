-- 역방향: 20260903150050_seed_data.sql
-- 시드 강의와 그에 딸린 행만 지운다 (lessons·faqs·reviews는 on delete cascade).
-- ⚠️ 실제 주문·수강권이 이 강의를 참조하면 orders.course_id의 on delete restrict가 막는다.
--    그때는 롤백하지 말고 수정으로 대응한다.
delete from public.courses where slug = 'first-deploy-vibecoding';
