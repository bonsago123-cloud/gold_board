# 현재 인수인계 — BTC 차트 새 작업

## 1. 목표
BTC 차트를 완성한다. 작업자 수 제한 없음. docs/task5/chart-restart/REQUEST.txt 및 고정10개를 유지한다.

## 2. 현재 상태
IN_PROGRESS; 세션 2026-10-17T06-59-33-434Z; 기준 커밋 b4cbb2222a879e5e2d196d6a7d18fbafc4bf99ce; 소스 SHA-256 6b7c0018be391cd9294cfc78f500a84692b13e9a94ef5bdf6cc057e2e1250371. 업로드 종료 커밋은 업로드 후 확인 필요.
기존 완성 차트 모듈을 보관 후 제거. 새 고정10개를 먼저 고정하고 차트 제거 상태 0/10 기록. 새 부분 구현은 제목·간격 선택 UI·버튼·출처·단위 안내만 제공하며 외부 차트는 연결하지 않음. 반복 인계 엔진과 Actions를 새 사이클에 연결.

## 3. 실행 명령
Node 24: npm ci → npx playwright install chromium → npm run handoff:resume → npm run chart:check. 끝날 때 notes.json 작성 → npm run handoff:finish. 이미 열린 세션을 다른 작업자가 인수하면 npm run handoff:takeover. 자세한 규칙은 docs/task5/chart-restart/PROTOCOL.md.

## 4. 통과 검사
BTC-R01: PASS
BTC-R02: FAIL
BTC-R03: FAIL
BTC-R04: FAIL
BTC-R05: PASS
BTC-R06: PASS
BTC-R07: FAIL
BTC-R08: FAIL
BTC-R09: FAIL
BTC-R10: PASS
결과: handoff/restart/latest.json. 합성 검사이며 배포 확인과 별개다.

## 5. 남은 문제
BTCUSD 위젯 연결, 기본 설정, 간격 변경, 새로 불러오기, 실패·복구·중복 정리 미구현. 현재가·원화·금·은은 유지. 모델 정보와 업로드 커밋 미확인. 과거 완료 보고서는 이전 사이클의 기록임.

## 6. 다음 행동
public/bitcoin-chart.mjs에서 market.mjs의 mountWidget과 CHART_INTERVALS를 이용해 BTCUSD 위젯을 연결한다. 간격 change/reload와 dispose·오류/복구 처리 구현. npm run chart:check의 동일10개를 실행. 완료하거나 상한 전 notes 작성 후 finish. 차트 외 새 기능을 만들지 말 것.
완성하지 못해도 finish로 기록하고 다음 작업자가 동일 절차를 반복한다.

## 7. 건드리지 말 것
새 고정10개·freeze, 과거 증거, 금·은·현재가·원화·DB·T04. 사용자가 직접 업로드. 과제 제출 완료는 기능 완료와 별도이며 다른 모델/서비스의 두 실행과 본인 판단 증거가 필요하다.
