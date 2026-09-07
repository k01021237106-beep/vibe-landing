# 이어서 하기 — 현재 상태와 다음 단계

**마지막 갱신**: 2026-09-07
**작업 브랜치**: `claude/phase-1-basic-setup-1o3ztm`

> 이 문서 하나만 읽으면 어디까지 왔고 무엇부터 하면 되는지 알 수 있게 적는다.
> 화면 캡처를 다시 못 올리는 상황에서도 이어갈 수 있어야 한다.

---

## 한 줄 요약

도메인(`firstdeploy.kr`)을 샀고, **우리 도메인으로 보낸 로그인 메일로 실제 로그인까지 됐다.**
남은 것은 **로그인 메일을 한국어로 바꾸는 것**과 **네이버·다음 수신 시험**이다.
사이트 공개(`main` 병합)는 아직 하지 않았다 — 사장님 결정이 필요하다.

---

## 1. 여기까지 완료한 것

| 항목 | 상태 | 확인 방법 |
|---|---|---|
| `firstdeploy.kr` 도메인 구매 (가비아) | ✅ | My가비아 → 도메인 관리 |
| Resend에 `send.firstdeploy.kr` 추가 | ✅ | Resend → Domains |
| Resend 인증 | ✅ **Verified** | Resend → Domains 화면 초록색 |
| 가비아 DNS 레코드 5개 저장 | ✅ | 아래 표 · 공개 DNS로 검증함 |
| Vercel 도메인 연결 | ✅ **Valid Configuration** | Vercel → Settings → Domains |
| 대표 주소(canonical) 확정 | ✅ `firstdeploy.kr` | 아래 '대표 주소' 참고 |
| HTTPS·리디렉션 실제 응답 | ✅ 2026-09-07 확인 | 아래 '대표 주소' 참고 |
| Resend API 키 + Supabase SMTP | ✅ | Supabase → Authentication → Emails |
| 지메일 수신 + 매직링크 로그인 | ✅ 2026-09-07 01:04 | 아래 '로그인 왕복' 참고 |
| 네이버·다음 수신 | ⬜ 아직 | ⑤ 참고 |

### 등록된 DNS 레코드 (2026-09-06 검증됨)

구글(8.8.8.8)과 클라우드플레어(1.1.1.1) **양쪽에서 같은 값**으로 확인했다.

| # | 타입 | 호스트 | 값 | 쓰는 곳 |
|---|---|---|---|---|
| 1 | TXT | `resend._domainkey.send` | DKIM 공개키 (`p=MIGf…`, 218자) | Resend |
| 2 | CNAME | `rsend.send` | `rsend-apne1.forge.rmta.net` | Resend |
| 3 | CNAME | `send.send` | `send.forge.rmta.net` | Resend |
| 4 | TXT | `_dmarc` | `v=DMARC1; p=none;` | 메일 전반 |
| 5 | A | `@` | `216.198.79.1` | Vercel |
| 6 | CNAME | `www` | `0b8aacd4a422c9ce.vercel-dns-017.com` | Vercel |

CNAME 위임 너머까지 따라가 실제로 동작하는 것도 확인했다:

```
send.send.firstdeploy.kr
  TXT → v=spf1 ip4:52.3.252.119 ip4:44.222.39.36 ip4:199.249.231.0/24 ~all
  MX  → 10 feedback.forge.rmta.net

rsend.send.firstdeploy.kr
  TXT → v=spf1 include:amazonses.com ~all
  MX  → 10 feedback-smtp.ap-northeast-1.amazonses.com
```

발송 리전은 **`ap-northeast-1`(도쿄)**. 미국 리전보다 네이버·다음 수신율이
유리한 자리다. 다만 이건 기대일 뿐이고, 실제 수신 시험 전까지 결론짓지 않는다.

### 대표 주소(canonical)는 `firstdeploy.kr`

```
www.firstdeploy.kr  →  308 Permanent  →  https://firstdeploy.kr/
firstdeploy.kr      →  바로 서비스 (리디렉션 없음)
```

Vercel이 `www`를 추가할 때 **반대 방향**(`firstdeploy.kr` → `www`)을 기본값으로 잡았고,
2026-09-07에 되돌렸다. 사장님이 화면을 보고 잡아 주셔서 공개 전에 고칠 수 있었다.

짧은 쪽을 대표로 둔 이유 — 손님이 어르신·중장년이다. 카카오톡으로 링크를 주고받고
전화로 주소를 불러 주는 일이 생긴다. 입에서 나오는 이름이 대표여야 한다.
`NEXT_PUBLIC_SITE_URL`, Supabase 등록 주소, `sitemap.xml`의 canonical,
공유 카드의 `og:url` — 앞으로 넣을 값이 전부 이 주소 기준이다.

> ⚠️ **방향을 바꿀 때는 순서가 있다.** 먼저 대표가 될 쪽의 리디렉션을 해제하고,
> 그다음 반대쪽에 리디렉션을 건다. 거꾸로 하면 서로를 가리켜 무한 반복이 되고
> 사이트가 열리지 않는다.

브라우저 없이 확인한 방법 (프록시가 `curl`을 막으므로):

```
Vercel MCP의 web_fetch_vercel_url 로 https://www.firstdeploy.kr/ 를 부른다
  → 308, location: https://firstdeploy.kr/     ← 방향 확인
  → strict-transport-security 응답                ← 인증서 정상 확인
https://firstdeploy.kr/robots.txt
  → 404  ← Production이 아직 옛 정적 페이지라는 뜻. 고장이 아니다.
```

### 언제든 다시 확인하는 명령

```bash
npm run check:dns
```

---

## 2. 다음에 할 일 — 순서대로

### ①② 도메인 연결 — ✅ 끝났다 (2026-09-07)

`www` CNAME 등록, 대표 주소 확정, HTTPS 인증서까지 실제 응답으로 확인했다.
위 '대표 주소' 절 참고. 더 할 일이 없다.

### ③④ Resend API 키 + Supabase SMTP — ✅ 끝났다 (2026-09-07)

현재 설정 (Supabase → Authentication → Emails → SMTP Settings):

| 칸 | 값 |
|---|---|
| Sender email | `hello@send.firstdeploy.kr` |
| Sender name | `첫배포` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` ← 계정명이 아니다. 이 다섯 글자 |
| Password | Resend API 키 (`supabase-auth`, Sending access) |

⚠️ **Supabase의 Site URL과 Redirect URLs는 아직 안 건드렸다.**
지금 `firstdeploy.kr`로 바꾸면 로그인 링크가 옛 정적 페이지로 가서 로그인이 통째로 막힌다.
그 작업은 `main` 병합(⑦⑧)과 **같이** 해야 한다.

#### 로그인 왕복 — 우리 도메인 메일로 확인됨

```
last_sign_in_at   2026-09-07 01:04:13.651820+00
세션 생성          2026-09-07 01:04:13.653025+00   차이 2밀리초
```

시험 직전에 세션 0건·토큰 0건인 것을 확인하고 시작했으므로,
이 세션은 **매직 링크가 새로 만든 것**이 맞다. 갱신이 아니다.

> ⚠️ **로그인 시험은 반드시 세션 0건에서 시작한다.**
> 살아 있는 세션이 있으면 교환이 실패해도 `/login`이 `/my`로 보내 버려
> 성공처럼 보인다. 2026-09-07에 두 번 그렇게 속았다 (Notes 43 참고).
>
> ```sql
> select count(*) from auth.sessions;   -- 0이어야 한다
> ```

### ⑤ 로그인 메일을 한국어로

지금은 **Supabase 기본 영문 템플릿**이다. 본문에 "Sign in"만 있다.
코딩을 모르는 어르신 손님에게 영문 메일은 그 자체가 장벽이다.
Supabase → Authentication → Emails → **Magic Link** 템플릿을 고친다.

### ⑥ 네이버 · 다음 수신 시험

미리보기 주소의 `/login`에서 각각 로그인 링크를 보낸다.
(미리보기에서 한다. `main` 병합은 필요 없다.)

⚠️ **새 주소로 보내면 계정이 새로 생긴다** (`shouldCreateUser` 기본값 `true`).
시험 뒤 정리하면 된다.

확인할 것:
- [ ] 받은편지함에 오는가, **스팸함**으로 가는가
- [ ] 발신자가 "첫배포"로 보이는가
- [ ] 링크를 눌러 `/my`까지 가는가

> 지메일에서는 메일을 열고 ⋮ → **원본 보기** 로 SPF·DKIM·DMARC가
> 모두 PASS인지 볼 수 있다. 네이버도 비슷한 기능이 있다.

**스팸함으로 가면** AWS SES 서울 리전(`ap-northeast-2`)으로 옮기는 판단을 한다.
레코드만 바꾸면 되는 작업이다.

---

## 3. 그다음 — 공개 (사장님 결정 필요)

```
⑦ main 병합       → firstdeploy.kr이 진짜 판매 사이트가 된다
⑧ 주소 갱신        → NEXT_PUBLIC_SITE_URL · Supabase Site URL · Redirect URLs
                     → 재배포 (환경변수는 배포 시점에 구워진다)
⑨ 왕복 재확인      → 운영 도메인에서 로그인 · 결제
```

**⑦은 임의로 하지 않는다.** 병합하는 순간 공개되는데, 지금 그 페이지에는
**샘플 후기**와 **자리표시자 사업자정보**가 있고 **통신판매업 신고**도 안 된 상태다.
`robots.txt`가 첫 화면을 허용하고 있어 검색엔진에 잡힐 수 있다.
⑥까지 끝낸 뒤 따로 상의한다. 판매 전 남은 항목은
[`docs/DEPLOY.md`](DEPLOY.md)의 '7. 판매 시작 전'에 있다.

---

## 4. 🚫 하지 말 것

- **네임서버를 Vercel이나 Cloudflare로 옮기지 않는다.**
  옮기면 위 메일 레코드 4개가 통째로 무효가 된다.
  Vercel 화면에 네임서버 변경 안내가 보여도 따르지 않는다 — A/CNAME 방식으로 간다.
- **Resend 레코드 4개를 건드리지 않는다.** 특히 `_dmarc` —
  이것만 뿌리에 있어서 "정리한다고" 지우기 쉽다.
- **가비아 '호스트' 칸에 전체 도메인을 붙여넣지 않는다.**
  `send.firstdeploy.kr` → `send` 만 넣는다. 전체를 넣으면
  `send.firstdeploy.kr.firstdeploy.kr`이 만들어지고, 오류 없이 조용히 실패한다.
- **바깥 서비스 설정은 기억이 아니라 그 화면을 따른다.**
  오늘 SPF를 TXT로 넣으라고 안내했다가 틀렸다 —
  Resend는 현재 SPF 자리에 CNAME 2개를 준다.

---

## 5. 아직 열려 있는 다른 항목

| 항목 | 상태 |
|---|---|
| 카카오 로그인 | 비즈 앱 전환 대기. `NEXT_PUBLIC_KAKAO_LOGIN_ENABLED` 기본 꺼짐 |
| Vimeo 영상 | 촬영 전. `TODO-VIMEO-ID-01`~`08` 자리표시자 |
| PageSpeed 측정 | 보류 (분석이 멈춰 결과가 안 나옴) |
| `sk-live-` 키 폐기 | 어느 서비스 키인지 확인해 그쪽에서 폐기 필요 |
| Supabase 리전 | `ap-southeast-2`(시드니). 서울이 아님 — 지금 할 일은 아님 |
| `orders.refunded_at` | 컬럼 없음. 환불 시각이 `updated_at`으로만 남음 |

---

## 6. 참고 문서

- [`docs/DEPLOY.md`](DEPLOY.md) — 배포·환경변수·도메인과 DNS·판매 전 점검
- [`docs/SUPABASE.md`](SUPABASE.md) — 인증·RLS·이메일 로그인·카카오 KOE205
- [`docs/plans/PLAN_첫배포.md`](plans/PLAN_첫배포.md) — 전체 계획과 Notes(배운 점)
