#!/bin/bash
# SessionStart hook — wonhp1/claude-skills 의 스킬을 전역 스킬(~/.claude/skills)로 설치한다.
# Claude Code on the web 컨테이너는 세션마다 초기화되므로 매 세션 시작 시 다시 설치한다.
# 로컬 머신에서는 이미 설치된 전역 스킬을 덮어쓰지 않도록 건너뛴다.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO_URL="https://github.com/wonhp1/claude-skills.git"
SKILLS=(homepage-builder-kr feature-planner)
DEST="${HOME}/.claude/skills"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if ! git clone --depth 1 --quiet "$REPO_URL" "$TMP/claude-skills" 2>/dev/null; then
  echo "install-global-skills: $REPO_URL 클론 실패 — 스킬 설치를 건너뜁니다." >&2
  exit 0
fi

mkdir -p "$DEST"
for skill in "${SKILLS[@]}"; do
  src="$TMP/claude-skills/skills/$skill"
  if [ -d "$src" ]; then
    rm -rf "${DEST:?}/$skill"
    cp -R "$src" "$DEST/$skill"
    echo "install-global-skills: $skill 설치 완료"
  else
    echo "install-global-skills: $skill 을(를) 저장소에서 찾을 수 없습니다." >&2
  fi
done
