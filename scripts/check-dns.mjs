#!/usr/bin/env node
/**
 * 도메인 DNS 점검 — firstdeploy.kr
 *
 * 왜 이 검사가 있나 —
 * 등록업체 화면의 "저장됨"과 세상이 그 값을 보는 것은 다르다.
 * 그리고 레코드가 **있는 것**과 **동작하는 것**도 다르다.
 * CNAME은 껍데기라, 위임 너머까지 따라가야 메일이 실제로 나갈지 알 수 있다.
 *
 * 그래서 세 가지를 본다.
 *   1) 필요한 레코드가 다 있는가
 *   2) 오입력(도메인이 두 번 붙은 이름)이 만들어지지 않았는가
 *   3) CNAME 너머에서 SPF와 반송 MX가 실제로 나오는가
 *
 * 리졸버를 둘 쓰는 이유: 한쪽만 보이면 아직 퍼지는 중이라는 뜻이다.
 * 그 상태에서 발송 서비스의 인증 버튼을 누르면 실패하고 재시도 대기에 걸린다.
 *
 * ⚠️ HTTPS가 실제로 열리는지는 여기서 확인하지 않는다.
 *    작업 환경의 프록시가 막아 403이 오고, 인증서도 프록시 것이 보인다.
 *    "도메인이 열리는가"는 브라우저로 봐야 한다.
 *
 * 사용법: node scripts/check-dns.mjs
 */

import dns from "node:dns";

const DOMAIN = process.env.CHECK_DOMAIN ?? "firstdeploy.kr";

/** 있어야 하는 레코드. `required: false`는 없어도 실패로 치지 않는다. */
const EXPECTED = [
  { label: "Vercel 웹(뿌리)", type: "A", host: "", required: true },
  { label: "Vercel 웹(www)", type: "CNAME", host: "www", required: false },
  { label: "Resend DKIM", type: "TXT", host: "resend._domainkey.send", required: true },
  { label: "Resend SPF-a", type: "CNAME", host: "rsend.send", required: true },
  { label: "Resend SPF-b", type: "CNAME", host: "send.send", required: true },
  { label: "DMARC", type: "TXT", host: "_dmarc", required: true },
];

/** CNAME 위임이 끝까지 이어지는지 확인할 이름들. */
const DELEGATED = ["send.send", "rsend.send"];

const RESOLVERS = [
  ["구글", "8.8.8.8"],
  ["클라우드플레어", "1.1.1.1"],
];

const fqdn = (host) => (host ? `${host}.${DOMAIN}` : DOMAIN);

function resolverFor(ip) {
  const r = new dns.promises.Resolver();
  r.setServers([ip]);
  return r;
}

async function lookup(resolver, type, name) {
  switch (type) {
    case "A":
      return resolver.resolve4(name);
    case "CNAME":
      return resolver.resolveCname(name);
    case "TXT":
      return (await resolver.resolveTxt(name)).map((chunks) => chunks.join(""));
    case "MX":
      return (await resolver.resolveMx(name)).map((m) => `${m.priority} ${m.exchange}`);
    default:
      throw new Error(`알 수 없는 타입: ${type}`);
  }
}

const abbreviate = (value, max = 52) =>
  value.length > max ? `${value.slice(0, max)}…(총 ${value.length}자)` : value;

let failures = 0;
let warnings = 0;

console.log(`\n도메인 점검: ${DOMAIN}\n${"═".repeat(56)}`);

/* ── 1) 레코드가 있는가 — 리졸버 두 곳에 각각 묻는다 ── */
for (const [resolverName, ip] of RESOLVERS) {
  const resolver = resolverFor(ip);
  console.log(`\n【${resolverName} ${ip}】`);

  for (const { label, type, host, required } of EXPECTED) {
    const name = fqdn(host);
    try {
      const values = await lookup(resolver, type, name);
      console.log(`  ✅ ${label} (${type} ${name})`);
      for (const value of values) console.log(`       → ${abbreviate(value)}`);
    } catch (cause) {
      if (required) {
        failures += 1;
        console.log(`  ❌ ${label} (${type} ${name}) — ${cause.code}`);
      } else {
        warnings += 1;
        console.log(`  ⚠️  ${label} (${type} ${name}) — 아직 없음 [${cause.code}]`);
      }
    }
  }
}

/* ── 2) 오입력 — 등록업체 '호스트' 칸에 전체 도메인을 붙여넣으면 생긴다 ──
 *
 * 예: `send` 대신 `send.firstdeploy.kr`을 넣으면
 *     실제로는 send.firstdeploy.kr.firstdeploy.kr 이 만들어진다.
 *     오류도 안 나고 저장도 되는데 인증만 영원히 안 된다.
 */
console.log(`\n【오입력 검사 — 도메인이 두 번 붙은 이름】`);
{
  const resolver = resolverFor("8.8.8.8");
  for (const { host } of EXPECTED) {
    const name = `${fqdn(host)}.${DOMAIN}`;
    try {
      await resolver.resolveAny(name);
      failures += 1;
      console.log(`  ❌ 잘못 등록된 레코드가 있다: ${name}`);
    } catch {
      console.log(`  ✅ 없음: ${name}`);
    }
  }
}

/* ── 3) 위임이 실제로 동작하는가 ── */
console.log(`\n【CNAME 너머 — SPF와 반송 MX가 실제로 나오는가】`);
{
  const resolver = resolverFor("8.8.8.8");
  for (const host of DELEGATED) {
    const name = fqdn(host);
    console.log(`  ■ ${name}`);
    for (const type of ["TXT", "MX"]) {
      try {
        const values = await lookup(resolver, type, name);
        console.log(`     ✅ ${type}: ${values.map((v) => abbreviate(v)).join(" | ")}`);
      } catch (cause) {
        failures += 1;
        console.log(`     ❌ ${type}: ${cause.code}`);
      }
    }
  }
}

console.log(`\n${"═".repeat(56)}`);
if (failures > 0) {
  console.log(`❌ 문제 ${failures}건. 위 ❌ 줄을 보고 고친다.`);
  console.log(`   docs/RESUME_첫배포.md 의 DNS 표와 대조하면 빠르다.\n`);
  process.exit(1);
}
if (warnings > 0) {
  console.log(`✅ 필수 레코드는 모두 정상. 다만 아직 없는 것 ${warnings}건(⚠️)이 있다.\n`);
  process.exit(0);
}
console.log(`✅ 전부 정상.\n`);
