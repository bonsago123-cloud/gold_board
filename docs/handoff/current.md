# 현재 인수인계 — 반복 재개

## 1. 목표
BTC 차트 한 기능. docs/task5/bitcoin-chart/NEXT.md와 고정10개를 따른다.

## 2. 현재 상태
BLOCKED; 기준 커밋 8f8614f4b807596aeb5370537a3340505eb368c5; 소스 해시 9927accb182279e34941b7523e04d4a94824bd4d5b6a7567c0747805c6eda9c7. 세션 2026-10-16T12-24-27-641Z; 이전 세션 2026-10-16T12-18-04-003Z. 업로드 종료 커밋 미확인.
변경: 사용자의 정정에 따라 일회성 역할 지정 제거. 열린 세션 시간/요청 유지, 종료 세션 보존·부모 연결, 7항목 인계 자동 생성과 원문 해시 저장 추가. 과제 비교는 실제 세션 두 개를 별도로 지정. 차트 구현/환율 변경 없음.

## 3. 실행 명령
npm ci → npx playwright install chromium → npm run handoff:resume → npm run chart:check. 실패 조사/수정 후 npm run handoff:finish. 같은 열린 세션의 resume은 시간/요청 수를 초기화하지 않는다.

## 4. 통과 검사
- integrity: UNVERIFIED
- chart_fixed: UNVERIFIED
- quote_fixed: PASS
- regression: PASS
- build: PASS
- site: UNVERIFIED
- live_chart: UNVERIFIED
- deployment_match: UNVERIFIED
- manual_all_functions: UNVERIFIED
- submission: UNVERIFIED
- usage: PASS
원본: handoff/chart/history/2026-10-16T12-24-27-941Z.json. 모의검사는 실제 사이트 성공 증거가 아니다.

## 5. 남은 문제
차트 미구현. Chromium 설치 실패로 실제 차트 및 사이트 기능은 미확인. 업로드/배포/공개 비교 증빙 미완료. 고정 원문과 과거 증거의 A/B 표현은 원본 보존 때문에 남아 있으나 현재 작업 역할 지정에는 사용하지 않는다.
- integrity: Local freeze valid; upload Git anchor required
- chart_fixed: 실행 로그 확인
- site: 실행 로그 확인
- live_chart: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- deployment_match: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- manual_all_functions: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- submission: ENOENT: no such file or directory, open 'handoff/chart/review.json'

## 6. 다음 행동
역할명을 지정하지 않고 AGENTS.md와 현재 인계를 읽어 같은 기능을 이어간다. 정상 브라우저 환경에서 차트 고정10개를 실행하고 차트 구현 후 모든 실제 사이트 기능을 실행·수정·재검사한다. 종료마다 notes.json을 갱신하고 finish 및 업로드 ZIP 제공.
담당 역할 이름 없이 이 문서와 세션 기록으로 이어간다. 종료 전 handoff/chart/notes.json에 changes/problems/next_action을 실제 내용으로 적고 finish 실행.

## 7. 건드리지 말 것
고정10개/기대값/freeze, 금·은·환율·DB·T04 증빙, 과거 세션. 사용자가 GitHub에 직접 업로드. AI 대화 자동 호출 없음.
