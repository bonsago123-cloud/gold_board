# 연속 인수인계 v2

## 목적
새 AI에게 저장소와 “이어서 진행해”만 주면 AGENTS.md에 따라 같은 절차를 반복한다.
원래 A/B 기록·고정 검사·상한은 그대로 보존한다. v2는 잘못된 완료 판정을 막는 후속 보완이다.
코드 생성 AI를 자동 호출하는 서비스가 아니라, 이미 작업을 맡은 AI가 반복해서 사용할 저장소 기반 실행/검증/기록 시스템이다.

## 한 번 정한 실행 흐름
1. 새 AI는 AGENTS.md → HANDOFF.json → config와 인수인계 → 고정 검사 문서를 읽는다.
2. npm ci 후 npm run handoff:resume을 실행한다. 새 세션 ID/시작 버전/시각/부모 실행과 작업트리 해시를 기록한다.
3. handoff/latest.json의 첫 미통과 gate와 next_action부터 수정한다. 실패 종료코드 1은 완료 차단이지 수정 중단이 아니다.
4. 작업을 끝낼 때 npm run handoff:finish. 새 결과와 다음 행동, 7항목 문서, 이력이 생성된다.
5. 다음 AI는 다시 1번으로 시작한다. A/B/C/D별 맞춤 프롬프트나 코드 변경은 없다.

## 검사와 상태
| 검사 | 검사 내용 |
|---|---|
| integrity | 고정 검사 문서·실행 코드의 해시와 원래 Git 커밋, 10개 ID, 원천 주소 |
| fixed_tests | 변경하지 않은 10개 실제 실행 출력. PASS 10개가 각각 한 번씩 있어야 함 |
| regression | 기존 테스트 및 별도 인수인계 회귀 테스트 |
| build | 실제 빌드 |
| live_api | 실제 고정 원천 GET, HTTP 성공, JSON 스키마·양수 가격·단위, 브라우저 CORS |
| deployment | 로그인 없이 배포 파일을 읽고 현재 파일의 바이트와 비교 |
| browser | 깨끗한 Chromium에서 실제 배포 구리 버튼 클릭, 실제 가격·단위·시각·출처와 공개 보고서 확인. 모의 응답 없음 |
| submission | 원래 A/B 사용량과 공통 집계 단위·증거, 실제 다른 모델 사용 증거, 학생 판단의 필수 기록 유무 |

원래 고정 검사는 여전히 정확히 10개다. 위 운영 검사는 고정 기대값을 바꾸지 않고 별도로 완료를 판정한다.
PASS 외의 상태가 있으면 전체 BLOCKED. 네트워크/도구 부재는 UNVERIFIED, 선행 실패로 실행하지 않은 검사는 NOT_RUN.
시작부터 종료 기록 전까지 VERIFYING이다. 강제 종료돼도 예전 COMPLETE가 남지 않는다.
모든 gate PASS일 때만 COMPLETE. 제출 기록 내용의 진실성은 사람이 확인해야 하며 기계가 보장하지 않는다.

## 증거와 버전
- HANDOFF.json / docs/handoff/current.md / handoff/latest.json: 자동 생성된 최신 요약.
- handoff/history/<시각-고유ID>.json: 각 실행의 시작·종료 시각, 실제 HEAD, 작업트리 해시, 부모 실행, 검사 출력.
- handoff/session.json: 현재 세션. finish가 소요 시간을 자동 기록한다. 미완료 세션에서 새 resume을 하면 inherited_session_id로 연결하고 예전 실행은 보존한다.
- public/handoff-status.json / handoff.html: 마지막 보존 결과를 공개 확인하는 화면. 60분 이후 재검증 필요 표시.
- 생성 문서와 실행 이력은 작업트리 해시에서 제외한다. 코드·설정·검사·잠금파일·일반 문서와 새로운 미추적 파일은 포함한다. 실행 중 코드가 달라져도 실패한다.
- npm run handoff:check/status는 다른 소스/60분 초과/미완료 증거를 통과시키지 않는다.
- 웹 업로드는 새로운 커밋을 만들므로 SHA를 수기로 맞추는 대신 다음 실행의 실제 HEAD와 소스 해시를 기록한다. 역사상의 A/B 소스 쌍은 별도 보존한다.

## GitHub 홈페이지 업로드와 자동 검사
저장소 루트에 변경 파일을 같은 경로로 업로드한다. `.github/workflows/handoff-check.yml`을 빠뜨리지 않는다.
업로드(push)·PR·수동 Actions 실행과 성공 deployment_status 이벤트가 같은 검사를 실행한다.
push 직후 배포가 아직 옛 코드면 deployment가 실패하는 것이 정상이다. Vercel이 deployment_status 이벤트를 보내면 배포 뒤 다시 실행한다. 보내지 않는 환경에서는 Actions의 Run workflow로 재검사한다.
워크플로는 contents:read만 사용하고 결과를 커밋하지 않는다. 결과는 Actions 요약과 handoff-evidence artifact에 남으며 30일 보존된다.
다음 AI는 artifact가 없어도 resume으로 전부 재현할 수 있다. 중요한 CI 증거는 만료 전에 저장소 이력으로 보존한다.
GitHub 인증 토큰/모델 API 키를 추가하지 않는다. 파일 업로드/워크플로 실행 권한이 없으면 해당 작업은 사용자가 수행한다.

## 환경과 한계
Node.js 24와 Git, npm ci 필요. 브라우저는 npx playwright install chromium. CI의 --with-deps는 운영체제 의존성도 설치한다.
실제 서비스는 시간에 따라 변할 수 있다. 이전 PASS가 미래 성공을 보장하지 않아 시작/종료마다 실제 검사를 반복한다.
AI가 AGENTS.md를 읽거나 명령을 실행할 능력이 없는 서비스에서는 이 절차를 자동 수행할 수 없다. 그 경우 미실행으로 보고해야 한다.
프로그램 자체는 AI의 지시 무시·증거 위조·코드의 고의적 검사 제거를 막는 보안 경계가 아니다.

## 지금 남은 기능 문제
구리 고정 API의 404 및 CORS 실패는 v2 도입만으로 해결되지 않는다. v2는 그것을 성공으로 숨기지 않고 다음 작업으로 계속 전달한다.
고정 출처 변경은 과제조건과 충돌할 수 있으므로 근거 있는 사용자 판단이 필요할 때만 질문한다.
