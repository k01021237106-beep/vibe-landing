import type { Course, Faq, Lesson, Review } from "@/lib/content";

/**
 * 개발용 고정 데이터.
 *
 * 실제 데이터베이스의 시드 내용을 그대로 옮겨 둔 것이다
 * (`supabase/migrations/20260903150050_seed_data.sql`).
 * 데이터베이스에 닿지 못하는 환경에서 화면을 확인할 때만 쓴다.
 *
 * ⚠️ 운영 빌드에서는 절대 쓰이지 않는다. `lib/content.ts`의 NODE_ENV 검사를 보라.
 * ⚠️ 시드를 고치면 여기도 같이 고친다. 안 그러면 개발 화면과 실제가 어긋난다.
 */

const courses: Course[] = [
  {
    id: "fixture-course-1",
    slug: "first-deploy-vibecoding",
    title: "첫배포 바이브코딩 입문",
    subtitle: "코딩을 몰라도, AI와 함께 내 서비스를 세상에 배포합니다",
    description:
      "설치부터 배포까지 화면을 그대로 따라 하면 됩니다. 영어 화면이 나와도, 빨간 오류가 떠도 혼자 두지 않습니다. 강의가 끝나면 남에게 주소를 보낼 수 있는 내 서비스가 하나 남습니다.",
    list_price: 198000,
    sale_price: 99000,
  },
];

const lessons: Lesson[] = [
  {
    id: "fixture-lesson-1",
    position: 1,
    title: "무엇을 만들게 되나요",
    summary: "강의가 끝났을 때 손에 남는 것을 먼저 봅니다. 지금 못 해도 괜찮습니다.",
    duration_seconds: 480,
    is_free_preview: true,
  },
  {
    id: "fixture-lesson-2",
    position: 2,
    title: "도구 설치 — 화면 그대로 따라 하기",
    summary: "설치가 첫 관문입니다. 눌러야 할 버튼을 하나씩 짚어 드립니다.",
    duration_seconds: 900,
    is_free_preview: false,
  },
  {
    id: "fixture-lesson-3",
    position: 3,
    title: "AI에게 원하는 것을 말하는 법",
    summary: "어떻게 말해야 원하는 결과가 나오는지, 문장 몇 개면 충분합니다.",
    duration_seconds: 1080,
    is_free_preview: false,
  },
  {
    id: "fixture-lesson-4",
    position: 4,
    title: "첫 화면 만들기",
    summary: "빈 화면에서 시작해 사람이 볼 수 있는 첫 페이지까지 갑니다.",
    duration_seconds: 1320,
    is_free_preview: false,
  },
  {
    id: "fixture-lesson-5",
    position: 5,
    title: "내용 채우고 보기 좋게 다듬기",
    summary: "글과 사진을 넣고, 휴대폰에서도 잘 보이게 맞춥니다.",
    duration_seconds: 1200,
    is_free_preview: false,
  },
  {
    id: "fixture-lesson-6",
    position: 6,
    title: "막혔을 때 빠져나오는 법",
    summary: "빨간 글씨가 떠도 당황하지 않습니다. 물어보는 방법을 익힙니다.",
    duration_seconds: 1020,
    is_free_preview: false,
  },
  {
    id: "fixture-lesson-7",
    position: 7,
    title: "세상에 내보내기 — 첫 배포",
    summary: "내 컴퓨터에만 있던 것을 누구나 볼 수 있는 주소로 만듭니다.",
    duration_seconds: 1140,
    is_free_preview: false,
  },
  {
    id: "fixture-lesson-8",
    position: 8,
    title: "내 주소 달고 계속 고치기",
    summary: "주소를 바꾸고, 나중에 혼자서도 고칠 수 있게 마무리합니다.",
    duration_seconds: 960,
    is_free_preview: false,
  },
];

const reviews: Review[] = [
  {
    id: "fixture-review-1",
    author_name: "김OO",
    author_role: "50대 · 자영업",
    rating: 5,
    body: "설치에서만 세 번 포기했었습니다. 이번엔 화면이 똑같아서 그냥 따라만 했더니 넘어갔습니다. 제 가게 소개 페이지가 생겼습니다.",
    is_sample: true,
  },
  {
    id: "fixture-review-2",
    author_name: "박OO",
    author_role: "40대 · 직장인",
    rating: 5,
    body: "영어가 나오면 바로 덮었는데, 여기서는 뭘 누르라고 우리말로 알려 주니 덮을 일이 없었습니다.",
    is_sample: true,
  },
  {
    id: "fixture-review-3",
    author_name: "이OO",
    author_role: "60대 · 은퇴",
    rating: 4,
    body: "천천히 따라가느라 이 주 걸렸습니다. 그래도 손주에게 제가 만든 주소를 보내 줬습니다.",
    is_sample: true,
  },
  {
    id: "fixture-review-4",
    author_name: "최OO",
    author_role: "30대 · 프리랜서",
    rating: 5,
    body: "오류가 떴을 때 물어보는 방법을 알려 준 게 제일 컸습니다. 이제는 혼자 고칩니다.",
    is_sample: true,
  },
];

const faqs: Faq[] = [
  {
    id: "fixture-faq-1",
    question: "정말 코딩을 하나도 몰라도 되나요?",
    answer:
      "네. 이 강의는 컴퓨터로 문서를 만들어 본 정도면 따라올 수 있게 만들었습니다. 어려운 용어는 나올 때마다 우리말로 풀어 설명합니다.",
  },
  {
    id: "fixture-faq-2",
    question: "컴퓨터가 없어도 되나요?",
    answer:
      "컴퓨터가 필요합니다. 윈도우와 맥 모두 됩니다. 휴대폰만으로는 배포까지 하기 어렵습니다.",
  },
  {
    id: "fixture-faq-3",
    question: "중간에 막히면 어떻게 하나요?",
    answer:
      "막히는 지점은 대부분 정해져 있습니다. 그 지점마다 영상에서 따로 짚어 드리고, 카카오톡 채널로 질문하실 수 있습니다.",
  },
  {
    id: "fixture-faq-4",
    question: "수강 기간에 제한이 있나요?",
    answer: "없습니다. 한 번 구매하시면 계속 보실 수 있습니다.",
  },
  {
    id: "fixture-faq-5",
    question: "환불이 되나요?",
    answer:
      "수강 시작 후 7일 이내이고 수강 진도가 일정 기준 이하이면 환불됩니다. 자세한 조건은 환불 규정을 확인해 주세요.",
  },
  {
    id: "fixture-faq-6",
    question: "나이가 많아도 괜찮을까요?",
    answer:
      "괜찮습니다. 화면 글씨를 크게 하고 말하는 속도를 늦춰 만들었습니다. 서두르지 않아도 됩니다.",
  },
];

export const fixtures = { courses, lessons, reviews, faqs };
