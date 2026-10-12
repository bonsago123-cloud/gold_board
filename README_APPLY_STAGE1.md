# 1단계 — AI A 시작 전에 먼저 적용

이 폴더의 내용을 `gold_board` 루트에 복사한다.

그다음:

```bash
npm run handoff:check
git add .
git commit -m "task5: freeze copper tests and handoff protocol"
git tag task5-a-start
git push origin main
git push origin task5-a-start
```

**이 커밋이 생기기 전에는 2단계를 적용하지 않는다.**

이 단계에서 고정되는 것:
- 개선점: 구리 현재 시세 조회 추가
- 검사 10개
- AI A/B 공통 상한: 각각 30분 / 요청 10회
- 저장소 자동 발견 규칙: AGENTS.md → HANDOFF.json → docs/handoff/current.md
- 범용 재사용 명령: `npm run handoff:new -- ...`
