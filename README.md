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
npm run dev          # http://localhost:3000
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
| `npm run check:layout` | 375/768/1440px 스크린샷 + 레이아웃 검사 |

`check:layout`은 `npm start`로 서버가 떠 있어야 한다.
Playwright가 내려받은 브라우저와 이 환경에 미리 설치된 브라우저가 다르면
`CHROMIUM_PATH=/opt/pw-browsers/chromium npm run check:layout`처럼 경로를 넘긴다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 15 App Router + TypeScript |
| 스타일 | Tailwind CSS 4 + shadcn/ui 규약 |
| DB·인증 | Supabase (Postgres + RLS) — *Phase 2* |
| 결제 | 토스페이먼츠 단건결제 — *Phase 5* |
| 영상 | Vimeo (비공개 + 도메인 제한) — *Phase 6* |
| 배포 | Vercel |

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
lib/
  config.ts           가격·브랜드·연락처·사업자정보 단일 정의
  utils.ts            cn() 헬퍼
scripts/
  setup-fonts.mjs     Pretendard 준비 (prebuild)
  check-layout.mjs    레이아웃 Quality Gate
docs/                 브리프·계획·스크린샷
```

### 값을 바꿀 때

가격·브랜드명·연락처·사업자정보는 **`lib/config.ts` 한 곳에만** 있다.
화면에 숫자나 상호를 직접 적지 않는다. 가격은 임시값이라 자주 바뀐다.

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
