# 저장소만 받은 다음 AI의 시작점

현재 목표는 **비트코인 차트와 사용자가 추가 요청한 동급 탭·금은 공통 UI·원화 표시**다. 추가 UI 검사는 `npm run bitcoin:ui:check`로 실행하며 finish/ci에도 포함된다. 고정 차트 검사와 별개이며 기존 실패를 대체하지 않는다. 저장소를 받은 작업자가 현재 상태를 읽고 미완료 작업을 이어간다. 역할명 지정은 필요하지 않다.
먼저 `docs/task5/bitcoin-chart/NEXT.md`, `fixed-tests.json`, `freeze.json`, `assignment.txt`를 읽는다. 차트 작업은 별도 실험이며 이전 현재가 실험은 보존한다. 사용자 승인으로 구리 화면은 제거됐다.
구리 과거 실험은 `handoff/archive/copper/` 및 `docs/task5/copper-*`에 보존한다.
구리 404를 다시 고치거나 비트코인 성공으로 구리 실험을 PASS 처리하지 않는다.
`upload/`는 과거 업로드 묶음이다. 현재 소스는 저장소 루트이며 해당 폴더를 다시 덮어쓰지 않는다.

## 읽기 순서
1. `docs/task5/assignment.txt` — 실제 과제 원문.
2. `HANDOFF.json`, `handoff/config.json`, `docs/handoff/current.md`.
3. `docs/task5/bitcoin-chart/fixed-tests.json`, `freeze.json`, `NEXT.md`. 기존 현재가 고정검사도 회귀로 보존.
4. `docs/handoff/LESSONS.md`, `docs/handoff/SITE-CHECK.md`.
5. `handoff/chart/latest.json` 및 가장 최근 Actions artifact. 최신 파일이 없으면 검사를 다시 실행한다.

## 실행과 반복
- Node 24, Git, 저장소 루트에서 `npm ci`, `npx playwright install chromium`.
- `npm run handoff:resume`(차트 전용 dispatcher)으로 시작 증거를 남긴다. 받은 current.md SHA-256도 자동 기록된다.
- 1은 미완료 신호다. 첫 FAIL을 재현 → 구현 수정 → 고정10개 재검사 → 전체 검사 순서로 진행한다.
- 네트워크 차단은 UNVERIFIED, 실제 HTTP/기대값 불일치는 FAIL. 추측으로 PASS 금지.
- 하나가 실패해도 다른 gate와 사이트 검사는 계속한다. 모의 검사와 실제 운영은 별개다.
- 종료할 때 반드시 `npm run handoff:finish`. 미완료여도 실행해 기록을 남긴다.
- 상한에 가까워지면 중단하고 실패·시도한 수정·다음 행동을 남긴다. 기능을 억지로 완료하지 않는다.
- 진행 중 세션이 남아 있으면 이전 중단으로 기록하고 새 세션의 inherited_session 연결을 보존한다.

## 반드시 지킬 경계
- 차트·비트코인 현재가·구리 각각의 고정10개/입력/기대값/실행 코드 및 freeze를 변경하지 않는다.
- BTC 최초 업로드 커밋의 검사 바이트를 Git 이력과 비교한다. 로컬 freeze만으로 Git 검증 PASS 금지.
- 금·은·환율·Supabase 스키마, 공식 T04 fixture, 과거 실데이터 증빙을 변경하지 않는다.
- 실제 배포와 로컬 소스 바이트가 다르면 배포 검증 실패다.
- manual/submission 입력을 임의 PASS 처리하지 않는다. 실제 증거·사람의 판단이 없으면 미확인.
- 정상 동작 완료는 모든 gate PASS이며, 사용자에게 실제 기능 완료와 과제 제출 가능을 구분한다.
- 실패를 숨기기 위해 검사 삭제, 기대값 완화, 새 기능 초기화, 옛 사용량 재활용을 금지한다.
- 개인정보·비밀값·대화 전문은 공개 저장소에 넣지 않는다.

## 인계와 배포
사용자가 GitHub 홈페이지에 직접 올린다. 원격 push·배포 완료를 대신 주장하지 않는다.
변경 파일을 루트 상대경로 그대로 ZIP에 담고 숨김 `.github` 파일도 포함한다.
새 AI는 사용자에 의해 시작된다. Actions는 검사/증거 저장을 자동화하며 AI 모델 호출은 하지 않는다.
GitHub Actions 결과는 artifact에 저장된다. 저장소로 자동 커밋되지 않으므로 다음 AI는 다운로드하거나 재검사한다.
과제 비교에 선택한 두 실행은 다른 서비스 또는 확인된 다른 모델이어야 한다. 이는 비교 증빙 규칙이며 작업자 역할을 고정하는 규칙이 아니다.
비교 측정은 비트코인 전환 전후를 섞지 않는다. 공개 비교표·학생 판단은 작업 종료 과업에 포함한다.

명령 뜻: npm은 Node 패키지 관리 도구, ci는 clean install(잠금 파일대로 설치), run은 등록 스크립트 실행.
npx는 패키지 실행 도구. resume=재개, finish=종료·인계, check=검사, status=상태.

## 반복 인계 규칙
- 매번 동일한 요청: “저장소의 AGENTS.md와 현재 인수인계를 읽고 이어서 진행해.”
- 열린 세션 resume은 기존 시간/요청 수를 유지한다. 종료된 세션 이후 resume은 이전 세션을 보존하고 부모 ID/해시를 연결한다. 이전 미종료 작업을 다른 작업자가 인수하면 이전 작업을 미완료 종료로 기록한 뒤 시작하며 시간을 삭제하지 않는다.
- 종료 전 handoff/chart/notes.json에 changes/problems/next_action을 적는다. finish가 검사와 7항목 인수인계, 나가는 원문·해시를 자동 보존한다. 누락 설명은 미기록으로 표시한다.
- 완료 전까지 다음 실행에서도 동일한 절차를 반복한다. 과제 A/B 비교는 별도 comparison.json에서 실제 종료 세션 두 개를 선택하며 실행 순서를 두 번으로 제한하지 않는다.
- frozen initial-request.txt의 A/B 표현은 과거 고정 원문이다. 현재 운영 요청은 docs/task5/bitcoin-chart/RESUME.txt. 고정 원문을 몰래 고치지 않는다.

## 차트 검사 오류 수정
`npm run chart:current:check`는 scripts/bitcoin-chart-check.mjs의 수정본을 실행한다. 비트코인 탭을 먼저 선택하고 mock 위젯을 IIFE 함수로 감싸 재실행 시 전역 변수 충돌을 방지한다. 기존 10개 검증의 기대값은 유지하며 별도 BTC-CHART01~10 ID와 원본 ID를 기록한다. 처음 두 입력에는 탭 선택을 명시한다. 원본 고정 검사·freeze는 변경하지 않았고 수정본은 원본 과제 결과를 대체하지 않는다.
finish/ci는 chart_fixed와 chart_current를 모두 실행하고 각각 .fixed.json/.current.json으로 보존한다. 과제 검증 페이지에도 별도 상태를 표시한다. 원본 검사 FAIL 때문에 전체 과제 판정은 BLOCKED일 수 있다. 이 경우 동일한 검사 오류를 다시 고치거나 현재 UI를 되돌리지 말고 수정본 결과와 남은 실제 배포/제출 증빙을 확인한다.
명령의 current는 현재 화면에 맞춘 검사, check는 검사를 뜻한다.
