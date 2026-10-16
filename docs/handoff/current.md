# 현재 인수인계 — 비트코인

## 1. 목표
구리 화면 제거 후 BTC 현재가 한 기능 완성. 구리 과거 실패/고정검사는 보존.

## 2. 현재 상태
BLOCKED. 소스 기준 커밋 ef03f512cf265d55240452acb8743b487b466c9b; 작업트리 SHA-256 496305a1a3e53556e7df680986fd8a0e6ede18f35a72afbe02da4fdd87b8b428.
시작 2026-10-14T07:07:29.329Z; 종료 2026-10-14T07:08:29.132Z; 실행 2026-10-14T07-07-29-329Z-fbcbdff4; 이전 2026-10-14T07-04-21-248Z-36980ee4.
A는 normalize와 준비 화면까지만 구현. B가 fetch/client/화면 연결을 완성한다. 상태가 완료여도 오래된 기록은 재검사한다.

## 3. 실행 명령
Node 24 + Git. npm ci → npx playwright install chromium → npm run handoff:resume. 수정 후 npm run handoff:finish. 종료 코드 1은 미완료이므로 첫 실패를 수정한다. 2는 설정 오류.

## 4. 통과 검사
- integrity: UNVERIFIED — Local freeze valid; initial upload commit not yet available. Next AI validates Git anchor.
- fixed_tests: FAIL
- regression: PASS
- build: PASS
- live_api: PASS
- deployment: FAIL — Deployment mismatch index.html
- site: UNVERIFIED — {"PASS":0,"FAIL":0,"UNVERIFIED":1}
- manual: UNVERIFIED — Manual evidence stale/source mismatch
- submission: UNVERIFIED — Current BTC submission not reviewed
실제 전체 출력: handoff/history/2026-10-14T07-07-29-329Z-fbcbdff4.json. 모의 고정검사 결과는 실제 시세 성공 증거가 아니다.

## 5. 남은 문제
- integrity: 고정 검사 원본/업로드 커밋을 대조한다. 검사·기대값을 변경하지 않는다.
- fixed_tests: test-output/bitcoin-fixed.json 첫 FAIL부터 bitcoin-core/client를 구현하고 화면을 연결한다.
- deployment: 사용자가 업로드한 커밋의 배포 완료 후 재실행한다. 로컬 수정과 배포 완료는 별개다.
- site: site 보고서의 FAIL/UNVERIFIED를 수정하고 모든 항목을 재검사한다.
- manual: SITE-CHECK.md의 자동화 밖 항목을 실제 실행하고 source_digest와 증거 경로를 manual.json에 기록한다.
- submission: 비트코인 A/B 시작·종료 커밋, 동일 인수인계, 실제 사용량·모델 차이·학생 판단과 공개 비교 보고서를 완성한다. 과거 구리 기록을 재사용하지 않는다.
사이트 원본 증거: test-output/handoff/2026-10-14T07-07-29-329Z-fbcbdff4/site/ (Actions artifact 포함). 실행할 수 없는 항목은 미확인.

## 6. 다음 행동
test-output/bitcoin-fixed.json 첫 FAIL부터 bitcoin-core/client를 구현하고 화면을 연결한다.
첫 기능 실패는 T05-BTC03 예상. docs/task5/bitcoin/NEXT.md 순서로 진행. 새 AI를 자동 호출하지 않으며 사용자가 별도 모델/서비스에서 저장소를 제공한다.

## 7. 건드리지 말 것
금·은·환율·Supabase 및 T04 증빙; 두 실험의 고정 검사·freeze 원본; 구리 이력; 비밀값. 이전 대화 전문을 다음 AI에게 요구하지 않는다.
