# 현재 작업의 유일한 시작점

현재 작업: `bitcoin-chart-restart-v2`. 사용자가 기존 BTC 차트를 제거하고 부분 구현 후 반복 인계하도록 승인했다. 기존 현재가·원화·탭은 유지한다.

1. docs/task5/assignment.txt, HANDOFF.json, docs/handoff/current.md를 읽는다.
2. docs/task5/chart-restart/PROTOCOL.md, REQUEST.txt, fixed-tests.json, freeze.json을 읽는다.
3. Node 24에서 npm ci, npx playwright install chromium 후 npm run handoff:resume.
4. npm run chart:check로 같은 검사10개를 실행하고 남은 기능을 구현한다.
5. handoff/restart/notes.json의 changes/problems/next_action을 실제 내용으로 채우고 npm run handoff:finish.

작업자 이름·수·순서를 미리 배정하지 않는다. 한 명이 완료해도 되고 미완료이면 어떤 다음 작업자든 반복한다. 이 전달본에서는 사용자의 요청으로 부분 구현 후 종료한다. 다음 작업자는 남은 기능을 완성한다.
열린 세션을 같은 작업자가 재개하면 resume, 다른 작업자가 인수하면 handoff:takeover. 요청 추가는 handoff:request. 시간과 요청 수를 초기화하여 한도를 우회하지 않는다.
고정검사와 기대값·freeze, 과거 기록, 금·은·현재가·환율·DB·T04는 변경하지 않는다. 검증 환경 실패는 UNVERIFIED이며 PASS로 꾸미지 않는다.
과거 docs/task5/bitcoin-chart 및 handoff/chart는 역사 기록이다. 이전 고정 검사 오류를 현재 작업의 미완료로 취급하지 않는다. 과거 최종 제출 보고서도 이번 작업의 완료 증거가 아니다.
사용자가 GitHub에 직접 업로드하므로 변경 파일을 ZIP으로 전달한다. 원격 push 금지. Actions는 검사 자동 실행·증거 저장만 하며 새 AI 대화를 호출하지 않는다.
과제 비교는 서로 다른 서비스 또는 확인된 다른 모델의 실제 실행 두 개를 선택한다. 작업자 수 제한과는 무관하다. 기록에 없는 모델·사용량·종료 커밋·학생 판단을 만들지 않는다.
