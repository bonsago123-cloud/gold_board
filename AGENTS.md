# 저장소만 받은 다음 AI의 시작점

현재 목표는 **비트코인 현재가 조회 한 기능**이다. 사용자 승인으로 구리 화면은 제거됐다.
구리 과거 실험은 `handoff/archive/copper/` 및 `docs/task5/copper-*`에 보존한다.
구리 404를 다시 고치거나 비트코인 성공으로 구리 실험을 PASS 처리하지 않는다.
`upload/`는 과거 업로드 묶음이다. 현재 소스는 저장소 루트이며 해당 폴더를 다시 덮어쓰지 않는다.

## 읽기 순서
1. `docs/task5/assignment.txt` — 실제 과제 원문.
2. `HANDOFF.json`, `handoff/config.json`, `docs/handoff/current.md`.
3. `docs/task5/bitcoin/fixed-tests.json`, `freeze.json`, `NEXT.md`.
4. `docs/handoff/LESSONS.md`, `docs/handoff/SITE-CHECK.md`.
5. `handoff/latest.json` 및 가장 최근 Actions artifact. 최신 파일이 없으면 검사를 다시 실행한다.

## 실행과 반복
- Node 24, Git, 저장소 루트에서 `npm ci`, `npx playwright install chromium`.
- `npm run handoff:resume`으로 시작 증거를 남긴다. 받은 current.md SHA-256도 자동 기록된다.
- 1은 미완료 신호다. 첫 FAIL을 재현 → 구현 수정 → 고정10개 재검사 → 전체 검사 순서로 진행한다.
- 네트워크 차단은 UNVERIFIED, 실제 HTTP/기대값 불일치는 FAIL. 추측으로 PASS 금지.
- 하나가 실패해도 다른 gate와 사이트 검사는 계속한다. 모의 검사와 실제 운영은 별개다.
- 종료할 때 반드시 `npm run handoff:finish`. 미완료여도 실행해 기록을 남긴다.
- 상한에 가까워지면 중단하고 실패·시도한 수정·다음 행동을 남긴다. 기능을 억지로 완료하지 않는다.
- 진행 중 세션이 남아 있으면 이전 중단으로 기록하고 새 세션의 inherited_session 연결을 보존한다.

## 반드시 지킬 경계
- 비트코인과 구리 각각의 고정10개/입력/기대값/실행 코드 및 freeze를 변경하지 않는다.
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
AI B는 A와 다른 서비스 또는 확인된 다른 모델이어야 한다. 대화 이름 변경만으로 충족하지 않는다.
비교 측정은 비트코인 전환 전후를 섞지 않는다. 공개 비교표·학생 판단은 B의 종료 과업에 포함한다.

명령 뜻: npm은 Node 패키지 관리 도구, ci는 clean install(잠금 파일대로 설치), run은 등록 스크립트 실행.
npx는 패키지 실행 도구. resume=재개, finish=종료·인계, check=검사, status=상태.
