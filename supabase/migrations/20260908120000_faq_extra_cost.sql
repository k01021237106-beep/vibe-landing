-- FAQ 추가: "강의 말고 따로 돈이 드나요?"
--
-- 왜 필요한가.
--   Claude Code는 Pro·Max·Team·Enterprise·Console 계정이 있어야 쓸 수 있고
--   무료 claude.ai 플랜으로는 안 된다 (code.claude.com/docs/en/setup).
--   99,000원을 낸 손님이 2강에서야 이 사실을 알면 환불 사유가 되고
--   표시광고법 문제로도 번질 수 있다. 결제 전에 보이는 자리에 적는다.
--
-- 어디에 두는가.
--   position 3 — "컴퓨터가 없어도 되나요?" 바로 다음. 준비물 질문끼리 붙인다.
--   기존 3~6번은 한 칸씩 밀린다.
--
-- 금액을 적지 않는 이유.
--   요금제는 바뀌는데 이 문장은 손님이 결제 전에 읽는다.
--   틀린 금액이 적혀 있는 편이 안 적힌 것보다 나쁘다. 공식 페이지로 보낸다.
--
-- 역방향: supabase/migrations/down/20260908120000_faq_extra_cost.down.sql

-- 이미 들어가 있으면 아무것도 하지 않는다 (자리 두 번 밀리는 것을 막는다).
update public.faqs f
set position = f.position + 1
from public.courses c
where f.course_id = c.id
  and c.slug = 'first-deploy-vibecoding'
  and f.position >= 3
  and not exists (
    select 1 from public.faqs x
    where x.course_id = c.id
      and x.question = '강의 말고 따로 돈이 드나요?'
  );

insert into public.faqs (course_id, question, answer, position)
select
  c.id,
  '강의 말고 따로 돈이 드나요?',
  '두 가지가 있습니다. 하나는 클로드(Claude) 유료 구독입니다. 우리말로 부탁하면 대신 만들어 주는 도구라 매달 이용료가 있고, 무료 계정으로는 이 강의를 따라 하실 수 없습니다. 금액과 요금제는 바뀔 수 있어 여기에 적지 않았습니다. 클로드 공식 홈페이지에서 확인하실 수 있고, 언제든 해지하실 수 있습니다. '
    || '다른 하나는 인터넷 주소(도메인)입니다. 8강에서 내 이름을 단 주소를 다는 방법을 알려 드리는데, 이 주소는 1년 단위로 값을 내고 빌리는 것입니다. 다만 사지 않으셔도 강의는 끝까지 하실 수 있습니다. 7강에서 무료로 받는 주소가 있고, 그 주소로도 남에게 보내 보실 수 있습니다. '
    || '그 밖에는 없습니다. 설치하는 프로그램(Git 등)과 만든 것을 세상에 올리는 서비스는 모두 무료로 쓰실 수 있는 범위 안에서 진행합니다.',
  3
from public.courses c
where c.slug = 'first-deploy-vibecoding'
  and not exists (
    select 1 from public.faqs x
    where x.course_id = c.id
      and x.question = '강의 말고 따로 돈이 드나요?'
  );
