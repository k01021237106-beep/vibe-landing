import "server-only";

import { createClient } from "@/lib/supabase/server";
import { fixtures } from "@/lib/fixtures/content";

/**
 * 공개 페이지가 읽는 콘텐츠.
 *
 * 강의·차시·후기·FAQ의 원본은 **데이터베이스**다.
 * 강의를 추가하는 일이 코드 수정 없이 행 추가만으로 끝나야 하고,
 * 무엇보다 가격은 결제 승인 때 서버가 이 값으로 재검증하기 때문이다.
 * 화면에 보이는 가격과 청구되는 가격이 다른 곳에서 오면 안 된다.
 *
 * (브랜드·연락처·사업자정보처럼 DB에 없는 값은 lib/config.ts에 있다)
 */

/** ⚠️ vimeo_id는 빼고 고른다. anon·authenticated에는 그 컬럼 권한이 없다. */
const LESSON_COLUMNS =
  "id, position, title, summary, duration_seconds, is_free_preview" as const;

const COURSE_COLUMNS =
  "id, slug, title, subtitle, description, list_price, sale_price" as const;

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  list_price: number;
  sale_price: number;
};

export type Lesson = {
  id: string;
  position: number;
  title: string;
  summary: string | null;
  duration_seconds: number | null;
  is_free_preview: boolean;
};

export type Review = {
  id: string;
  author_name: string;
  author_role: string | null;
  rating: number | null;
  body: string;
  is_sample: boolean;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

/**
 * 개발 중 데이터베이스에 닿지 못할 때 고정 데이터로 화면을 확인하기 위한 장치.
 *
 * 운영 빌드에서는 절대 켜지지 않는다 — NODE_ENV 검사가 앞에 있다.
 * 켜져 있으면 서버 로그에 매번 경고를 남긴다. 조용히 가짜 데이터를 보여 주면
 * 데이터베이스가 죽은 걸 모르고 지나갈 수 있기 때문이다.
 */
const useFixtures =
  process.env.NODE_ENV !== "production" &&
  process.env.USE_CONTENT_FIXTURES === "1";

function fixtureNotice(what: string) {
  console.warn(`[content] 고정 데이터로 ${what}을(를) 채웠습니다 (USE_CONTENT_FIXTURES=1).`);
}

export async function getPublishedCourses(): Promise<Course[]> {
  if (useFixtures) {
    fixtureNotice("강의 목록");
    return fixtures.courses;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("is_published", true)
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (useFixtures) {
    fixtureNotice(`강의(${slug})`);
    return fixtures.courses.find((c) => c.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getLessons(courseId: string): Promise<Lesson[]> {
  if (useFixtures) {
    fixtureNotice("커리큘럼");
    return fixtures.lessons;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(LESSON_COLUMNS)
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getReviews(courseId?: string): Promise<Review[]> {
  if (useFixtures) {
    fixtureNotice("후기");
    return fixtures.reviews;
  }

  const supabase = await createClient();
  let query = supabase
    .from("reviews")
    .select("id, author_name, author_role, rating, body, is_sample")
    .eq("is_published", true)
    .order("position", { ascending: true });

  if (courseId) query = query.eq("course_id", courseId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getFaqs(courseId?: string): Promise<Faq[]> {
  if (useFixtures) {
    fixtureNotice("자주 묻는 질문");
    return fixtures.faqs;
  }

  const supabase = await createClient();
  let query = supabase
    .from("faqs")
    .select("id, question, answer")
    .eq("is_published", true)
    .order("position", { ascending: true });

  if (courseId) query = query.eq("course_id", courseId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** 랜딩과 강의 상세가 함께 쓰는 묶음. 한 번에 가져온다. */
export async function getCoursePageData(slug: string) {
  const course = await getCourseBySlug(slug);
  if (!course) return null;

  const [lessons, reviews, faqs] = await Promise.all([
    getLessons(course.id),
    getReviews(course.id),
    getFaqs(course.id),
  ]);

  return { course, lessons, reviews, faqs };
}

/** 초를 사람이 읽는 길이로. 480 → "8분" */
export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

/** 전체 재생 시간 합계 */
export function totalDuration(lessons: Lesson[]): string {
  const sum = lessons.reduce((acc, l) => acc + (l.duration_seconds ?? 0), 0);
  return formatDuration(sum);
}
