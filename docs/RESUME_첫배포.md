# 이어서 하기 — 현재 상태와 다음 단계

**마지막 갱신**: 2026-09-06
**작업 브랜치**: `claude/phase-1-basic-setup-1o3ztm`

> 이 문서 하나만 읽으면 어디까지 왔고 무엇부터 하면 되는지 알 수 있게 적는다.
> 화면 캡처를 다시 못 올리는 상황에서도 이어갈 수 있어야 한다.

---

## 한 줄 요약

도메인(`firstdeploy.kr`)을 사서 **메일 발송용 DNS와 웹 DNS를 모두 붙였다.**
남은 것은 `www` 레코드 하나, 그리고 **Supabase에 SMTP를 연결하고 수신 시험**을 하는 것이다.
사이트 공개(`main` 병합)는 아직 하지 않았다 — 사장님 결정이 필요하다.

---

## 1. 오늘(2026-09-06) 완료한 것

| 항목 | 상태 | 확인 방법 |
|---|---|---|
| `firstdeploy.kr` 도메인 구매 (가비아) | ✅ | My가비아 → 도메인 관리 |
| Resend에 `send.firstdeploy.kr` 추가 | ✅ | Resend → Domains |
| Resend 인증 | ✅ **Verified** | Resend → Domains 화면 초록색 |
| 가비아 DNS 레코드 5개 저장 | ✅ | 아래 표 · 공개 DNS로 검증함 |
| Vercel 도메인 연결 | ✅ **Valid Configuration** | Vercel → Settings → Domains |

### 등록된 DNS 레코드 (2026-09-06 검증됨)

구글(8.8.8.8)과 클라우드플레어(1.1.1.1) **양쪽에서 같은 값**으로 확인했다.

| # | 타입 | 호스트 | 값 | 쓰는 곳 |
|---|---|---|---|---|
| 1 | TXT | `resend._domainkey.send` | DKIM 공개키 (`p=MIGf…`, 218자) | Resend |
| 2 | CNAME | `rsend.send` | `rsend-apne1.forge.rmta.net` | Resend |
| 3 | CNAME | `send.send` | `send.forge.rmta.net` | Resend |
| 4 | TXT | `_dmarc` | `v=DMARC1; p=none;` | 메일 전반 |
| 5 | A | `@` | `216.198.79.1` | Vercel |
| 6 | CNAME | `www` | **← 아직 없음** | Vercel |

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

### 언제든 다시 확인하는 명령

```bash
npm run check:dns
```

---

## 2. 내일 할 일 — 순서대로

### ① `www` CNAME 추가 (5분)

지금 `www.firstdeploy.kr`은 **열리지 않는다.** 어르신 손님은 주소 앞에 `www`를
붙이는 습관이 있어서 실제로 손님을 잃는 구멍이다.

1. Vercel → 프로젝트 `vibe-landing` → **Settings → Domains**
2. `www.firstdeploy.kr`이 목록에 없으면 추가하고 **Redirect to firstdeploy.kr** 선택
3. Vercel이 보여 주는 CNAME 값을 가비아에 등록

| 칸 | 값 |
|---|---|
| 타입 | `CNAME` |
| 호스트 | `www` |
| 값/위치 | Vercel이 준 값 (`…vercel-dns.com` 형태) |
| TTL | `600` |

### ② 브라우저로 `https://firstdeploy.kr` 열어 보기

자물쇠(🔒)가 뜨면 성공이다.

⚠️ **내용은 예전 정적 페이지가 나온다. 고장이 아니다.**
Production이 아직 `main`(옛 페이지)이기 때문이고, ⑤에서 바뀐다.

> 이 확인은 사장님만 할 수 있다. 작업 환경에서는 프록시가 HTTPS를 막아
> 403이 오고, `openssl`로 보이는 인증서도 Vercel 것이 아니라 프록시 것이다.

### ③ Resend API 키 발급

Resend → 왼쪽 **API keys** → **Create API Key**

| 항목 | 선택 |
|---|---|
| Name | `supabase-auth` |
| Permission | **Sending access** (Full access 아님) |
| Domain | `send.firstdeploy.kr` |

**키는 만든 직후 한 번만 보인다.** 창을 닫으면 다시 못 본다. 바로 ④로 간다.
키 값은 사장님이 직접 붙여넣는다 — 대화에 붙여 넣지 않는다.

### ④ Supabase SMTP 연결

Supabase → **Authentication → Emails → SMTP Settings** → **Enable Custom SMTP**

| 칸 | 넣을 값 |
|---|---|
| Sender email | `hello@send.firstdeploy.kr` |
| Sender name | `첫배포` |
| Host | `smtp.resend.com` |
| Port | `465` (안 되면 `587`) |
| Username | `resend` ← 이 글자 그대로 |
| Password | ③에서 만든 API 키 |

⚠️ **Sender email의 도메인은 반드시 `send.firstdeploy.kr`.**
`hello@firstdeploy.kr`로 적으면 Resend가 거부한다 — 인증한 것은 `send` 쪽이다.

저장 후 **Authentication → Rate Limits** 에서 시간당 발송 수를 올린다.
2026-09-05에 `429 over_email_send_rate_limit`으로 막혔던 값이다.
자체 SMTP를 붙였으므로 이제 올려도 된다.

### ⑤ 수신 시험 — 여기서 진짜가 갈린다

미리보기 주소의 `/login`에서 **네이버 · 다음 · 지메일** 세 곳으로 각각
로그인 링크를 보낸다. (미리보기에서 한다. `main` 병합은 필요 없다.)

확인할 것:
- [ ] 받은편지함에 오는가, **스팸함**으로 가는가
- [ ] 발신자가 "첫배포"로 보이는가
- [ ] 링크를 눌러 `/my`까지 가는가

**스팸함으로 가면** AWS SES 서울 리전(`ap-northeast-2`)으로 옮기는 판단을 한다.
레코드만 바꾸면 되는 작업이다.

---

## 3. 그다음 — 공개 (사장님 결정 필요)

```
⑥ main 병합       → firstdeploy.kr이 진짜 판매 사이트가 된다
⑦ 주소 갱신        → NEXT_PUBLIC_SITE_URL · Supabase Site URL · Redirect URLs
                     → 재배포 (환경변수는 배포 시점에 구워진다)
⑧ 왕복 재확인      → 운영 도메인에서 로그인 · 결제
```

**⑥은 임의로 하지 않는다.** 병합하는 순간 공개되는데, 지금 그 페이지에는
**샘플 후기**와 **자리표시자 사업자정보**가 있고 **통신판매업 신고**도 안 된 상태다.
`robots.txt`가 첫 화면을 허용하고 있어 검색엔진에 잡힐 수 있다.
⑤까지 끝낸 뒤 따로 상의한다. 판매 전 남은 항목은
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
