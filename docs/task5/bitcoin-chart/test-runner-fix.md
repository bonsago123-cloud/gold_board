# 차트 검사 오류 수정

## 차트 검사 오류 수정
`npm run chart:current:check`는 scripts/bitcoin-chart-check.mjs의 수정본을 실행한다. 비트코인 탭을 먼저 선택하고 mock 위젯을 IIFE 함수로 감싸 재실행 시 전역 변수 충돌을 방지한다. 기존 10개 검증의 기대값은 유지하며 별도 BTC-CHART01~10 ID와 원본 ID를 기록한다. 처음 두 입력에는 탭 선택을 명시한다. 원본 고정 검사·freeze는 변경하지 않았고 수정본은 원본 과제 결과를 대체하지 않는다.
finish/ci는 chart_fixed와 chart_current를 모두 실행하고 각각 .fixed.json/.current.json으로 보존한다. 과제 검증 페이지에도 별도 상태를 표시한다. 원본 검사 FAIL 때문에 전체 과제 판정은 BLOCKED일 수 있다. 이 경우 동일한 검사 오류를 다시 고치거나 현재 UI를 되돌리지 말고 수정본 결과와 남은 실제 배포/제출 증빙을 확인한다.
명령의 current는 현재 화면에 맞춘 검사, check는 검사를 뜻한다.

원본 고정 스크립트 SHA-256: 98f6a695bffa80426964a540a5015ba7a10eb95e9f4724b2f31719f28695a751. 수정본 결과는 test-output/chart-current.json 및 실행별 history/*.current.json에 보존한다.
