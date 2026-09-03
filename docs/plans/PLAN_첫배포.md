# 실행 계획: 첫배포 — 바이브코딩 강의 판매 사이트

**Status**: 🔄 진행 중 — Phase 1 완료
**Started**: 2026-09-03
**Last Updated**: 2026-09-03

---

**⚠️ 필수 규칙**: 각 단계 완료 후
1. ✅ 완료한 작업 체크박스 표시
2. 🧪 Quality Gate 검증 명령 실행
3. ⚠️ Quality Gate 전 항목 통과 확인
4. 📅 위 "Last Updated" 갱신
5. 📝 Notes 섹션에 배운 점 기록
6. ➡️ 그 다음에만 다음 단계로

⛔ **Quality Gate를 건너뛰거나 실패한 채로 진행하지 않는다**

---

## 📋 개요

### 무엇을 만드는가
코딩을 전혀 모르는 초보자(중장년·시니어 포함)에게 "AI와 함께 내 서비스를 만들고 배포하는" 온라인 강의를 파는 사이트.
단순 소개 사이트가 아니라 **결제까지 완결되는 커머스**다.

퍼널: `유입 → 랜딩(설득) → 무료 1강 신청(경험) → 결제 → 내 강의실(수강)`

### 성공 기준
- [ ] 방문자가 무료 1강을 신청하고 시청할 수 있다
- [ ] 방문자가 결제하고 즉시 강의를 볼 수 있다
- [ ] 구매하지 않은 사람은 영상에 접근할 수 없다
- [ ] 강의 추가가 DB 행 추가만으로 가능하다
- [ ] 법적 고지 페이지가 모두 존재한다
- [ ] 375px에서 어절 중간 잘림이 0건이다

---

## 🏗️ 아키텍처 결정

| 결정 | 근거 | 트레이드오프 |
|---|---|---|
| Next.js 15 App Router | 로그인·결제·관리자·대시보드가 모두 필요 → 결정 트리상 유일한 답 | 정적 사이트 대비 초기 복잡도 |
| Supabase + RLS | Auth·DB·Storage 통합, Next.js SSR 공식 지원 | 벤더 종속 |
| 카카오 로그인 (이메일 폴백) | 타겟에 시니어 포함 → 이메일+비번은 이탈 요인 | Kakao Developers 앱 등록 선행 필요 |
| 토스페이먼츠 단건결제 | 국내 표준, 스킬 고정 규칙 | 해외 결제 불가 |
| Vimeo 비공개 + 도메인 제한 | 유료 강의 영상 유출 방지 | 월 구독 비용 |
| 다중 강의 구조 | 1개로 시작하되 확장 시 코드 수정 불필요 | 초기 스키마가 약간 복잡 |
| 라이트 모드 전용 | 시니어 가독성 + 팔레트 1벌만 검증 | 다크 선호 사용자 미대응 |
| 가격을 `lib/config.ts`에 단일 정의 | 임시 가격이라 자주 바뀜 | — |

---

## 📦 시작 전 준비물

- [ ] GitHub App **쓰기 권한** (현재 읽기 전용 → 403)
- [ ] Supabase 계정 (보유) — **신규 프로젝트 생성 필요**
- [ ] Vercel 계정 (보유)
- [ ] Kakao Developers 앱 (로그인용)
- [ ] Vimeo 계정 (영상 호스팅)
- [ ] 토스페이먼츠 테스트 키 (공개 테스트키로 시작 가능)

### 외부 패키지
- next 15.x / react 19.x / typescript 5.x
- tailwindcss 4.x / shadcn-ui
- @supabase/supabase-js, @supabase/ssr
- @tosspayments/payment-sdk
- vitest, @playwright/test

---

## 🧪 테스트 전략

**전면 80% 커버리지를 강제하지 않는다.** 랜딩 UI까지 단위 테스트로 덮는 건 비용 대비 효과가 낮다.
대신 **돈과 접근권한이 걸린 로직만 엄격하게** 본다.

| 영역 | 방식 | 목표 |
|---|---|---|
| 결제 금액 검증 | Vitest 단위 | 90%+ — 위변조 시나리오 필수 |
| 수강권 판정 | Vitest 단위 | 90%+ |
| RLS 정책 | 통합 (anon 키로 실제 조회) | 테이블별 차단 증명 |
| 핵심 사용자 흐름 | Playwright E2E | 무료신청·결제·시청 3개 |
| UI 레이아웃 | Playwright 스크린샷 | 375/768/1440 |

---

## 🚀 단계별 계획

### Phase 1. 기반 구축
**목표**: 디자인 시스템이 적용된 빈 껍데기가 뜬다.

- [x] `create-next-app` (TypeScript, Tailwind, App Router) — Next 15.5.25 / React 19
- [x] shadcn/ui 초기화 — ⚠️ 방식 변경, 아래 Notes 참고
- [x] `app/globals.css`에 컬러 토큰 CSS 변수 정의 (+ Tailwind 4 `@theme` 연결)
- [x] 폰트 3종 로드 — Pretendard·JetBrains Mono 완료, ⚠️ Paperlogy는 파일 투입 대기
- [x] `word-break: keep-all` 전역 적용
- [x] 헤더·푸터 셸 (모바일 메뉴 포함)
- [x] `lib/config.ts` — 가격, 브랜드명, 연락처, 사업자정보 단일 정의
- [x] `.gitignore`에 `.env.local` 확인 — `.env*`로 이미 차단됨

**Quality Gate**
- [x] `npm run build` 성공 — 경고 0건
- [x] `npx tsc --noEmit` 통과
- [x] `npm run lint` 통과
- [x] 375px에서 헤더·푸터 정상 — `docs/screenshots/home-375.png`
- [x] 컬러·폰트가 하드코딩 없이 토큰으로만 참조됨 — `app/` `components/` `lib/`에 `#hex`·기본 팔레트 유틸 0건

추가로 확보한 것 (Phase 3 Quality Gate 선취):
- [x] 375/768/1440 스크린샷 — `docs/screenshots/`
- [x] 가로 스크롤 넘침 0px (3개 폭 전부)
- [x] 본문 18px, 링크·버튼 48px 이상 (자동 검사)
- [x] `npm run check:layout`으로 위 검사를 언제든 재현 가능

**롤백**: 디렉터리 삭제 후 재시작 (외부 상태 없음)

---

### Phase 2. DB + 인증
**목표**: 카카오로 로그인하면 `profiles`에 행이 생기고, 비인가 접근은 DB가 막는다.

- [ ] Supabase 신규 프로젝트 생성
- [ ] `.env.local`에 URL·anon key 저장 (**커밋 금지**)
- [ ] `lib/supabase/client.ts`, `lib/supabase/server.ts`
- [ ] 마이그레이션 작성: `profiles` `courses` `lessons` `orders` `enrollments` `leads` `reviews` `faqs`
- [ ] **RED**: anon 키로 `lessons` 조회가 차단되는지 검증하는 테스트 먼저 작성
- [ ] 전 테이블 RLS 활성화 + 기본 차단 후 필요한 정책만 추가
- [ ] 카카오 로그인 Provider 설정 (+ 이메일 로그인 폴백)
- [ ] `middleware.ts` 세션 갱신
- [ ] 시드 데이터: 강의 1개 + 차시 + FAQ + 샘플 후기

**Quality Gate**
- [ ] **anon 키로 `lessons.vimeo_id` 조회 시 차단됨을 테스트가 증명**
- [ ] 로그인 → 세션 유지 → 로그아웃 왕복 성공
- [ ] 로그인 시 `profiles` 행 자동 생성
- [ ] 마이그레이션에 역방향 SQL 포함

**롤백**: 역방향 마이그레이션 실행. 실사용자 데이터 없을 때만 안전.

---

### Phase 3. 공개 페이지
**목표**: 로그인 없이 볼 수 있는 모든 페이지가 완성된다.

섹션 순서 (결제 CTA보다 **무료 1강 CTA를 위에** 둔다):
`Hero → 이런 분을 위한 → 페인 해소 → 만들 결과물 → 커리큘럼 → 강사 → 샘플 후기 → 가격 → FAQ → 최종 CTA → Footer`

- [ ] `/` 랜딩 11섹션
- [ ] `/courses` 목록
- [ ] `/courses/[slug]` 상세
- [ ] `/legal/terms` `/privacy` `/refund`
- [ ] Footer 사업자정보 (`추후 입력` 자리표시)
- [ ] 한국어 카피 (PAS/AIDA, 영어 직역체 금지)
- [ ] 샘플 후기에 **`샘플 후기` 배지 + 섹션 상단 고지**
- [ ] 교체 지점에 `TODO:` 주석

**Quality Gate**
- [ ] 375/768/1440 스크린샷 확보
- [ ] **어절 중간 잘림 0건** (육안 확인)
- [ ] 본문 18px 이상, 터치영역 48px 이상
- [ ] 대비 WCAG AA 상회
- [ ] 헤딩 순서 h1→h2→h3 준수
- [ ] `prefers-reduced-motion` 존중
- [ ] 후기가 실제 후기로 오인될 여지 없음

---

### Phase 4. 무료 1강 퍼널
**목표**: 방문자가 무료 1강을 신청하고 시청한다. (사이트 최우선 전환 목표)

- [ ] `/free` 신청 폼 (이름·연락처 최소 수집)
- [ ] 개인정보 수집 동의 체크박스
- [ ] `leads` 저장 + 중복 신청 처리
- [ ] `/free/watch` — 신청자만 접근
- [ ] **RED**: 미신청자 직접 접근 차단 테스트 먼저

**Quality Gate**
- [ ] 신청 → `leads` 행 생성 확인
- [ ] **미신청자가 `/free/watch` 직접 접근 시 차단**
- [ ] 같은 사람 재신청 시 오류 없이 처리
- [ ] 폼 에러 메시지가 한국어이고 2행으로 어색하게 안 잘림

---

### Phase 5. 결제
**목표**: 실제로 돈을 받고 수강권이 생긴다. **가장 위험한 단계.**

- [ ] `/checkout/[slug]` — 약관·환불규정 동의 게이트
- [ ] 토스 결제 위젯 연동 (테스트키)
- [ ] **RED**: 클라이언트가 조작한 금액이 서버에서 거부되는 테스트 먼저
- [ ] `app/api/payments/confirm/route.ts` — **DB에서 가격 재조회 후 검증**
- [ ] 승인 성공 시 `orders` + `enrollments` 동시 생성 (트랜잭션)
- [ ] `/checkout/success` `/checkout/fail`

**Quality Gate**
- [ ] **금액 위변조 요청이 서버에서 거부됨 (테스트로 증명)**
- [ ] 테스트키 결제 성공 → `orders`·`enrollments` 둘 다 생성
- [ ] 결제 실패 경로에서 수강권이 생기지 않음
- [ ] 동의 없이 결제 버튼 진행 불가
- [ ] 토스 Secret Key가 클라이언트 번들에 없음

**롤백**: ⚠️ 실결제 데이터 존재 여부 먼저 확인. 있으면 롤백 대신 수정으로 대응.

---

### Phase 6. 내 강의실 + 관리자
**목표**: 구매자만 영상을 본다. 운영자가 주문을 확인한다.

- [ ] `/my` 내 강의 목록
- [ ] `/my/[courseSlug]/[lessonId]` 시청
- [ ] **서버에서 수강권 확인 후에만 Vimeo ID 반환**
- [ ] Vimeo 비공개 + 도메인 제한 설정
- [ ] `/admin` 주문·수강생·리드 조회, 환불 처리
- [ ] 관리자 판별 (`profiles.role`)

**Quality Gate**
- [ ] **미구매자 시청 접근 403**
- [ ] **Vimeo ID가 클라이언트 번들에 포함되지 않음을 직접 확인** (빌드 산출물 grep)
- [ ] 비관리자 `/admin` 접근 차단
- [ ] 환불 처리 시 수강권 회수

---

### Phase 7. SEO · 검증 · 배포
**목표**: 실제 주소에서 결제가 돈다.

- [ ] `metadata` (한국어 title/description)
- [ ] OG 이미지 1200x630
- [ ] `robots.txt`, `sitemap.xml`
- [ ] JSON-LD (Organization, Course)
- [ ] **시크릿 스캔**: `git ls-files | grep -E "\.env"` 결과 없음
- [ ] `git log -S "SUPABASE_SERVICE_ROLE_KEY"` / `-S "TOSS_SECRET_KEY"` 확인
- [ ] Vercel 환경변수 등록
- [ ] 배포 (사용자 승인 후)
- [ ] 실키 전환 후 소액 실결제 1건 테스트 → 취소

**Quality Gate**
- [ ] 추적 중인 `.env*` 파일 0건
- [ ] Lighthouse: 접근성 95+, SEO 100, 성능 90+
- [ ] 배포 URL에서 무료신청 → 결제 → 시청 전 흐름 성공
- [ ] anon 키로 민감 데이터 접근 불가 재확인
- [ ] 모바일 실기기 확인

---

## ⚠️ 리스크

| 리스크 | 확률 | 영향 | 대응 |
|---|---|---|---|
| 사업자·통신판매업 미등록 | 높음 | **치명** | 코드와 무관. 판매 개시 전 필수. 미등록 유료판매는 과태료 대상 |
| RLS 정책 구멍 | 중 | **치명** | Phase 2 Quality Gate로 증명. 개발 편의로도 비활성화 금지 |
| 토스 실키 전환 오류 | 중 | 높음 | Phase 7에서 소액 실결제 후 취소 |
| 카카오 앱 심사 지연 | 중 | 중 | 이메일 로그인 폴백 동시 구현 |
| Vimeo 링크 유출 | 낮음 | 중 | 도메인 제한 + 서버 사이드 ID (Phase 6 QG) |
| 샘플 후기 오인 | 중 | 중 | 배지·고지 필수, 오픈 전 교체 |

---

## 📈 진행 현황

| 단계 | 상태 | 완료일 |
|---|---|---|
| 1. 기반 구축 | ✅ 완료 | 2026-09-03 |
| 2. DB + 인증 | ⬜ 대기 | |
| 3. 공개 페이지 | ⬜ 대기 | |
| 4. 무료 1강 퍼널 | ⬜ 대기 | |
| 5. 결제 | ⬜ 대기 | |
| 6. 내 강의실 + 관리자 | ⬜ 대기 | |
| 7. SEO·검증·배포 | ⬜ 대기 | |

의존성: `1 → 2 → (3, 4 병렬 가능) → 5 → 6 → 7`

---

## 📝 Notes & 배운 점

- 2026-09-03: 인터뷰 6라운드 완료, 아키텍처·계획 승인. GitHub 쓰기 권한 403으로 구현 착수 보류.
- 2026-09-03: GitHub 쓰기 권한 확보 → **Phase 1 완료.** 아래는 계획과 달라진 점과 그 이유다.

### 1. shadcn/ui — CLI 대신 규약만 가져왔다
개발 환경의 네트워크 정책이 `ui.shadcn.com`을 막아서 `shadcn init`이 레지스트리를 못 받는다
(npm 레지스트리는 열려 있다). shadcn/ui는 본래 "코드를 복사해 내 저장소에 두는" 방식이므로,
의존성(`class-variance-authority` `clsx` `tailwind-merge` `@radix-ui/react-slot` `lucide-react`)만
npm으로 설치하고 `components.json` · `lib/utils.ts`의 `cn()` · `components/ui/button.tsx`를 직접 규약대로 작성했다.
→ 네트워크가 열린 환경에서는 `npx shadcn@latest add <컴포넌트>`가 그대로 동작한다.

### 2. 흰 글자를 코랄 버튼에 쓸 수 없다
`#FF5A1F` 위의 흰 글자는 대비가 **3.12:1**로 WCAG AA(4.5:1)에 미달한다.
잉크 글자(`#14110F`)는 **6.03:1**로 통과한다. 그래서 `--accent-fg`를 잉크로 뒀다.
타겟에 시니어가 포함되므로 여기서 타협하지 않는다. 되돌리면 접근성 기준이 깨진다.
같은 이유로 코랄은 크림 배경 위에서 **글자색으로 쓸 수 없다**(2.92:1). 배경색으로만 쓴다.
잉크 배경 위 액센트 글자는 밝은 `--ink-accent`(`#FF7A45`, 7.27:1)를 따로 뒀다.

### 3. Paperlogy는 저장소에 파일을 직접 넣어야 한다
npm에도, 구글 폰트에도 없다. 배포 CDN(jsDelivr)은 이 환경에서 막혀 있어 확인이 불가능했다.
죽은 CDN 주소를 심는 대신 **자체 호스팅 경로**(`public/fonts/paperlogy/Paperlogy-9Black.woff2`)로
`@font-face`를 잡고, 파일이 없으면 **Pretendard 900으로 자연 대체**되게 폴백을 걸었다.
지금도 헤드라인은 정상으로 보이고 배포도 막히지 않는다. 받는 방법은
`public/fonts/paperlogy/README.md`에 적어 뒀다. **오픈 전 처리 항목이다.**

### 4. Pretendard는 CDN이 아니라 자체 호스팅한다
`@fontsource/pretendard`는 굵기당 **766KB**(한글 전체)라 시니어·모바일 타겟에 너무 무겁다.
공식 `pretendard` 패키지의 동적 서브셋(굵기당 92조각)을 쓰면 브라우저가 실제로 쓰인 글자가 든
조각만(보통 수십 KB) 내려받는다. 다만 서브셋 파일이 굵기 3개 × 92개 = 276개라 커밋하면 저장소가 지저분해진다.
→ `scripts/setup-fonts.mjs`가 `prebuild`에서 `node_modules`에서 뽑아 `public/fonts/`에 생성하고,
그 산출물은 `.gitignore`에 넣었다. 버전은 `package-lock.json`에 고정되므로 결과는 항상 같다.

### 5. `html { font-size: 18px }`의 파급 효과
본문을 18px로 올리면 Tailwind의 모든 `rem` 값이 함께 12.5% 커진다.
덕분에 `h-11`(2.75rem)도 49.5px로 최소 터치영역 48px을 자동으로 넘는다.
간격을 손으로 키울 필요가 없다 — 대신 디자인 시 여백이 예상보다 넓게 나오는 걸 감안해야 한다.

### 6. 남겨둔 것
- `postcss` 취약점 경고 2건: `next` 내부 의존성이고 15.x 계열에 수정판이 없다
  (`npm audit fix --force`는 Next 16으로 올린다). 빌드 시점 의존성이므로 Phase 1에서는 두고,
  Phase 7 배포 점검 때 다시 본다.
- Playwright 1.62가 기대하는 Chromium 리비전과 이 환경에 설치된 리비전이 다르다.
  `CHROMIUM_PATH` 환경변수로 우회했다. Phase 3에서 E2E를 붙일 때 `playwright.config.ts`에 정리한다.
- 기존 정적 페이지(`김경옥의 AI 콘텐츠 실험실`)는 브랜드·미학이 모두 달라 `docs/legacy-index.html`로 보존만 했다.
