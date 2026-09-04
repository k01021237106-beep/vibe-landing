# 배포 절차

> ⚠️ **환경변수는 이 저장소에 넣지 않는다.** Vercel 대시보드에서 입력한다.
> 저장소에 넣으면 커밋되고, 한 번 커밋된 비밀값은 지워도 이력에 남는다.

## 현재 상태 (2026-09-04 확인)

| 항목 | 상태 |
|---|---|
| Vercel 프로젝트 | `melavyn/vibe-landing` — **이미 GitHub 저장소에 연결됨** |
| 자동 배포 | 푸시할 때마다 동작 중 |
| 운영 배포 | 아직 옛날 정적 페이지 (`main` 브랜치) |
| 환경변수 | **입력 완료** — 6개 × (Preview, Production) = 12줄 |
| 최근 빌드 | 환경변수 오류는 통과. 미들웨어 배포에서 실패 → 아래 참고 |
| 배포 보호 | **켜짐** (Vercel 로그인해야 볼 수 있음) |

### 지나온 실패 두 가지

**1) 환경변수 없음 (해결됨)**

```
✓ Compiled successfully in 14.5s
Error: 환경변수 NEXT_PUBLIC_SUPABASE_URL이(가) 없습니다.
```

우리가 의도한 것이었다 — 값이 없으면 화면이 이상하게 동작하는 대신
빌드 단계에서 바로 멈춘다 (`lib/env.ts`). 값을 넣자 이 지점은 통과했다.

**2) 미들웨어를 Vercel이 못 싣는다**

```
Build Completed in /vercel/output [58s]
Deploying outputs...
The Edge Function "middleware" is referencing unsupported modules:
	- __vc__ns__/0/middleware.js: @/lib/supabase/middleware
```

빌드는 전부 성공한 뒤(22개 페이지 생성까지 끝났다) **출력물을 올리는 단계**에서 멈췄다.
Vercel 쪽 오류 코드는 `NOW_SANDBOX_WORKER_EDGE_FUNCTION_UNSUPPORTED_MODULES`다.
빌드 로그의 마지막 줄만 보면 "빌드 완료"라서 성공한 줄 알기 쉽다 —
**배포 상태(state)를 따로 봐야 한다.**

문제가 되는 이름 `@/lib/supabase/middleware`는 저장소 뿌리 `middleware.ts`의
**유일한 `@/` 별칭 import**다. `@/`는 `tsconfig.json`의 `paths`가 정하는 우리 규약이고,
Next는 이것을 풀지만 Vercel이 뿌리의 `middleware.ts`를 자기 방식으로 번들할 때는 풀지 못한다.
(`__vc__ns__`는 Next의 산출물 이름이 아니다.)

Next가 만든 산출물 자체에는 문제가 없다는 것을 직접 확인했다 —
Turbopack 빌드와 기본 빌드 모두, 미들웨어 번들이 바깥을 참조하는 모듈은
`node:async_hooks`·`node:buffer` 둘뿐이고 둘 다 지원되는 모듈이다.
`@/lib/supabase/middleware`라는 문자열은 소스맵에만 있고 실제 코드에는 없다.
실제로 `--turbopack`을 빼고 다시 배포해 봤지만 **같은 오류가 그대로 났다.**
빌드 도구는 원인이 아니었다.

그래서 두 가지를 고쳤다:

1. `vercel.json`에 `"framework": "nextjs"`를 명시했다.
   프로젝트가 옛날 정적 페이지 시절에 만들어져 프레임워크 설정이 비어 있었다(`framework: null`).
   Next 프로젝트임을 알려 주면 미들웨어도 Next 쪽 경로로 처리된다.
2. 뿌리 `middleware.ts`의 import를 상대 경로로 바꿨다.
   누가 번들하든 풀리는 경로여야 한다.

> 뿌리 `middleware.ts`에서는 앞으로도 `@/` 별칭을 쓰지 않는다. 파일에 주석으로 적어 뒀다.

### 바로 가는 링크

- 환경변수: <https://vercel.com/melavyn/vibe-landing/settings/environment-variables>
- 배포 보호: <https://vercel.com/melavyn/vibe-landing/settings/deployment-protection>
- 배포 목록: <https://vercel.com/melavyn/vibe-landing/deployments>

---

## 1. Vercel에 넣을 환경변수

Vercel → 프로젝트 → **Settings → Environment Variables**

키 값은 대시보드 입력창에 직접 붙여넣는다. 이름은 아래 표에서 복사한다.

> ⚠️ **화면에서 환경은 한 번에 하나만 선택된다** (2026-09-04 실제 확인).
> Production을 체크한 뒤 Preview를 체크하면 Production 체크가 풀린다.
>
> 따라서 **한 변수를 두 환경에 넣으려면 같은 Key/Value를 두 번 저장한다.**
> Preview로 한 번, Production으로 한 번. 목록에 같은 이름이 2줄 생기는 것이 정상이다.
>
> 창 아래의 **"Add new variable"은 누르지 않는다** — 그건 *다른* 변수를
> 여러 개 한꺼번에 추가하는 버튼이지, 같은 변수를 환경별로 나누는 버튼이 아니다.
>
> 값을 나중에 바꿀 때는 **두 줄 다** 고쳐야 한다. 한쪽만 고치면
> 미리보기와 운영이 서로 다른 값으로 돌아간다.
>
> 터미널을 쓰면 한 번에 두 환경을 고를 수 있다 (스페이스바로 복수 선택):
> ```bash
> npx vercel login && npx vercel link
> npx vercel env add NEXT_PUBLIC_SUPABASE_URL
> ```

| 이름 | 어디서 얻나 | 공개 여부 | 적용 환경 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 이미 알고 있음 (아래 참고) | 브라우저로 나감 | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 이미 알고 있음 (아래 참고) | 브라우저로 나감 | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` | **서버 전용** | Production + Preview |
| `LEAD_ACCESS_SECRET` | 직접 생성 (아래 명령) | **서버 전용** | Production + Preview |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 개발자센터 → API 키 → Client Key | 브라우저로 나감 | Production + Preview |
| `TOSS_SECRET_KEY` | 토스 개발자센터 → API 키 → Secret Key | **서버 전용** | Production + Preview |

변수 6개 × 환경 2개 = **저장 12번**. 다 넣으면 `vercel env ls`에 12줄이 보인다.

`NEXT_PUBLIC_SITE_URL`은 넣지 않아도 된다. Vercel이 `VERCEL_PROJECT_PRODUCTION_URL`을
자동으로 넣어 주고 코드가 그것을 받는다. 나중에 직접 산 도메인을 쓰게 되면 그때 넣는다.

### 이미 알고 있는 값

비밀이 아니므로 여기 적어 둔다. 이 두 값으로 할 수 있는 일은 전부 RLS 정책이 정한다.

```
NEXT_PUBLIC_SUPABASE_URL=https://jizcftnuciyfalymbrlu.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_pmZ2iZv18q2Ozs4B-zD3oQ_2GXAgg2q
```

### `LEAD_ACCESS_SECRET` 생성

무료 1강 접근권 쿠키에 서명하는 값이다. 아무 문자열이나 쓰지 말고 임의값을 만든다.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

출력된 값을 Vercel에 붙여넣는다. **이 값을 바꾸면 이미 발급된 접근권이 전부 무효가 된다** —
무료 1강을 신청했던 사람들이 다시 신청해야 하므로, 한 번 정하면 바꾸지 않는다.

### ⚠️ 가장 위험한 실수

**서버 전용 키에 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.**

붙이는 순간 그 값이 브라우저로 나간다. 특히 `TOSS_SECRET_KEY`가 나가면
누구나 결제를 임의로 승인할 수 있게 된다. `SUPABASE_SERVICE_ROLE_KEY`가 나가면
RLS가 통째로 무력화된다.

---

## 2. 넣은 뒤 확인

```bash
vercel env pull .env.vercel     # Vercel에 넣은 값을 받아온다
ENV_FILE=.env.vercel npm run check:env
rm .env.vercel                  # 확인이 끝나면 지운다
```

`check:env`가 보는 것 (값 자체는 출력하지 않는다):

- 값이 비어 있지 않은지
- 따옴표나 공백이 딸려 오지 않았는지
- Client Key와 Secret Key를 바꿔 넣지 않았는지
- 테스트 키와 라이브 키를 섞지 않았는지
- **서버 전용 키에 `NEXT_PUBLIC_`이 붙지 않았는지**

---

## 3. 대시보드에서 해야 할 나머지 설정

코드로 할 수 없는 것들이다. 배포 주소가 정해진 뒤에 한다.

### 카카오 로그인

자세한 순서는 [`docs/SUPABASE.md`](SUPABASE.md)에 있다. 요약:

1. Kakao Developers에서 앱 생성, 카카오 로그인 활성화
2. Redirect URI 등록: `https://jizcftnuciyfalymbrlu.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Kakao에 REST API 키와 Client Secret 입력
4. Supabase → Authentication → URL Configuration
   - Site URL: 배포 주소
   - Redirect URLs에 `https://<배포주소>/auth/callback` 추가

### Vimeo

1. 영상을 **비공개**로 올린다
2. 재생 허용 도메인에 배포 주소를 넣는다
3. `lessons.vimeo_id`를 실제 ID로 바꾼다 (지금은 `TODO-VIMEO-ID-01` 자리표시)

```sql
update public.lessons set vimeo_id = '실제ID' where position = 1;
```

> 도메인 제한을 걸지 않으면 지금까지 만든 접근 통제가 한 겹 얇아진다.
> iframe 주소는 페이지를 볼 수 있는 사람에게 어차피 보이므로,
> 그 주소를 다른 곳에 붙여도 재생되지 않게 막는 것은 Vimeo만 할 수 있다.

### 운영자를 관리자로

```sql
update public.profiles set role = 'admin' where email = '운영자@example.com';
```

한 번 로그인해서 `profiles` 행이 만들어진 뒤에 실행한다.

---

## 4. 배포 보호 — 오픈 전 반드시 확인

지금은 **Vercel Authentication이 켜져 있다.** Vercel 계정으로 로그인해야 사이트가 보인다.

준비하는 동안은 이게 안전하다 — 설정이 덜 된 사이트가 검색에 잡히거나
남에게 보이지 않는다. 하지만 **판매를 시작하기 전에는 반드시 꺼야 한다.**

켜진 채로 두면:

- 손님이 사이트에 들어올 수 없다
- 카카오 로그인이 돌아올 곳에서 막힌다
- **토스 결제가 끝난 뒤 돌아오는 주소에서 막힌다** — 돈만 빠져나간 상태가 된다
- 검색엔진이 색인하지 못한다

끄는 곳: Settings → Deployment Protection → Vercel Authentication → Disabled

> 순서가 중요하다. 환경변수 → 카카오·Vimeo 설정 → 결제 테스트까지
> 보호를 켠 채로 마치고, 마지막에 끈다.

---

## 5. 배포

Vercel이 GitHub 저장소를 연결하면 푸시할 때마다 자동으로 배포한다.

### 미리보기와 운영

| 브랜치 | 배포 | 주소 |
|---|---|---|
| `claude/phase-1-basic-setup-1o3ztm` (작업 브랜치) | 미리보기 | `vibe-landing-git-claude-...vercel.app` |
| `main` (운영 브랜치) | **운영** | `vibe-landing.vercel.app` |

지금까지의 작업은 전부 작업 브랜치에 있고, 운영 주소에는 아직 옛날 페이지가 떠 있다.

권하는 순서:

1. 환경변수를 넣는다 → 작업 브랜치 미리보기가 성공하는지 본다
2. 미리보기에서 카카오 로그인·결제 테스트까지 마친다
3. 다 되면 `main`에 병합한다 → 그때 운영 주소가 바뀐다

미리보기에서 먼저 확인하면, 잘못돼도 운영 주소는 그대로다.

배포 후 확인할 것:

```bash
# 성능 점수는 배포된 주소에서만 의미가 있다 (개발 서버는 압축이 꺼져 있다)
npx lighthouse https://<배포주소>/ --only-categories=performance,accessibility,seo,best-practices --view
```

목표: 접근성 95+, SEO 100, 성능 90+

---

## 6. 결제 테스트

**테스트 키로 먼저 한다.** 실제 돈이 오가지 않는다.

1. 카카오 또는 이메일로 로그인
2. `/checkout/first-deploy-vibecoding` → 약관·환불 규정 동의 → 결제
3. 토스 테스트 카드로 결제
4. 확인:
   - `orders`에 `status='paid'` 행이 생겼는지
   - `enrollments`에 `status='active'` 행이 생겼는지
   - `/my`에서 강의가 보이는지
   - `/my/{강의}/{차시}`에서 영상이 재생되는지

```sql
select o.order_code, o.amount, o.status, e.status as enrollment
from public.orders o
left join public.enrollments e on e.order_id = o.id
order by o.created_at desc limit 5;
```

### 금액 위변조 확인 (선택)

결제창에서 개발자 도구로 금액을 바꿔 본다. 서버가 거부해야 한다.
단위 테스트로 이미 증명했지만(`lib/payments/confirm.test.ts`), 실물로 한 번 보면 확실하다.

### 라이브 키 전환

테스트가 끝나면 Vercel의 토스 키를 라이브 키로 바꾸고,
**소액(예: 1,000원)으로 실제 결제 1건을 한 뒤 취소한다.**
관리자 화면의 환불 버튼으로 수강권이 회수되는지도 함께 확인한다.

> 라이브 전환 전에 강의 가격을 최종 확정한다. `courses` 행만 고치면 되고 배포는 필요 없다.

---

## 7. 판매 시작 전 (법적 준비)

코드와 무관하지만 이것들이 안 되면 판매를 시작하면 안 된다.

- [ ] **통신판매업 신고** — 미등록 유료 판매는 과태료 대상이다
- [ ] **법적 고지 3종 전문가 검토** — 이용약관·개인정보처리방침·환불 규정은 초안이다
- [ ] 법적 고지 3종의 시행일을 실제 날짜로 교체
- [ ] **샘플 후기 교체 또는 섹션 내리기** — 샘플을 실제처럼 두면 표시광고법 위반이다
- [ ] `lib/config.ts`의 `business` 값(상호·대표자·사업자등록번호 등) 채우기
- [ ] `contact` 값(카카오톡 채널 주소, 이메일) 채우기
- [ ] 강사 소개를 실제 이력·사진으로 교체 (`components/landing/instructor.tsx`)
- [ ] 개인정보처리방침의 처리위탁 표가 실제 사용 업체와 맞는지 확인
- [ ] **Vercel Authentication 끄기** (4번 참고) — 켜져 있으면 손님이 못 들어온다

---

## 키를 잃어버렸거나 새어 나갔다면

1. **즉시 폐기(rotate)한다.** 지우는 것만으로는 부족하다.
   - Supabase: Settings → API → service_role 키 재발급
   - 토스: 개발자센터에서 Secret Key 재발급
   - `LEAD_ACCESS_SECRET`: 새 값 생성 (기존 접근권은 전부 무효가 된다)
2. Vercel 환경변수를 새 값으로 바꾼다
3. `npm run check:secrets`로 저장소 이력에 값이 남지 않았는지 확인한다
