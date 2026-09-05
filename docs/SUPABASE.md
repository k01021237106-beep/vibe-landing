# Supabase 설정

## 프로젝트

| 항목 | 값 |
|---|---|
| 이름 | 첫배포 |
| 리전 | `ap-southeast-2` (시드니) |
| Postgres | 17 |

> ⚠️ **리전이 시드니다.** 이용자가 국내이므로 서울(`ap-northeast-2`)이었다면 왕복 지연이 100ms 남짓 짧다.
> 리전은 생성 후 바꿀 수 없고 새 프로젝트를 만들어 옮겨야 한다.
> 지금은 실사용자·결제 데이터가 없어 옮기는 비용이 가장 싸다 —
> 마이그레이션 파일을 새 프로젝트에 순서대로 다시 적용하면 끝난다.
> 오픈 후에는 주문 이력이 얽혀 훨씬 비싸진다. 옮길 거라면 지금이다.

## 환경변수

`.env.example`을 `.env.local`로 복사해 채운다. 값은 대시보드 → Project Settings → API.

```
NEXT_PUBLIC_SUPABASE_URL=https://<프로젝트ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

이 두 값은 브라우저에도 내려간다. **공개돼도 안전하다 — 단, RLS가 켜져 있는 동안만 그렇다.**
이 키로 할 수 있는 일은 전부 RLS 정책이 정하기 때문이다. RLS를 끄는 순간 이 키는
데이터베이스 전체 열쇠가 된다. 개발 편의로라도 끄지 않는다.

## 마이그레이션

`supabase/migrations/`에 순서대로 들어 있고, 짝이 되는 역방향 SQL이 `down/`에 있다.

| 파일 | 하는 일 |
|---|---|
| `20260903150000_initial_schema.sql` | 8개 테이블 + 가입 트리거 |
| `20260903150050_seed_data.sql` | 강의 1개·차시 8개·FAQ 6개·샘플 후기 4개 |
| `20260903150100_enable_rls.sql` | RLS 활성화 + 컬럼 단위 권한 |
| `20260903150200_harden_functions.sql` | 함수 `search_path` 고정, 트리거 함수 REST 노출 차단 |
| `20260904100000_payment_functions.sql` | 결제 승인·환불을 한 트랜잭션으로 묶는 함수 |

역방향은 개발 중 되돌릴 때만 쓴다. **실결제 데이터가 있으면 실행하지 않는다.**

```sql
-- 롤백 전 반드시 확인
select count(*) from public.orders where status = 'paid';
```

## 검증

```bash
SUPABASE_DB_URL="postgresql://postgres:<비밀번호>@db.<ref>.supabase.co:5432/postgres" npm run test:db
```

psql을 못 쓰면 `supabase/tests/*.sql`을 대시보드 SQL Editor에 붙여넣어도 된다.
검사용 데이터는 스크립트가 스스로 만들고 지운다.

| 파일 | 확인하는 것 |
|---|---|
| `rls.sql` | 13개 — vimeo_id 차단, 커리큘럼 공개, 개인정보 테이블 차단, 자기 승격 차단 |
| `auth_trigger.sql` | 6개 — 가입 시 프로필 생성, 카카오 메타데이터 매핑, 연쇄 삭제 |
| `free_funnel.sql` | 6개 — 신청 저장, 중복 신청(23505), 동의 강제, 명단 보호 |
| `payments.sql` | 8개 — 주문 금액 출처, 승인 트랜잭션, 중복 승인, 환불 시 수강권 회수 |
| `admin.sql` | 9개 — 남의 데이터 차단, 관리자 조회 허용, 자기 승격 차단 |

## 왜 컬럼 단위 권한을 쓰나

`lessons.vimeo_id`가 새면 유료 영상이 통째로 새어 나간다.

실제로 확인한 것:

```
RLS 켬 + `for select using (true)` 정책  →  anon이 vimeo_id 8건 전부 읽음
```

**RLS는 '행'을 거르지 '컬럼'을 가리지 못한다.** 커리큘럼(제목·길이)은 공개해야 하므로
행 자체는 열어야 하고, 그러면 같은 행의 `vimeo_id`도 따라 나온다.

그래서 `vimeo_id`는 컬럼 권한 자체를 주지 않는다:

```sql
grant select (id, course_id, position, title, summary,
              duration_seconds, is_free_preview, created_at, updated_at)
  on public.lessons to anon, authenticated;
```

정책을 잘못 써도 이 권한이 없으면 새지 않는다. **정책보다 아래에 있는 방어선이다.**
`service_role`만 읽을 수 있고, Phase 6에서 수강권을 확인한 뒤 서버가 넘긴다.

### 따라오는 제약

`select *`로 `lessons`를 조회하면 권한 오류가 난다. 컬럼을 명시해야 한다.

```ts
// ✗ 권한 오류
supabase.from("lessons").select("*")

// ✓
supabase.from("lessons").select("id, position, title, summary, duration_seconds, is_free_preview")
```

`leads`도 비슷하다. `anon`에게 `insert`만 주고 `select`는 주지 않았다 —
주면 누구나 신청자 이름·연락처를 긁어 갈 수 있다. 그래서 넣은 뒤 결과를 돌려받을 수 없다.

```ts
// ✗ 권한 오류
supabase.from("leads").insert(row).select()

// ✓
supabase.from("leads").insert(row)
```

## 권한 요약

| 테이블 | anon | 로그인 사용자 | 관리자 |
|---|---|---|---|
| `courses` | 공개된 것 조회 | 〃 | 전부 조회 |
| `lessons` | 공개 강의 차시 (**vimeo_id 제외**) | 〃 | 〃 |
| `reviews` `faqs` | 게시된 것 조회 | 〃 | 전부 조회 |
| `leads` | **삽입만** | 삽입만 | 전부 조회 |
| `profiles` | ✗ | 본인 행 조회·수정 (**role 제외**) | 전부 조회 |
| `orders` `enrollments` | ✗ | 본인 것 조회 | 전부 조회 |

쓰기는 `service_role`만 한다. 주문 금액을 클라이언트가 만들거나 고칠 수 없어야 하기 때문이다.

관리자 판별은 `public.is_admin()` 하나로 모은다. `profiles`를 정책에서 직접 참조하면
정책이 자기 자신을 다시 호출해 무한 재귀가 난다. `security definer`로 RLS를 우회하되
`search_path`를 고정했다.

## 카카오 로그인 — 대시보드에서 해야 할 일

코드는 준비돼 있다(`components/auth/login-form.tsx`). **아래 설정이 끝나야 실제로 동작한다.**

> 아래 절차는 Supabase 공식 문서(<https://supabase.com/docs/guides/auth/social-login/auth-kakao>)를
> 확인해 적었다. 카카오 쪽 화면 이름은 바뀔 수 있다.

### 1. Kakao Developers에서 앱 만들기

<https://developers.kakao.com> → **내 애플리케이션** → **애플리케이션 추가하기**
(앱 이름·회사명·카테고리를 채운다)

### 2. REST API 키와 Client Secret 챙기기

**앱 설정 → 앱 키**에 있는 **REST API 키** → Supabase의 `Client ID`가 된다.

같은 화면에서 **보안** 항목의 **Client Secret**을 만들고 **활성화**한다.
→ Supabase의 `Client Secret`이 된다. **활성화를 켜지 않으면 로그인이 실패한다.**

### 3. Redirect URI 등록 — 우리 사이트 주소가 아니다

**앱 설정 → 앱 키 → REST API 키 → 카카오 로그인 Redirect URI**에 넣는다.

```
https://jizcftnuciyfalymbrlu.supabase.co/auth/v1/callback
```

⚠️ 여기에 우리 사이트 주소(`.../auth/callback`)를 넣는 실수가 가장 흔하다.
카카오는 **Supabase**로 돌려보내고, Supabase가 다시 **우리 사이트**로 보낸다. 두 단계다.

### 4. 카카오 로그인 켜기 + 동의 항목

**제품 설정 → 카카오 로그인 → 일반**에서 **활성화 설정을 ON**으로.

**제품 설정 → 카카오 로그인 → 동의 항목**에서:

| 항목 | 설정 | 쓰이는 곳 |
|---|---|---|
| 닉네임 (`profile_nickname`) | 필수 동의 | `profiles.display_name` |
| 프로필 사진 (`profile_image`) | 선택 동의 | `profiles.avatar_url` |
| 카카오계정(이메일) (`account_email`) | **반드시 설정해야 한다** | 표시용 예비값 |

#### ⛔ 이메일 동의항목을 켜지 않으면 로그인이 아예 안 된다 (KOE205)

처음에 이 문서는 "이메일은 건드리지 않아도 된다"고 적었다. **틀렸다.**
그대로 설정했더니 카카오가 **KOE205**를 돌려줬다.

이유는 우리 코드가 아니라 **Supabase 쪽에 있다.**
Supabase Auth는 카카오에 보낼 scope를 **코드에 박아 두고 항상 세 개를 요청한다**
(`internal/api/provider/kakao.go`):

```go
oauthScopes := []string{
	"account_email",
	"profile_image",
	"profile_nickname",
}

if scopes != "" {
	oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
}
```

우리가 `signInWithOAuth`에 넘기는 scope는 **덧붙기만 하고 지우지 못한다.**
즉 `account_email`을 빼는 방법이 우리 코드에도, Supabase 대시보드에도 없다.
카카오 앱에 그 동의항목이 없으면 매번 KOE205다.

**`Allow users without an email`은 이 문제를 풀지 못한다.**
그 스위치(`EmailOptional`)는 "이메일 **없는 사용자를 만들어도 되는가**"를 정할 뿐,
"카카오에 이메일을 **요청할 것인가**"와는 다른 값이다.
카카오 동의 화면에 닿기도 전에 막히므로 그 스위치까지 갈 일이 없다.

→ **카카오 앱을 비즈 앱으로 전환해야 한다.**
`account_email` 동의항목은 비즈 앱에서만 열린다.
**앱 설정 → 앱 → 비즈니스 정보**를 채우면 전환할 수 있다.
(전환에 필요한 서류·요건은 카카오 화면에서 확인한다)

전환이 끝나면 동의항목에서 **카카오계정(이메일)**을 켠다.
필수 동의로 두면 이메일이 항상 들어오고, 선택 동의로 두면 비어 올 수 있다.
둘 다 우리 코드는 견딘다 — `profiles.email`은 널을 허용하고,
화면은 `display_name ?? email ?? "-"` 순서로 표시하므로 닉네임이 그 자리를 채운다.
**선택 동의로 두었다면** 5번의 `Allow users without an email`을 켠다.

### 5. Supabase에 키 넣기

**Authentication → Sign In / Providers → Kakao**

- **Kakao Enabled** 켜기
- `Client ID` ← REST API 키
- `Client Secret` ← 카카오에서 만든 Client Secret
- **`Allow users without an email`** — 이메일을 **선택 동의**로 두었다면 켠다.
  이메일을 주지 않은 손님도 가입되게 한다.
  ⚠️ 이 스위치는 KOE205와 무관하다. 위 4번을 참고.

### 6. 돌아올 주소 등록

**Authentication → URL Configuration**

- **Site URL**
  ```
  https://vibe-landing-tau.vercel.app
  ```
- **Redirect URLs** — 아래를 전부 추가한다. **끝의 `/**`를 빠뜨리면 안 된다.**
  ```
  http://localhost:3000/**
  https://vibe-landing-tau.vercel.app/**
  https://vibe-landing-*-melavyn.vercel.app/**
  ```

#### ⛔ `/auth/callback`으로 끝나게 적으면 로그인이 안 된다

처음에 이 문서는 `.../auth/callback`까지만 적으라고 했다. **틀렸다.**
그대로 등록했더니 메일 링크를 눌러도 첫 화면(`/?code=...`)으로 떨어졌다.
오류 화면도 없어서 원인을 찾기 어려웠다.

이유는 **와일드카드 규칙**이다. Supabase 문서의 표를 그대로 옮기면:

> `*` — 구분자가 아닌 문자들의 연속에 대응한다
> `**` — 모든 문자의 연속에 대응한다
> **URL의 구분자는 `.` 와 `/` 이다**
>
> `http://localhost:3000/*` 는 `/foo`·`/bar`에는 맞지만
> `/foo/bar`나 `/foo/`(끝의 빗금)에는 **맞지 않는다**

그리고 우리 로그인 폼은 돌아올 주소를 이렇게 만든다
(`components/auth/login-form.tsx`):

```ts
`${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`
```

**뒤에 `?next=...`가 붙는다.** 등록한 값이 `.../auth/callback`으로 끝나면
이 물음표 뒷부분 때문에 대응하지 않는다. 목록에 있는데도 거부된다.

거부되면 Supabase는 **오류를 내지 않고 Site URL로 대신 보낸다.**
그래서 첫 화면에 `?code=`만 남고 로그인이 끝나지 않는다.

→ 끝을 `/**`로 열어 둔다. Supabase 문서가 Vercel 미리보기에 권하는 형태이기도 하다.

#### 세 줄이 각각 하는 일

| 줄 | 쓰임 |
|---|---|
| `http://localhost:3000/**` | 내 컴퓨터에서 개발할 때 |
| `https://vibe-landing-tau.vercel.app/**` | 운영 주소 |
| `https://vibe-landing-*-melavyn.vercel.app/**` | 미리보기 — Vercel은 배포할 때마다 새 주소를 만든다 |

`*`는 `.`을 넘지 못하므로 `vibe-landing-*-melavyn.vercel.app`은
`vibe-landing-git-…-melavyn.vercel.app` 같은 **한 단계 호스트 이름**에만 맞는다.
남의 도메인으로 새어 나가지 않는다.

정식 도메인을 붙인 뒤에는 미리보기 줄을 지워도 된다.

### 7. 카카오 버튼 켜기

로그인 화면의 카카오 버튼은 기본적으로 **숨겨져 있다.**
비즈 앱 전환 전에는 눌러도 KOE205로 막히기 때문이다.

위 설정을 마치고 실제로 로그인이 되는 것을 확인한 뒤,
Vercel 환경변수에 아래를 넣고 재배포한다 (Preview·Production 각각):

```
NEXT_PUBLIC_KAKAO_LOGIN_ENABLED=1
```

로컬에서 시험하려면 `.env.local`에 같은 줄을 넣는다.
값이 없거나 `1`이 아니면 버튼은 나오지 않고 이메일 로그인만 보인다.

### 8. 확인

로그인을 한 번 해 본 뒤:

```sql
select p.id, p.email, p.display_name, p.role, i.provider
from public.profiles p
join auth.identities i on i.user_id = p.id;
```

`provider = 'kakao'` 행이 생기고 `display_name`에 닉네임이 들어 있으면 된 것이다.
`email`이 비어 있는 것은 정상이다 (4번 참고).

### 운영자를 관리자로 — 이메일이 없을 때

`docs/DEPLOY.md`의 승격 SQL은 이메일로 사람을 찾는다.
카카오로만 로그인했다면 이메일이 없으므로 **id로 찾는다**:

```sql
-- 먼저 누가 누구인지 본다
select id, display_name, email, created_at from public.profiles order by created_at;
-- 그 다음 id로 승격한다
update public.profiles set role = 'admin' where id = '위에서 고른 id';
```

### 이메일 로그인 (폴백)

별도 설정 없이 동작한다. 카카오 설정이 늦어져도 이메일 로그인으로
결제·수강이 막히지 않는다.

#### ⛔ 판매 시작 전에 SMTP를 반드시 연결한다

Supabase 기본 메일 발송기는 **써 보라고 주는 것**이지 운영용이 아니다.
공식 문서 그대로:

> The Supabase platform comes with a default email-sending service for you to try out.
> The service has a rate limit of N emails per hour, and **availability is on a
> best-effort basis. For production use, you should consider configuring a custom SMTP server.**

**실제로 걸렸다 (2026-09-05).** 테스트 중 세 통을 보내고 나니 막혔다:

```
2026-09-05T09:00:21Z  POST /otp  429
  error:      "429: email rate limit exceeded"
  error_code: "over_email_send_rate_limit"
```

로그인 링크가 곧 로그인 수단인 사이트에서 이건 **판매 중단과 같다.**
손님 열 명이 같은 시간대에 로그인하려 하면 뒤쪽은 메일을 못 받는다.
게다가 "best-effort"라 한도 안이어도 늦거나 안 올 수 있다.

**연결하는 곳:** Authentication → Emails → SMTP Settings

**고를 때 볼 것 — 국내 수신율이 가장 중요하다.**
네이버·다음·한메일로 잘 들어가는지가 관건이다.
아무리 싼 발송 서비스도 스팸함으로 가면 소용없다.
연결한 뒤 **네이버·다음·지메일 각각으로 실제 발송 시험**을 한다.

**보내는 주소는 우리 도메인이어야 한다.** 도메인을 사고 SPF·DKIM을 설정한다.
공짜 주소(gmail.com 등)로 보내면 대부분 스팸으로 분류된다.

> 도메인 구입 → SMTP 연결 → 수신율 시험. 이 순서는 시간이 걸린다.
> 판매 시작 직전에 시작하면 늦는다.

## 결제 함수

`complete_paid_order`와 `refund_order`는 **`security definer`이고 클라이언트에서 부를 수 없다.**
`anon`·`authenticated`의 실행 권한을 회수했고, 보안 어드바이저 목록에도 나타나지 않는다.

### 왜 데이터베이스 함수인가

주문을 '결제됨'으로 바꾸는 일과 수강권을 만드는 일은 **함께 성공하거나 함께 실패**해야 한다.
애플리케이션에서 두 번 호출하면 그 사이에 실패했을 때
"돈은 냈는데 강의를 못 보는" 상태가 남는다. 가장 나쁜 실패다.
supabase-js로는 여러 문장을 한 트랜잭션으로 묶을 수 없어 함수로 만들었다.

행을 `for update`로 잠그므로 같은 주문에 승인이 동시에 두 번 들어와도 한 번만 처리된다.
이미 `paid`인 주문은 아무것도 바꾸지 않고 기존 결과를 돌려준다 —
토스가 같은 승인을 두 번 보내거나 사용자가 완료 화면을 새로고침할 수 있기 때문이다.

## 관리자 만들기

관리자는 코드가 아니라 **데이터베이스에서** 정한다. 이메일 목록을 코드에 박아 두면
사람이 바뀔 때마다 배포해야 하고, 어디가 진짜 기준인지 흐려진다.

```sql
update public.profiles set role = 'admin'
where email = '운영자@example.com';
```

사용자가 스스로 이 값을 바꿀 수는 없다 — `profiles.role`의 update 컬럼 권한을
회수해 뒀다 (Phase 2). `supabase/tests/admin.sql`이 이를 검증한다.
