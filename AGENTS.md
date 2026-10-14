# 저장소만으로 계속 이어가는 작업 규칙

사용자의 요청이 “이어서 진행해”이고 저장소만 제공되어도 아래 절차를 그대로 실행한다.
AI A/B/C/D 같은 역할 이름, 이전 대화, 별도의 맞춤 프롬프트가 필요하지 않다.

## 필수: 실제 사이트 전체 기능 검사
- 시작과 종료 시 [전체 기능 실제 실행 규칙](docs/handoff/SITE-CHECK.md)을 읽는다.
- Node 24, 의존성 설치 후 `npm run site:check`를 실행한다. 실제 브라우저에서 가능한 화면 기능을 빠짐없이 눌러야 하며 결과는 `test-output/site-check/report.md`에 남긴다.
- 자동 고정 검사 PASS, 모의 API PASS, 실제 사이트 PASS는 서로 다르다. 기존 `handoff:resume`의 `browser` gate가 API 실패로 NOT_RUN이어도 전체 사이트 검사를 별도로 수행한다.
- 결과가 FAIL/UNVERIFIED여도 다른 기능 검사를 중단하지 않는다. 미확인 가격·시간·데이터는 만들어 내지 않는다.
- 자동 검사로 다루지 못한 동적 기능·외부 링크·브라우저 확대/축소·실제 날짜 검증은 문서에 따라 직접 실행하고 수기 증거를 남긴다. 자동 스크립트만으로 모든 기능을 완료했다고 주장하지 않는다.

## 시작
1. 과제 조건을 확인하고 `HANDOFF.json`, `handoff/config.json`, `docs/handoff/current.md`, 고정 검사 10개, 최신 사이트 검사 보고서를 읽는다.
2. Node.js 24 환경에서 저장소 루트의 `npm ci`를 실행한다.
3. `npm run handoff:resume`을 실행한다. 시작 버전·시각·이전 실행 연결과 고정/운영 gate가 자동 기록된다.
4. `npm run site:check`를 실행한다. 브라우저 실행 파일이 없으면 `npx playwright install chromium`을 실행한 뒤 다시 검사한다.
5. 종료 코드 1은 **완료 불가**, 작업 중단 명령이 아니다. `handoff/latest.json` 및 사이트 검사 보고서의 첫 실패부터 해결한다. 종료 코드 2는 실행 설정 오류다.

## 작업
- 고정 10개 ID/입력/기대값과 실행 코드를 삭제·완화·변경하지 않는다. 원본 Git 커밋과 SHA-256을 대조한다.
- API 404, CORS 불허, 미배포, 브라우저 미설치, 네트워크 접근 불가는 COMPLETE가 아니다.
- 환경이 막히면 UNVERIFIED와 원인을 보존한다. 실행할 수 없는데 통과했다고 적지 않는다.
- 고정 API 자체가 작동하지 않으면 제공자 문서와 응답을 조사한다. 다른 출처로 교체하는 데 원래 고정 조건 변경이 필요하면 근거와 함께 사용자 판단을 요청한다. 이전 대화를 요구하지 않는다.
- `protected_areas`를 지킨다. 비밀값·개인정보를 증거에 넣지 않는다.
- 새 기능 시작으로 기존 실패를 지우지 않는다. 지금 목표가 완료되면 다음 사용자 요청을 기다린다.

## 끝내기 — 다음 AI에게 넘기는 규칙
1. 어떤 이유로 작업을 끝내든 `npm run handoff:finish`를 실행해 동일한 고정 검사, 현재 상태, 7항목 인수인계, 이력을 갱신한다.
2. `npm run site:check`를 한 번 더 실행한다. `test-output/site-check/report.md` 및 `result.json`을 확인하고 시작·종료 검사 결과를 구분해 보관한다. GitHub Actions의 `site-check-evidence` artifact도 참고한다.
3. 직접 실행한 기능은 [SITE-CHECK-TEMPLATE.md](docs/handoff/SITE-CHECK-TEMPLATE.md) 형식으로 `docs/handoff/site-check-latest.md`에 정리하고 사본을 `docs/handoff/site-check-history/`에 보존한다. 실패·미검사 항목 ID와 보고서 경로를 인수인계에 연결한다. 이것은 실제 실행 후 작성하며 템플릿 자체를 결과로 삼지 않는다.
4. 실패가 남으면 BLOCKED로 넘긴다. 실패 내용을 숨기거나 phase를 직접 COMPLETE로 바꾸지 않는다. **사이트 검사 FAIL/UNVERIFIED가 있으면 운영 gate가 PASS여도 전체 기능 정상이라고 말하지 않는다.**
5. 코드뿐 아니라 HANDOFF.json, handoff/ 전체, docs/handoff/current.md, public/handoff-status.json과 사이트 검사 증거를 보존한다.
6. 사용자가 GitHub 홈페이지에서 직접 올린다. 업로드본은 경로 유지 후 루트에 담고 `.github/workflows/handoff-check.yml`을 포함한다.
7. 다음 AI는 다시 시작 절차를 실행한다. 웹 업로드 뒤 커밋 SHA를 사용자에게 수기로 교체시키지 않는다.

## 완료와 자동화 범위
모든 필수 gate가 PASS인 최신 동일 소스 증거만 `handoff` 상 COMPLETE다. 한 개라도 FAIL/UNVERIFIED/NOT_RUN이면 BLOCKED다. 별도의 전체 사이트 점검에 실패가 있으면 실제 전체 기능 완료가 아니다.
오래된 증거는 handoff:status/check에서 UNVERIFIED다. 최종 판정 직전에는 finish로 재검증한다.
GitHub push/PR/수동 Actions 실행과 일부 배포 이벤트에 자동 검사가 실행되고, 추가 사이트 검사도 선행 gate 실패 여부와 관계없이 실행된다. 작업 중단 상황에서도 artifact를 저장한다.
Actions는 다음 AI를 호출하지 않는다. 새로운 AI에게 저장소와 “이어서 진행해”를 제공하면 해당 AI가 이 절차를 수행한다. 모델 API 키는 필요 없다.

## 과제 기록
원래 A/B 비교의 고정 상한과 과거 기록을 보존한다. 이번 시스템 보완은 후속 작업이다.
실제 과거 사용량·서로 다른 모델 여부·학생 판단은 증거가 없으면 미확인으로 남긴다.
`handoff/submission.json`은 본인 사실을 기록하는 입력이며 매 인수인계용 프롬프트가 아니다.

명령 뜻: npm은 Node.js 패키지 관리 도구, ci는 clean install(잠금 파일 기반 설치), run은 스크립트 실행이다. resume은 이어받기, finish는 종료·인계, status는 상태 확인, check는 검사를 뜻한다. npx는 Node 패키지 실행 도구이며 Playwright는 브라우저 자동화 도구다.
