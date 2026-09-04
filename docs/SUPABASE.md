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

1. **Kakao Developers**(<https://developers.kakao.com>)에서 앱 생성
2. 카카오 로그인 활성화, 동의 항목에서 **닉네임**·**프로필 사진**·**이메일** 설정
   - 이메일은 검수 대상이다. 승인 전에는 이메일이 비어 올 수 있다 —
     `profiles` 생성 트리거가 이 경우도 처리한다.
3. **Redirect URI** 등록
   ```
   https://<프로젝트ref>.supabase.co/auth/v1/callback
   ```
4. **Supabase 대시보드 → Authentication → Providers → Kakao**
   - REST API 키 → `Client ID`
   - Client Secret (보안 → Client Secret 생성) → `Client Secret`
5. **Authentication → URL Configuration**
   - Site URL: 배포 주소
   - Redirect URLs에 추가:
     ```
     http://localhost:3000/auth/callback
     https://<배포주소>/auth/callback
     ```

이메일 로그인은 폴백이다. 별도 설정 없이 동작하지만 기본 메일 발송에는 한도가 있다.
실제 운영에서는 Authentication → Emails에서 SMTP를 연결한다.

카카오 심사가 늦어져도 이메일 로그인으로 결제·수강이 막히지 않는다.
