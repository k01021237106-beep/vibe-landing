#!/usr/bin/env bash
# 저장소에 비밀값이 들어갔는지 검사한다.
#
# 지금 파일만 보는 게 아니라 **커밋 이력 전체**를 본다.
# 한 번 커밋된 비밀값은 나중에 지워도 이력에 남아 있고, 그것으로 충분히 털린다.
#
# 실행: npm run check:secrets
set -uo pipefail

fail=0
note() { printf "  %s\n" "$1"; }
bad()  { fail=1; printf "  ✗ %s\n" "$1"; }
ok()   { printf "  ✓ %s\n" "$1"; }

echo "1. 추적 중인 .env 파일"
tracked=$(git ls-files | grep -E '(^|/)\.env' | grep -v '\.env\.example$' || true)
if [[ -n "$tracked" ]]; then
  bad "커밋된 .env 파일이 있습니다:"
  echo "$tracked" | sed 's/^/      /'
else
  ok "없음 (.env.example만 추적)"
fi

echo
echo "2. 커밋 이력에 비밀값 이름이 들어간 적이 있는지"
# -S는 그 문자열이 추가되거나 삭제된 커밋을 찾는다.
for key in SUPABASE_SERVICE_ROLE_KEY TOSS_SECRET_KEY LEAD_ACCESS_SECRET; do
  hits=$(git log --oneline -S "$key" -- . ':!*.example' ':!README.md' ':!docs/*' ':!scripts/check-secrets.sh' 2>/dev/null || true)
  if [[ -n "$hits" ]]; then
    note "$key — 이름이 등장한 커밋:"
    echo "$hits" | sed 's/^/      /'
    note "    (이름만인지 값까지인지 아래 3번에서 확인)"
  else
    ok "$key — 코드 밖 등장 없음"
  fi
done

echo
echo "3. 커밋 이력에 실제 키 형태의 값이 있는지"
patterns=(
  'eyJhbGciOiJIUzI1NiI'                 # Supabase JWT (anon/service_role)
  'sb_secret_[A-Za-z0-9_-]\{12,\}'      # Supabase secret key
  'sk_live_[A-Za-z0-9]\{12,\}'          # 토스 라이브 시크릿
  'sk_test_[A-Za-z0-9]\{12,\}'          # 토스 테스트 시크릿
  'postgresql://postgres:[^@[:space:]]\{8,\}@'  # DB 접속 문자열(비밀번호 포함)
)
names=("Supabase JWT" "Supabase secret key" "토스 라이브 시크릿" "토스 테스트 시크릿" "DB 접속 문자열")
for i in "${!patterns[@]}"; do
  found=$(git grep -I -n -E "${patterns[$i]}" $(git rev-list --all) 2>/dev/null | head -3 || true)
  if [[ -n "$found" ]]; then
    bad "${names[$i]} 형태의 값이 이력에 있습니다:"
    echo "$found" | sed 's/^/      /'
  else
    ok "${names[$i]} — 없음"
  fi
done

echo
echo "4. 현재 작업 트리"
worktree=$(grep -rIl -E 'eyJhbGciOiJIUzI1NiI|sk_(live|test)_[A-Za-z0-9]{12,}|sb_secret_' \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  --exclude='*.example' --exclude='check-secrets.sh' . 2>/dev/null || true)
if [[ -n "$worktree" ]]; then
  bad "비밀값 형태가 든 파일:"
  echo "$worktree" | sed 's/^/      /'
else
  ok "없음"
fi

echo
if [[ $fail -ne 0 ]]; then
  echo "시크릿 스캔 실패 — 위 항목을 처리하세요."
  echo "이미 커밋된 비밀값은 지우는 것만으로 부족합니다. 해당 키를 폐기(rotate)하세요."
  exit 1
fi
echo "시크릿 스캔 통과"
