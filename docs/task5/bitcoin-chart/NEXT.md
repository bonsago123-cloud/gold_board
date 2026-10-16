# 모든 후속 작업자의 시작 지침 — BTC 차트

## 범위와 과제 조건
기능 한 개: 기존 BTC 현재가 아래에 비트코인 과거 시세 차트를 추가한다. 환율 실시간화, 신규 코인, BTC DB 저장, 금·은 변경은 제외한다. 사용자 요청으로 새 차트 실험을 시작했으며 이전 BTC 현재가 실험의 실패/측정/고정10개는 보존한다. 과거 BLOCKED를 차트 성공으로 완료 처리하지 않는다.
과제 원문은 assignment.txt. 고정10개는 fixed-tests.json 및 scripts/task5-chart-check.mjs. 상한은 각 AI 30분/사용자 작업 지시10건(도구 호출 제외). 구현 전 freeze 완료. 후속 작업자도 initial-request.txt의 같은 요청과 검사를 사용한다.

## 시작
1. 사용자 업로드 커밋을 새 폴더에 clone. Node24, `npm ci`, `npx playwright install chromium`.
2. `npm run handoff:resume` (= chart:resume). current.md 원문 사본과 SHA-256, 실제 시작 HEAD 및 시각을 저장한다. 후속 작업자가 받은 문서와 A 인계 파일 해시를 대조한다. 세션 service/model을 실제 값으로 기록한다. 과제 비교에 선택할 두 실행의 서비스/모델 차이를 별도 증빙한다. 역할명은 지정할 필요 없다.
3. `npm run chart:check`. 첫 실패 T05-BCH01: BTC 차트 UI 없음. 환경 설치 실패는 UNVERIFIED. `chart:request`는 사용자 추가 작업 지시 때만 1회 실행한다. 중간 재검사는 시작 시간을 초기화하지 않는다.

## 차트 구현 계약
- 기존 `public/market.mjs`의 mountWidget/CHART_INTERVALS를 참고한다. 필요하면 새 `public/bitcoin-chart.mjs`를 만들고 dashboard.mjs에서 연결한다. 금·은 차트 코드와 DOM은 보존한다.
- DOM ID: bitcoin-chart-title, bitcoin-chart-host, bitcoin-chart-interval(select), bitcoin-chart-reload(button), bitcoin-chart-status(오류/로딩 안내), bitcoin-chart-note(출처/단위 설명).
- 기본 60(1시간). 간격 1,5,15,60,240,D,W,M. TradingView Advanced Chart, BTCUSD, Asia/Seoul. 후속 작업자는 공식 문서와 실제 위젯에서 사용 가능한 거래소:BTCUSD 심볼을 확인한다. BTCUSDT를 USD 가격처럼 표시하지 않는다.
- 출처 링크는 https://www.tradingview.com/ 아래에 표시. 설명은 USD/BTC·참고가격·현재가와 출처/시각/가격이 다를 수 있음을 명시한다. iframe load만으로 실제 데이터 성공이라고 표시하지 않는다.
- 위젯 제공 스크립트 실패 안내 및 다시 불러오기. 기존 mountWidget의 dispose로 관찰자/타이머/중복 프레임 정리. 차트는 현재가 조회/자동조회 간격/금은 DB 저장을 호출하지 않는다.
- 고정 검사는 로컬 정적 서버와 제공 스크립트 모형으로 실행한다. 실데이터 증거가 아니다. 고정 파일과 freeze는 변경/완화하지 않는다. 추가 회귀 테스트는 별도 파일에만 작성한다.

## 검사·수정·인계 자동화
`npm run chart:check` → 실패 원인 조사/수정 → 같은10개 재검사 → `npm run handoff:finish`.
finish는 차트10개, 기존 현재가10개, 회귀, build, 실제 site:check를 독립 실행하고 실행별 로그를 handoff/chart/history에 보존한다. Actions도 push/PR/배포 후 실행하며 artifact에 기록한다. 새 AI를 자동 호출하거나 원격에 자동 커밋하지 않는다.
실제 gate(live_chart/deployment_match/manual_all_functions/submission)는 `handoff/chart/review.json`의 실제 관찰 증거를 읽는다. source_digest는 최신 보고서와 일치해야 하고 finished_at은 실제 검사 종료 ISO 시각(1시간 이내), gates 각 행은 id/status/evidence/sha256이다. evidence는 docs/task5/bitcoin-chart/ 아래 실제 관찰 Markdown 경로, sha256은 해당 파일 바이트 해시. 증거 없는 초기 상태는 UNVERIFIED다. submission PASS에는 실제 A/B 종료 커밋과 different_models/handoff_equal/public_report_verified/student_decisions_verified=true 및 대응 증거가 필요하다. 기계는 사람이 쓴 주장의 진실까지 증명하지 못하므로 실제 원본을 검토한다. 단순 플래그 수정으로 완료 처리하지 않는다. 모든 gate와 사용량 검사가 PASS여야 COMPLETE가 된다. 고정 검사 파일 변경은 금지한다.
- 실제 공개 사이트의 BTC 각 간격·새로고침·확대축소·출처 링크·시각/지연 표시·모바일 폭을 하나씩 실행한다. iframe 존재와 데이터 실제 표시는 다르다.
- SITE-CHECK.md의 기존 모든 기능을 각각 실행한다. 실패해도 다른 항목을 계속 검사한다. 실패 원인·수정·재검사 증거를 남긴다. 권한/네트워크 제한·실행하지 않은 항목은 UNVERIFIED.
- 로컬 변경과 공개 배포 파일의 바이트 비교를 한다. 사용자가 ZIP 업로드 전이면 배포 완료로 주장하지 않는다. 배포 후 실제 검사를 다시 실행한다.
- 사용량/시간은 재검사 전체를 포함. 30분 가까워지면 완료 강행하지 말고 finish 및 인계. A 끝/B 시작/끝 실제 GitHub 커밋이 없으면 null. 기반 HEAD로 대체하지 않는다.
- 오류 회차 = 고정10개 실행 중 FAIL이 하나 이상 나온 회차 수. UNVERIFIED만 있는 회차는 오류로 세지 않는다. 이전 BTC 실험과 합산하지 않는다.
- current.md 7항목을 갱신하고 변경·검사 결과·남은 문제·다음 행동을 반드시 적는다. 생성된 최신 보고서 링크만 붙이고 본문을 누락하지 않는다.
- 공개 task5.html에는 차트 실험 익명 비교표·확인법4줄·학생 판단3줄·도구 선택 기준을 넣는다. 사용자 판단은 대신 만들어 쓰지 않는다. 새 시크릿 창에서 결과물/소스 공개 접근을 검증한다. 모델 정보는 증거에 남기되 비교 판정표에서 가린다.
- 최종 변경 파일을 상대경로 유지 ZIP으로 제공한다. .github 포함, 비밀값·node_modules·대화 전문 제외. 영어 커밋 메시지 제공. 사용자가 직접 업로드한다.

## 명령 뜻
npm: Node 패키지 관리 도구. ci: clean install(잠금 파일대로 설치). run: 등록 스크립트 실행. npx: 패키지 실행 도구. resume: 시작/재개, finish: 종료/인계, check: 검사, request: 추가 사용자지시 기록, status: 상태. 기존 현재가 orchestration은 scripts/handoff-bitcoin.mjs에 보존했으며 chart 작업 중 직접 실행하면 current.md를 덮어쓰므로 사용하지 않는다.

## 횟수 제한 없는 인계
작업자 이름 없이 resume → 상태 확인 → 수정 → 검사 → notes.json → finish → 업로드 → 다음 실행을 반복한다. 열린 세션은 시간을 재설정하지 않는다. 종료 세션은 history에 보존하고 새 세션에 부모 ID/해시를 연결한다. finish는 current.md 7항목과 outgoing 원문/해시를 생성한다. comparison.json의 session_ids에는 과제 비교 대상인 실제 종료 세션 두 개를 명시한다. 현재 세션을 무조건 두 번째 비교 대상으로 간주하지 않는다. 고정 initial-request.txt는 역사 증거이며 현재 요청은 RESUME.txt를 사용한다.
