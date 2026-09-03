#!/usr/bin/env bash
# 데이터베이스 검증 실행
#
#   SUPABASE_DB_URL="postgresql://postgres:<비밀번호>@db.<ref>.supabase.co:5432/postgres" \
#     npm run test:db
#
# 접속 문자열은 Supabase 대시보드 → Project Settings → Database → Connection string 에서 얻는다.
# ⚠️ 이 문자열에는 데이터베이스 비밀번호가 들어 있다. 파일에 적어 커밋하지 않는다.
#
# psql을 쓸 수 없는 환경이면 supabase/tests/*.sql을 대시보드 SQL Editor에 붙여넣어도 된다.
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL이 설정되지 않았습니다." >&2
  echo "대시보드 → Project Settings → Database → Connection string 에서 값을 가져오세요." >&2
  exit 1
fi

failed=0
for file in supabase/tests/*.sql; do
  echo ""
  echo "=== $file ==="
  # ON_ERROR_STOP: 검증 스크립트가 마지막에 던지는 예외를 실패로 잡는다
  if ! psql "$SUPABASE_DB_URL" --quiet --no-psqlrc -v ON_ERROR_STOP=1 -f "$file"; then
    failed=1
  fi
done

echo ""
if [[ $failed -ne 0 ]]; then
  echo "데이터베이스 검증 실패"
  exit 1
fi
echo "데이터베이스 검증 전부 통과"
