-- 역방향: 20260908120000_faq_extra_cost.sql
-- 추가한 FAQ를 지우고 밀렸던 자리를 되돌린다.

delete from public.faqs f
using public.courses c
where f.course_id = c.id
  and c.slug = 'first-deploy-vibecoding'
  and f.question = '강의 말고 따로 돈이 드나요?';

update public.faqs f
set position = f.position - 1
from public.courses c
where f.course_id = c.id
  and c.slug = 'first-deploy-vibecoding'
  and f.position >= 4;
