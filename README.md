# 첫배포

코딩을 전혀 모르는 초보자에게 **바이브코딩 온라인 강의를 파는 사이트**.
소개 사이트가 아니라 결제까지 완결되는 커머스다.

```
유입 → 랜딩(설득) → 무료 1강 신청(경험) → 결제 → 내 강의실(수강)
```

- 프로젝트 브리프: [`docs/BRIEF_첫배포.md`](docs/BRIEF_첫배포.md)
- 실행 계획: [`docs/plans/PLAN_첫배포.md`](docs/plans/PLAN_첫배포.md)

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값을 채운다 (docs/SUPABASE.md 참고)
npm run dev                  # http://localhost:3000
```

`npm install` 뒤 처음 `dev`나 `build`를 돌리면 `scripts/setup-fonts.mjs`가
Pretendard 웹폰트를 `public/fonts/`에 자동으로 만든다. 이 산출물은 커밋하지 않는다.

## 명령어

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 (폰트 준비 자동 실행) |
| `npm start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |
| `npm run typecheck` | 타입 검사 |
| `npm run check:layout` | 전 페이지 스크린샷 + 레이아웃·접근성 검사 |
| `npm run check:bundle` | 클라이언트 번들에 서버 전용 값이 섞였는지 검사 |
| `npm test` | 단위 테스트 (연락처 정규화, 접근권 서명) |
| `npm run test:db` | RLS·가입 트리거·무료 퍼널 검증 (`SUPABASE_DB_URL` 필요) |

`check:layout`은 서버가 떠 있어야 한다(`npm run dev` 또는 `npm start`).
넘침·터치영역 48px·본문 글꼴·헤딩 순서(h1→h2→h3)·WCAG AA 대비를 자동으로 본다.
Playwright가 내려받은 브라우저와 이 환경에 미리 설치된 브라우저가 다르면
`CHROMIUM_PATH=/opt/pw-browsers/chromium npm run check:layout`처럼 경로를 넘긴다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 15 App Router + TypeScript |
| 스타일 | Tailwind CSS 4 + shadcn/ui 규약 |
| DB·인증 | Supabase (Postgres + RLS), 카카오 로그인 + 이메일 폴백 |
| 결제 | 토스페이먼츠 단건결제 — *Phase 5* |
| 영상 | Vimeo (비공개 + 도메인 제한) — *Phase 6* |
| 배포 | Vercel |

## 환경변수

`.env.example`을 `.env.local`로 복사해 채운다. `.env.local`은 커밋되지 않는다.

| 이름 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 주소 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공개용 키 — 할 수 있는 일은 RLS가 정한다 |
| `LEAD_ACCESS_SECRET` | 무료 1강 접근권 쿠키 서명 (서버 전용, 16자 이상) |
| `SUPABASE_SERVICE_ROLE_KEY` | 영상 주소·주문·수강권 (서버 전용, RLS 우회) |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 결제창 (공개돼도 되는 값) |
| `TOSS_SECRET_KEY` | 결제 승인 (서버 전용) |
| `USE_CONTENT_FIXTURES` | (선택) 데이터베이스에 닿지 못할 때 고정 데이터로 화면 확인 |

⚠️ `LEAD_ACCESS_SECRET`·`SUPABASE_SERVICE_ROLE_KEY`·`TOSS_SECRET_KEY`에는
`NEXT_PUBLIC_` 접두사를 붙이지 않는다. 붙이는 순간 브라우저로 나가고,
특히 토스 Secret Key가 나가면 결제를 임의로 승인할 수 있게 된다.

키가 없으면 결제 화면이 "준비 중"으로 표시되고 승인 API는 503과 한국어 안내를 돌려준다.
페이지가 깨지지는 않는다.

값이 없으면 시작 시점에 한국어 메시지와 함께 바로 멈춘다(`lib/env.ts`).
배포한 뒤 "로그인이 왜 안 되지"를 헤매는 것보다 낫다.

자세한 데이터베이스 설정과 **카카오 로그인 대시보드 설정**은
[`docs/SUPABASE.md`](docs/SUPABASE.md)를 본다.

## 디자인 시스템

라이트 모드 전용이다. 타겟에 중장년·시니어 초보자가 포함되므로
팔레트를 한 벌만 두고 대비를 확실하게 검증한다.

### 색

색은 **`app/globals.css`의 CSS 변수로만** 관리한다. 화면에서 `#hex`를 직접 쓰지 않는다.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | `#FBF7F0` | 따뜻한 크림 — 기본 배경 |
| `--fg` | `#14110F` | 잉크 블랙 — 기본 글자 (크림 위 17.6:1) |
| `--accent` | `#FF5A1F` | 코랄 오렌지 — CTA 전용 |
| `--accent-fg` | `#14110F` | 코랄 위에 올리는 글자 |
| `--muted` | `#5A524B` | 보조 글자 (크림 위 7.2:1) |
| `--ink` / `--ink-fg` | `#14110F` / `#FBF7F0` | 히어로·결제 구역 반전용 |
| `--ink-accent` | `#FF7A45` | 잉크 위 액센트 글자 (7.3:1) |

Tailwind에서는 `bg-bg` `text-fg` `bg-accent` `text-ink-muted`처럼 토큰 이름으로 쓴다.

> **코랄 버튼의 글자는 흰색이 아니라 잉크다.**
> 흰 글자를 `#FF5A1F` 위에 올리면 대비가 3.12:1로 WCAG AA(4.5:1)에 미달한다.
> 잉크 글자는 6.03:1로 통과한다. 되돌리지 말 것.

딥블랙 + 네온그린(개발자 툴 클리셰)은 의도적으로 피했다.
코딩을 못 하는 사람이 첫 화면에서 위축되지 않아야 한다.

### 글꼴

| 용도 | 폰트 | 어떻게 불러오나 |
|---|---|---|
| 헤드라인 | Paperlogy Black | `public/fonts/paperlogy/`에 직접 넣는다 → [안내](public/fonts/paperlogy/README.md) |
| 본문 | Pretendard 400/500 | npm 패키지에서 동적 서브셋 자체 호스팅 |
| 코드·숫자 | JetBrains Mono | `next/font/google` |

Pretendard는 굵기별 92개 서브셋으로 쪼개져 있어 브라우저가 **실제로 쓰인 글자가 든 조각만**
내려받는다. 외부 CDN에 의존하지 않으므로 CDN이 죽어도 본문이 살아 있다.

Paperlogy 파일이 아직 없으면 Pretendard 900으로 자연 대체된다. 배포를 막지 않는다.

### 접근성 기준

- 본문 기준 글꼴 **18px** (`html { font-size: 18px }` — Tailwind의 `rem` 값이 함께 커진다)
- 링크·버튼 최소 높이 **48px**
- 대비 **WCAG AA(4.5:1) 이상**, 대부분 AAA
- `word-break: keep-all` 전역 적용 — 한글이 어절 중간에서 잘리지 않는다
- `prefers-reduced-motion` 존중
- 본문 건너뛰기 링크

## 폴더 구조

```
app/                  라우트와 전역 스타일
components/
  layout/             헤더·푸터 셸
  brand/              로고
  ui/                 shadcn/ui 규약 컴포넌트
components/
  landing/            랜딩 섹션
  legal/              법적 고지 페이지 뼈대
lib/
  config.ts           브랜드·연락처·사업자정보·내비게이션
  content.ts          강의·차시·후기·FAQ 조회 (원본은 DB)
  phone.ts            연락처 정규화·신청 내용 검사 (순수 함수)
  free-access.ts      무료 1강 접근권 서명·검증
  free-lesson.ts      무료 1강 영상 주소 (자격 확인 후에만 호출)
  lessons/
    access.ts         시청 접근 판단 — 수강권 확인 전에 영상 주소를 읽지 않는다
    enrollment-query.ts  수강권 조회 (미들웨어·페이지가 함께 쓴다)
  admin/
    guard.ts          관리자 판별 (profiles.role)
  payments/
    confirm.ts        결제 승인 판단 — 금액 위변조를 막는 핵심
    orders.ts         주문 저장소 (가격을 DB에서 읽는다)
    toss.ts           토스 승인 API
    consent.ts        결제 전 필수 동의 검사
  fixtures/           개발용 고정 데이터
  env.ts              환경변수 접근 지점 (없으면 즉시 중단)
  utils.ts            cn() 헬퍼
  supabase/
    client.ts         브라우저용
    server.ts         서버 컴포넌트·라우트 핸들러용
    middleware.ts     세션 갱신
    admin.ts          서버 전용 (RLS 우회 — 쓰는 곳을 최소로)
    database.types.ts 스키마에서 생성 (직접 고치지 않는다)
supabase/
  migrations/         정방향 SQL (+ down/ 역방향)
  tests/              RLS·가입 트리거 검증
scripts/
  setup-fonts.mjs     Pretendard 준비 (prebuild)
  check-layout.mjs    레이아웃 Quality Gate
  test-db.sh          데이터베이스 검증 실행
docs/                 브리프·계획·Supabase 설정·스크린샷
```

### 값을 바꿀 때

| 무엇 | 어디 |
|---|---|
| 강의 제목·가격·커리큘럼·후기·FAQ | **데이터베이스** (`courses` `lessons` `reviews` `faqs`) |
| 브랜드명·연락처·사업자정보·내비게이션 | `lib/config.ts` |
| 랜딩 카피(히어로·페인 해소 등) | `components/landing/` |

가격을 `lib/config.ts`에 두지 않는 이유: 결제 승인 때 서버가 DB 값으로 금액을 재검증한다.
화면에 보이는 가격이 다른 곳에서 오면 표시가와 청구액이 어긋날 수 있다.
가격을 바꾸려면 `courses` 행을 고친다 — 배포가 필요 없다.

## 보안 원칙 (타협 불가)

- 결제 금액은 **서버가 DB에서 다시 조회해 검증**한다. 클라이언트가 보낸 금액을 믿지 않는다.
- Supabase Service Role Key와 토스 Secret Key는 **서버 전용**이다.
- **RLS를 끄지 않는다.** 개발 편의로도 끄지 않는다.
- `.env.local`은 커밋하지 않는다 (`.gitignore`의 `.env*`).
- Vimeo ID는 클라이언트 번들에 들어가지 않아야 한다.

## 오픈 전 반드시 확인

- [ ] **통신판매업 신고** — 미등록 상태의 유료 판매는 과태료 대상이다.
- [ ] **샘플 후기 교체** — 실제 후기로 바꾸거나 섹션을 내린다.
      샘플을 실제처럼 두고 오픈하면 표시광고법 위반이다.
- [ ] `lib/config.ts`의 `추후 입력` 값 전부 채우기
- [ ] 최종 가격 확정
- [ ] 카카오 로그인 대시보드 설정 ([`docs/SUPABASE.md`](docs/SUPABASE.md))
- [ ] `lessons.vimeo_id`를 실제 Vimeo ID로 교체 (비공개 + 도메인 제한 후)
- [ ] **법적 고지 3종을 전문가에게 검토받기** — 이용약관·개인정보처리방침·환불 규정은
      일반적인 사례를 참고한 초안이다. 검토 전에 판매를 시작하지 않는다.
- [ ] 법적 고지 3종의 시행일을 실제 날짜로 교체
- [ ] 강사 소개를 실제 이력·사진으로 교체 (`components/landing/instructor.tsx`)
- [ ] 개인정보처리방침의 처리위탁 표가 실제 사용 업체와 맞는지 확인
- [ ] **Vimeo 영상을 비공개 + 도메인 제한으로 설정** — iframe 주소는 페이지를
      볼 수 있는 사람에게 어차피 보인다. 우리 도메인 밖에서 재생되지 않게 막아야
      실제 보호가 된다.
- [ ] 운영자 계정을 관리자로 승격 (`update profiles set role='admin' where id=…`)
