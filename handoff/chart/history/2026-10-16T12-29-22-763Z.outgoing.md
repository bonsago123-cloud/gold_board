# 현재 인수인계 — 반복 재개

## 1. 목표
BTC 차트 한 기능. docs/task5/bitcoin-chart/NEXT.md와 고정10개를 따른다.

## 2. 현재 상태
BLOCKED; 기준 커밋 b4cbb2222a879e5e2d196d6a7d18fbafc4bf99ce; 소스 해시 4d6c14fdaf20123eccdc26b41289f3185d956e46289db7c92b9dce8de23c30f2. 세션 2026-10-16T12-29-22-763Z; 이전 세션 2026-10-16T12-24-27-641Z. 업로드 종료 커밋 미확인.
변경: BTCUSD(Bitstamp) 차트·8개 간격·재시도·출처/단위 안내 추가. 차트는 기존 금은 차트와 별도 상태 사용. 사용자 요청으로 메인 source_stale 상세 안내를 숨기고 금·은 검증 페이지에 원천 갱신 지연 설명 추가(오래된 값 배지와 판정 로직 보존). 공개 차트 실험 표 추가, 현재가 실험 표에 차트 사용량이 섞이던 연결 제거. HANDOFF.json 기준 커밋 갱신 누락과 SITE-CHECK 현재 경로 보완.

## 3. 실행 명령
npm ci → npx playwright install chromium → npm run handoff:resume → npm run chart:check. 실패 조사/수정 후 npm run handoff:finish. 같은 열린 세션의 resume은 시간/요청 수를 초기화하지 않는다.

## 4. 통과 검사
- integrity: PASS
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
원본: handoff/chart/history/2026-10-16T12-31-40-498Z.json. 모의검사는 실제 사이트 성공 증거가 아니다.

## 5. 남은 문제
Chromium 및 headless shell 다운로드가 손상된 ZIP으로 실패. 차트 고정검사 및 실제 사이트 브라우저 검사는 UNVERIFIED이며 실위젯 데이터/간격/모바일/확대축소도 미확인. 구현은 업로드 전이므로 운영 반영 미확인. 서로 다른 모델/무료 사용 여부, 비교 세션 두 개·종료 커밋·학생 판단 증거 미확인. 받은 인계 원문은 그대로 저장했고 SHA 동일성은 session.json에 기록. 세부 증거: docs/task5/bitcoin-chart/implementation-review.md.
- chart_fixed: 실행 로그 확인
- site: 실행 로그 확인
- live_chart: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- deployment_match: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- manual_all_functions: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- submission: ENOENT: no such file or directory, open 'handoff/chart/review.json'

## 6. 다음 행동
변경 ZIP을 저장소 루트에 업로드한 후 정상 Chromium 환경에서 같은 고정10개 및 전체 사이트 검사를 실행한다. BTC 실데이터·8개 간격·재시도·확대축소·모바일·지연 안내 위치를 확인하고 배포 파일 바이트를 비교한다. 실제 증거를 review.json에 기록하며 미확인을 PASS로 바꾸지 않는다. 비교할 실제 종료 세션 두 개와 서로 다른 모델 증거 및 학생 판단을 확정한다.
담당 역할 이름 없이 이 문서와 세션 기록으로 이어간다. 종료 전 handoff/chart/notes.json에 changes/problems/next_action을 실제 내용으로 적고 finish 실행.

## 7. 건드리지 말 것
고정10개/기대값/freeze, 금·은·환율·DB·T04 증빙, 과거 세션. 사용자가 GitHub에 직접 업로드. AI 대화 자동 호출 없음.
