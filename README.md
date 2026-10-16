# 현재 작업: 비트코인 조회 인수인계

먼저 [AGENTS.md](AGENTS.md), [현재 인수인계](docs/handoff/current.md), [다음 작업](docs/task5/bitcoin/NEXT.md)을 읽으세요. 구리는 화면에서 제거했고 BTC는 부분 구현 상태입니다. 아래 내용의 구리 작업은 과거 기록입니다.

# 다음 AI는 여기서 시작

사용자가 저장소와 “이어서 진행해”만 전달하면 **AGENTS.md**와 **과제 조건**을 읽고 다음 명령을 실행하세요.

```bash
npm ci
npm run handoff:resume
npm run site:check
```

작업 후 `npm run handoff:finish`와 `npm run site:check`를 다시 실행해 검사 결과 및 7항목 인수인계를 남깁니다. `site:check`는 **실제 배포 사이트의 여러 기능을 클릭하여 검사**하며, 구리 API 오류가 나도 다른 화면을 계속 검사합니다. 결과는 `test-output/site-check/report.md`, 화면 캡처와 JSON에 남고 GitHub Actions에서는 `site-check-evidence` artifact로 받을 수 있습니다.

브라우저가 설치되지 않았다면 `npx playwright install chromium`을 실행하세요. 이 스크립트는 가격이나 성공 결과를 가짜로 생성하지 않습니다. 자동화하지 못한 기능도 직접 확인해야 하며 [전체 사이트 검사 규칙](docs/handoff/SITE-CHECK.md)에 기록합니다.

고정 검사 10/10만으로 완료가 아닙니다. 실제 API, 배포, 브라우저, 제출 증빙과 모든 기능 검사 결과를 따로 확인하세요. [연속 인수인계](docs/handoff/PROTOCOL.md)에서 관련 상태를 설명합니다.

---

# METAL / NOTE v3.2 — 금·은 시세

금·은만 조회합니다. 달러·원화 가격, 적용 환율·기준 시각, 차트와 날짜별 기록을 표시합니다. 과제 대표 검증과 예약 수집은 금을 사용합니다. 은은 별도 은 증빙 페이지에서 조회·실제 두 날짜·변화값·실패 복구와 JSON을 확인합니다.

**업데이트 순서: docs/업데이트-적용.md. 기존 사용자는 sql/004_gold_silver_only.sql 실행 후 파일 교체·재배포가 필요합니다.**

Gold API와 키 없는 ExchangeRate-API를 사용합니다. 환율은 하루 1회 갱신되며 실시간 환율이 아닙니다. 원화값은 원천 USD 값에 환율을 곱한 참고값입니다.

npm test / npm run build / npm run verify:assets. 실제 배포 화면, 두 날짜 증빙과 과정 영수증은 별도로 확인하세요.

은 증빙 추가만 적용하는 v3.1 사용자는 새 SQL 없이 재배포하면 됩니다.
