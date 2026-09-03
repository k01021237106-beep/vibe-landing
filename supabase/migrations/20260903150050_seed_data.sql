-- 시드 데이터: 강의 1개 + 차시 8개 + FAQ + 샘플 후기
--
-- ⚠️ 커리큘럼·강사 소개·후기는 실제 콘텐츠가 아직 없어서 만든 예시다.
--    오픈 전 실제 내용으로 교체한다. 각 항목에 TODO를 달아 뒀다.
--
-- 역방향: supabase/migrations/down/20260903150050_seed_data.down.sql

-- TODO: 강의 소개 문구를 실제 내용으로 교체
insert into public.courses (slug, title, subtitle, description, list_price, sale_price, is_published, position)
values (
  'first-deploy-vibecoding',
  '첫배포 바이브코딩 입문',
  '코딩을 몰라도, AI와 함께 내 서비스를 세상에 배포합니다',
  '설치부터 배포까지 화면을 그대로 따라 하면 됩니다. 영어 화면이 나와도, 빨간 오류가 떠도 혼자 두지 않습니다. 강의가 끝나면 남에게 주소를 보낼 수 있는 내 서비스가 하나 남습니다.',
  198000,
  99000,
  true,
  1
)
on conflict (slug) do nothing;

-- TODO: 차시 구성과 제목을 실제 커리큘럼으로 교체
-- TODO: vimeo_id를 실제 Vimeo 영상 ID로 교체 (비공개 + 도메인 제한 설정 후)
insert into public.lessons (course_id, position, title, summary, duration_seconds, vimeo_id, is_free_preview)
select
  c.id, v.position, v.title, v.summary, v.duration_seconds, v.vimeo_id, v.is_free_preview
from public.courses c
cross join (values
  (1, '무엇을 만들게 되나요', '강의가 끝났을 때 손에 남는 것을 먼저 봅니다. 지금 못 해도 괜찮습니다.', 480, 'TODO-VIMEO-ID-01', true),
  (2, '도구 설치 — 화면 그대로 따라 하기', '설치가 첫 관문입니다. 눌러야 할 버튼을 하나씩 짚어 드립니다.', 900, 'TODO-VIMEO-ID-02', false),
  (3, 'AI에게 원하는 것을 말하는 법', '어떻게 말해야 원하는 결과가 나오는지, 문장 몇 개면 충분합니다.', 1080, 'TODO-VIMEO-ID-03', false),
  (4, '첫 화면 만들기', '빈 화면에서 시작해 사람이 볼 수 있는 첫 페이지까지 갑니다.', 1320, 'TODO-VIMEO-ID-04', false),
  (5, '내용 채우고 보기 좋게 다듬기', '글과 사진을 넣고, 휴대폰에서도 잘 보이게 맞춥니다.', 1200, 'TODO-VIMEO-ID-05', false),
  (6, '막혔을 때 빠져나오는 법', '빨간 글씨가 떠도 당황하지 않습니다. 물어보는 방법을 익힙니다.', 1020, 'TODO-VIMEO-ID-06', false),
  (7, '세상에 내보내기 — 첫 배포', '내 컴퓨터에만 있던 것을 누구나 볼 수 있는 주소로 만듭니다.', 1140, 'TODO-VIMEO-ID-07', false),
  (8, '내 주소 달고 계속 고치기', '주소를 바꾸고, 나중에 혼자서도 고칠 수 있게 마무리합니다.', 960, 'TODO-VIMEO-ID-08', false)
) as v(position, title, summary, duration_seconds, vimeo_id, is_free_preview)
where c.slug = 'first-deploy-vibecoding'
on conflict (course_id, position) do nothing;

-- TODO: 실제로 자주 들어오는 질문으로 교체
insert into public.faqs (course_id, question, answer, position)
select c.id, v.question, v.answer, v.position
from public.courses c
cross join (values
  ('정말 코딩을 하나도 몰라도 되나요?', '네. 이 강의는 컴퓨터로 문서를 만들어 본 정도면 따라올 수 있게 만들었습니다. 어려운 용어는 나올 때마다 우리말로 풀어 설명합니다.', 1),
  ('컴퓨터가 없어도 되나요?', '컴퓨터가 필요합니다. 윈도우와 맥 모두 됩니다. 휴대폰만으로는 배포까지 하기 어렵습니다.', 2),
  ('중간에 막히면 어떻게 하나요?', '막히는 지점은 대부분 정해져 있습니다. 그 지점마다 영상에서 따로 짚어 드리고, 카카오톡 채널로 질문하실 수 있습니다.', 3),
  ('수강 기간에 제한이 있나요?', '없습니다. 한 번 구매하시면 계속 보실 수 있습니다.', 4),
  ('환불이 되나요?', '수강 시작 후 7일 이내이고 수강 진도가 일정 기준 이하이면 환불됩니다. 자세한 조건은 환불 규정을 확인해 주세요.', 5),
  ('나이가 많아도 괜찮을까요?', '괜찮습니다. 화면 글씨를 크게 하고 말하는 속도를 늦춰 만들었습니다. 서두르지 않아도 됩니다.', 6)
) as v(question, answer, position)
where c.slug = 'first-deploy-vibecoding'
on conflict do nothing;

-- ⚠️ 전부 예시다. is_sample이 true이므로 화면에 «샘플 후기» 배지가 붙는다.
-- TODO: 오픈 전 실제 후기로 교체하거나 섹션을 내린다. 표시광고법 위반 소지.
insert into public.reviews (course_id, author_name, author_role, rating, body, is_sample, position)
select c.id, v.author_name, v.author_role, v.rating, v.body, true, v.position
from public.courses c
cross join (values
  ('김OO', '50대 · 자영업', 5, '설치에서만 세 번 포기했었습니다. 이번엔 화면이 똑같아서 그냥 따라만 했더니 넘어갔습니다. 제 가게 소개 페이지가 생겼습니다.', 1),
  ('박OO', '40대 · 직장인', 5, '영어가 나오면 바로 덮었는데, 여기서는 뭘 누르라고 우리말로 알려 주니 덮을 일이 없었습니다.', 2),
  ('이OO', '60대 · 은퇴', 4, '천천히 따라가느라 이 주 걸렸습니다. 그래도 손주에게 제가 만든 주소를 보내 줬습니다.', 3),
  ('최OO', '30대 · 프리랜서', 5, '오류가 떴을 때 물어보는 방법을 알려 준 게 제일 컸습니다. 이제는 혼자 고칩니다.', 4)
) as v(author_name, author_role, rating, body, position)
where c.slug = 'first-deploy-vibecoding'
on conflict do nothing;
