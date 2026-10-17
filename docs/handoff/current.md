# 현재 인수인계 — 반복 재개

## 1. 목표
BTC 차트 한 기능. docs/task5/bitcoin-chart/NEXT.md와 고정10개를 따른다.

## 2. 현재 상태
BLOCKED; 기준 커밋 b4cbb2222a879e5e2d196d6a7d18fbafc4bf99ce; 소스 해시 644c2870054271d8214687538a0c54632672869324b421912bc176b3e2ed2329. 세션 2026-10-17T01-15-17-221Z; 이전 세션 2026-10-16T23-32-44-215Z. 업로드 종료 커밋 미확인.
변경: 차트 수정 검사 scripts/bitcoin-chart-check.mjs 추가: BTC 탭 선택 후 검사, mock 위젯 IIFE로 전역 const 충돌 제거. 기대값 유지, 별도 ID/입력 및 원본 ID 명시. finish/ci chart_current gate와 결과 artifact 연결. 과제 검증 페이지에 원본/수정본/UI 결과 구분 표시. 이전 UI·원화 변경 누적 포함.

## 3. 실행 명령
npm ci → npx playwright install chromium → npm run handoff:resume → npm run chart:check. 실패 조사/수정 후 npm run handoff:finish. 같은 열린 세션의 resume은 시간/요청 수를 초기화하지 않는다.

## 4. 통과 검사
- integrity: PASS
- chart_fixed: FAIL
- chart_current: PASS
- bitcoin_ui: PASS
- quote_fixed: PASS
- regression: PASS
- build: PASS
- site: UNVERIFIED
- live_chart: UNVERIFIED
- deployment_match: UNVERIFIED
- manual_all_functions: UNVERIFIED
- submission: UNVERIFIED
- usage: PASS
원본: handoff/chart/history/2026-10-17T01-16-10-905Z.json. 모의검사는 실제 사이트 성공 증거가 아니다.

## 5. 남은 문제
원본 고정 차트 검사와 과거 실패는 보존하며 수정본으로 대체하지 않음. 실제 운영 차트·배포 일치 및 과제 비교/학생 판단 증빙은 별도 확인 필요. 수정본 합성 검사는 실제 시장 데이터 증거가 아님.
- chart_fixed: 실행 로그 확인
- site: 실행 로그 확인
- live_chart: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- deployment_match: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- manual_all_functions: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- submission: ENOENT: no such file or directory, open 'handoff/chart/review.json'

## 6. 다음 행동
누적 ZIP을 저장소 루트에 업로드. Actions chart_current 및 bitcoin_ui 결과 확인. 원본 chart_fixed 실패를 현재 수정본 오류로 오해해 UI를 되돌리지 말 것. 실제 배포 기능과 제출 증빙 확인 후 review.json에 실제 관찰 기록.
담당 역할 이름 없이 이 문서와 세션 기록으로 이어간다. 종료 전 handoff/chart/notes.json에 changes/problems/next_action을 실제 내용으로 적고 finish 실행.

## 7. 건드리지 말 것
고정10개/기대값/freeze, 금·은·환율·DB·T04 증빙, 과거 세션. 사용자가 GitHub에 직접 업로드. AI 대화 자동 호출 없음.
