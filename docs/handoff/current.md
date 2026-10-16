# 현재 인수인계 — 반복 재개

## 1. 목표
BTC 차트 한 기능. docs/task5/bitcoin-chart/NEXT.md와 고정10개를 따른다.

## 2. 현재 상태
BLOCKED; 기준 커밋 b4cbb2222a879e5e2d196d6a7d18fbafc4bf99ce; 소스 해시 e35f7953c8be2f9c86864f6814ddb8dd2c7d6a50fff15845562cf1b9c5d575af. 세션 2026-10-16T12-39-14-011Z; 이전 세션 2026-10-16T12-29-22-763Z. 업로드 종료 커밋 미확인.
변경: 사용자 추가 요구에 따라 금·은·비트코인 동급 탭 구현. 기본 금 화면 유지; BTC 선택 시 금은 패널(환율/기록 포함)을 숨기고 BTC 현재가·차트만 표시. 금은 자동조회는 BTC 전환 때 중지. ?asset=BTC 직접 열기와 탭 주소 반영, 탭 aria-controls/pressed 연결. 이전 차트 및 원천 지연 안내 이동 수정 포함. cached source_stale에서도 메인에 지연 제목이 다시 나오지 않도록 보완.

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
원본: handoff/chart/history/2026-10-16T12-39-59-863Z.json. 모의검사는 실제 사이트 성공 증거가 아니다.

## 5. 남은 문제
Chromium 다운로드 ZIP 손상 문제가 해결되지 않아 브라우저 실행 미확인. 중요: 사용자 새 요구(기본 금 탭에서 BTC 패널 숨김)는 기존 고정 차트 검사 BCH01의 첫 페이지 즉시 BTC 표시 기대와 충돌한다. 고정 파일은 변경하지 않았으며 정상 브라우저에서는 원래 검사 일부가 실패할 수 있다. 탭 요구 검증은 BTC 탭 선택 또는 ?asset=BTC에서 별도 추가 검사해야 한다. 실제 배포/비교 모델/종료 커밋/학생 판단은 미확인.
- chart_fixed: 실행 로그 확인
- site: 실행 로그 확인
- live_chart: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- deployment_match: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- manual_all_functions: ENOENT: no such file or directory, open 'handoff/chart/review.json'
- submission: ENOENT: no such file or directory, open 'handoff/chart/review.json'

## 6. 다음 행동
최신 bitcoin-tabs ZIP 하나를 루트에 업로드. 금→은→비트코인→금 순서로 가격/차트/선택 상태와 BTC 전환 시 자동 금은 수집 중단을 검증한다. ?asset=BTC 직접 열기 확인. 고정10개는 그대로 실행하고 새 탭 요구와 충돌하는 실패를 숨기거나 완화하지 않는다. 과제의 기존 고정 기대 유지와 새 사용자 UI 요구를 모두 만족하는 검증 범위는 별도 결정이 필요. 전체 사이트/실차트/모바일 및 배포 바이트 비교 후 review.json을 기록한다.
담당 역할 이름 없이 이 문서와 세션 기록으로 이어간다. 종료 전 handoff/chart/notes.json에 changes/problems/next_action을 실제 내용으로 적고 finish 실행.

## 7. 건드리지 말 것
고정10개/기대값/freeze, 금·은·환율·DB·T04 증빙, 과거 세션. 사용자가 GitHub에 직접 업로드. AI 대화 자동 호출 없음.
