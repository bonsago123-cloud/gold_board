# 저장소만으로 계속 이어가는 작업 규칙

사용자의 요청이 “이어서 진행해”이고 저장소만 제공되어도 아래 절차를 그대로 실행한다.
AI A/B/C/D 같은 역할 이름, 이전 대화, 별도의 맞춤 프롬프트가 필요하지 않다.

## 시작
1. `HANDOFF.json`, `handoff/config.json`, `docs/handoff/current.md`와 지정된 고정 검사 문서를 읽는다.
2. Node.js 24 환경에서 저장소 루트의 `npm ci`를 실행한다.
3. `npm run handoff:resume`을 실행한다. 시작 버전·시각·이전 실행과의 연결이 자동 기록되고 검사가 실행된다.
4. 종료 코드 1은 **완료 불가**, 작업 중단 명령이 아니다. `handoff/latest.json`의 gates와 next_action을 읽고 수정 가능한 첫 실패부터 해결한다. 종료 코드 2는 실행 설정 오류다.

## 작업
- 고정 10개 ID/입력/기대값과 실행 코드를 삭제·완화·변경하지 않는다. 원본 Git 커밋과 SHA-256을 대조한다.
- 모의 응답 PASS, 실제 API PASS, 실제 배포 PASS, 실제 브라우저 PASS는 서로 다른 검사다.
- API 404, CORS 불허, 미배포, 브라우저 미설치, 네트워크 접근 불가는 COMPLETE가 아니다.
- 환경이 막히면 UNVERIFIED와 원인을 보존한다. 실행할 수 없는데 통과했다고 적지 않는다.
- 고정 API 자체가 작동하지 않으면 제공자 문서와 응답을 조사한다. 조건 변경이 꼭 필요할 때만 구체적 근거와 함께 사용자 판단을 요청한다. 이전 대화를 요구하지 않는다.
- `protected_areas`를 지킨다. 비밀값·개인정보를 증거에 넣지 않는다.
- 새 기능 시작으로 기존 실패를 지우지 않는다. 지금 목표가 완료되면 다음 사용자 요청을 기다린다.

## 끝내기 — 다음 AI에게 넘기는 규칙
1. 어떤 이유로 작업을 끝내든 `npm run handoff:finish`를 실행한다. 같은 검사, 현재 상태, 7항목 인수인계, 다음 행동, 실행 이력이 자동 갱신된다.
2. 실패가 남으면 BLOCKED 그대로 넘긴다. 실패 내용을 숨기거나 phase를 직접 COMPLETE로 바꾸지 않는다.
3. 코드뿐 아니라 HANDOFF.json, handoff/ 전체, docs/handoff/current.md, public/handoff-status.json을 함께 보존한다.
4. 사용자는 GitHub 홈페이지 업로드를 선호한다. 업로드본에는 변경한 파일의 경로를 유지하고 루트부터 담는다. .github/workflows/handoff-check.yml도 반드시 포함한다.
5. 다음 AI는 다시 시작 절차를 실행한다. 최신 HEAD와 작업트리 해시를 자동 기록하므로 웹 업로드 뒤 사용자에게 SHA 교체를 맡기지 않는다.

## 완료와 자동화 범위
모든 필수 gate가 PASS인 최신 동일 소스 증거만 COMPLETE다. 하나라도 FAIL/UNVERIFIED/NOT_RUN이면 BLOCKED다.
오래된 증거는 handoff:status/check에서 UNVERIFIED다. 최종 완료 판단 직전에는 finish로 다시 실행한다.
GitHub push/PR 및 수동 Actions 실행도 같은 검사를 돌리고 실패 원인·다음 행동·증거 artifact를 남긴다.
Actions는 다음 AI를 호출하지 않는다. 사용자가 새 AI에게 저장소와 “이어서 진행해”를 주면 그 AI가 이 절차를 수행한다.
GitHub Actions 실행에는 모델 API 키가 필요 없다. 외부 AI 계정/모델 선택은 저장소가 바꿀 수 없다.

## 과제 기록
원래 A/B 비교의 고정 상한과 과거 기록을 보존한다. 이번 시스템 보완은 후속 작업이다.
실제 과거 사용량·서로 다른 모델 여부·학생 판단은 증거가 없으면 미확인으로 남긴다.
`handoff/submission.json`은 필요한 본인 사실을 한 번 기록하는 입력이며 매 인수인계용 프롬프트가 아니다.

명령 뜻: npm은 Node.js 패키지 관리 도구, ci는 clean install(잠금 파일 기반 설치), run은 스크립트 실행.
resume은 이어받기, finish는 이번 작업 종료·인계, status는 상태 확인, check는 상태·고정 조건 검증이다.
브라우저가 없으면 `npx playwright install chromium`을 실행한다. npx는 패키지 실행 도구, install은 설치다.
