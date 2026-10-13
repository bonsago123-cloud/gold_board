# 현재 인수인계 — task5-copper-live

## 1. 목표
구리 현재 시세 조회 및 연속 인수인계

## 2. 현재 상태
BLOCKED. COMPLETE 문구를 믿지 말고 시작 시 재검증한다.
실행 ID: 2026-10-13T06-18-04-497Z-d5d64464
시작 기준 커밋: fa185814e15b31a1818b54932a3b3acf7e56c986
검사한 작업트리 SHA-256: a49a4b8c4fd494424e07e2cf0d54ef2610bd213d86679274ea1fa8c906b7879f
검사 시각: 2026-10-13T06:18:22.804Z
부모 실행: 2026-10-13T06-17-25-720Z-1c759b18
실행 환경: local
이 JSON과 handoff/latest.json은 명령이 자동 생성한다. GitHub 홈페이지 업로드로 커밋 SHA가 바뀌어도 작업트리 해시로 검증하며 다음 실행에서 실제 HEAD를 자동 기록한다.

## 3. 실행 명령
Node 24, Git 필요. 저장소 루트에서 npm ci 후 npm run handoff:resume. 브라우저 실행 파일이 없으면 npx playwright install chromium. 종료 시 npm run handoff:finish. Windows PowerShell 정책 오류 시 npm 대신 npm.cmd 사용.
실행 권한/네트워크가 없으면 UNVERIFIED로 남긴다. 과거 대화 대신 이 저장소만 읽는다.

## 4. 통과 검사
- integrity: PASS — Original Git baseline + document + executable hashes unchanged
- fixed_tests: PASS
- regression: PASS
- build: PASS
- live_api: FAIL — HTTP 404 from fixed endpoint
- deployment: PASS — Anonymous deployment files match current source bytes
- browser: NOT_RUN — Requires real API and current deployment to pass first
- submission: UNVERIFIED — Missing human evidence: a_actual_seconds, a_actual_requests, a_failed_test_runs, b_actual_seconds, b_actual_requests, b_failed_test_runs, different_models_confirmed, student_tool_choice, student_decision, student_rejected_suggestion_or_reason, common_request_unit, a_usage_evidence_path, b_usage_evidence_path, model_evidence_path
전체 출력: handoff/history/2026-10-13T06-18-04-497Z-d5d64464.json
고정 10개는 변경하지 않으며 운영 gate는 별도로 관리한다.

## 5. 남은 문제
- live_api: 실제 구리 API의 HTTP 상태/응답/CORS를 확인한다. 404이면 제공자 문서와 실제 경로를 조사한다. 고정 출처 변경이 불가피하면 변경 근거를 기록하고 사용자 판단을 요청한다. 가짜 가격으로 대체하지 않는다.
- browser: Chromium 의존성을 설치하고 실제 배포 화면에서 구리 조회를 검증한다. 오류 원인을 고친다. 실행 불가는 통과가 아니다.
- submission: handoff/submission.json의 누락된 실제 A/B 사용량과 공통 집계 단위·실제 모델 차이·학생 판단을 증거에 따라 채운다. 값을 추측하지 않는다.
실패 종료 코드는 작업 중단 명령이 아니라 완료 불가 신호다. 수정 가능한 문제를 계속 해결한다.

## 6. 다음 행동
실제 구리 API의 HTTP 상태/응답/CORS를 확인한다. 404이면 제공자 문서와 실제 경로를 조사한다. 고정 출처 변경이 불가피하면 변경 근거를 기록하고 사용자 판단을 요청한다. 가짜 가격으로 대체하지 않는다.
AGENTS.md의 반복 절차를 따른다. 매 작업 종료 시 finish가 검사·상태·7항목·실행 이력을 갱신한다. 아직 실패해도 기록하고 다음 AI가 같은 resume으로 이어받는다.

## 7. 건드리지 말 것
- 기존 금·은 조회/저장/검증
- Supabase 스키마와 T04 실제 증빙
- T04 공식 fixture/hash/검사
- .env와 비밀값
- 고정 검사 10개 ID/입력/기대값
