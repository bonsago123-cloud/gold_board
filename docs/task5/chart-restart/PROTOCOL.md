# 반복 가능한 인계 절차

## 시작과 범위
이 사이클은 사용자 요청으로 이전 차트 구현을 제거하고 다시 만든다. 과거 실패·성공·완성 소스는 handoff/archive/chart-before-restart와 기존 문서에 보존한다. 현재 목표는 BTC 차트 한 기능이다. 현재가·원화·탭은 유지한다.
일반 시스템은 작업자 1명 이상을 지원한다. 이번 검증에서는 첫 작업자가 UI 골격까지만 구현하고 남은 차트 연결을 다음 작업자에게 넘긴다. 다음 작업자가 끝내지 못하면 같은 절차를 반복한다.

## 고정 기준
fixed-tests.json의 관찰 가능한 검사 정확히10개, 1800초와 사용자 작업 요청10개 상한. 도구 호출은 별도이며 사용자 요청에 합산하지 않는다. 같은 REQUEST.txt를 쓴다. freeze.json SHA-256은 검사 정의·실행 코드·최초 요청을 고정한다. 첫 업로드 커밋도 보관하고 이후 git diff로 freeze 자체의 변경이 없는지 확인한다. 업로드 전 로컬 해시는 Git 이력 고정 증거가 아니다.

## 명령
Node 24, npm ci, npx playwright install chromium.
npm run handoff:resume — 새 세션 시작 또는 같은 열린 세션 유지.
npm run handoff:takeover — 다른 작업자의 미종료 세션을 중단 기록으로 보존하고 새 세션 시작.
npm run handoff:request — 추가 사용자 작업 요청마다 1회. 최초 요청1개는 시작 시 기록.
npm run chart:check — 고정10개와 불변 해시 검사, 결과 회차 보존.
npm run handoff:finish — notes.json의 changes/problems/next_action 필요. 검사 후 시간·요청·실패 회차·소스 해시·7항목 인계 자동 보존.
npm run handoff:ci — 세션을 만들거나 닫지 않고 검사 결과만 보존.
npm=Node 패키지 관리 도구, ci=clean install, run=등록 명령 실행, resume=재개, takeover=인수, request=요청 기록, finish=종료, check=검사.
브라우저 설치가 막힌 환경에서만 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH에 실제 Chromium 실행 경로를 지정할 수 있다. 테스트 기대값은 동일하다.

## 기록과 중단
session.json의 service/model은 실제 확인된 값만 입력한다. 불명이면 UNVERIFIED 유지. 상한 전에 finish한다. 비정상 종료 후 takeover는 이전 시간·사용량을 지우지 않으며 비활성 기간을 포함한 경과시간임을 남긴다. 소스 스냅샷 manifest와 Git 기준 버전을 모두 보존한다. 업로드 후 시작·종료 full commit을 별도 증거로 기록한다. 해시는 커밋을 대체하지 않는다.
전달받은 current.md 원문과 SHA-256, 직전 outgoing 해시를 비교한다. 불일치하면 중단하고 차이를 보존한다. history는 덮어쓰거나 삭제하지 않는다.

## 완료의 구분
고정10개 통과는 FEATURE_COMPLETE. 과거 차트 실패를 이번 결과와 합산하지 않는다. 미완성은 IN_PROGRESS로 정상 인계한다. finish 종료코드0은 인계 저장 성공이며 기능 완료라는 뜻이 아니다. check/ci는 미통과 시1이다.
과제 제출 완료는 별도: 다른 서비스/모델 두 실행, 동일 인계, 상한/실사용량, 시작·종료 고정 커밋, 새 환경 재현, 공개 비교표와 본인 판단이 필요하다. 이번에는 아직 제출 완료가 아니다.
새 AI 실행은 사용자가 새 대화에서 시작한다. 자동화 범위는 상태 읽기·검사·기록·인계이며 AI 서비스 자동 호출은 없다.
