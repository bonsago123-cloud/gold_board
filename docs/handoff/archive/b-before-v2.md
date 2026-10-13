# 현재 인수인계 — task5-copper-live

## 1. 목표
구리 현재 시세 조회 기능의 실패 처리와 복구를 완성하고 고정 검사 T05-CU01~T05-CU10을 유지한다.

## 2. 현재 상태
구현 상태 COMPLETE, 제출 준비 미완료. B 완료 소스 버전: `12596fe1fa4748c348f3bc07b639cccf107aba4b`.
이 문서를 포함한 후속 커밋은 증거·보고서 메타데이터 기록이다.
A 종료 및 B 시작 버전: `1241e3eb923468e93b6bc9cbccef33f7201a9137`.
원문은 `docs/task5/evidence/ai-a-handoff.md`, 원본 manifest는 `docs/task5/evidence/ai-a-HANDOFF.json`에 보존했다.
마지막 정상값/stale, 429/Retry-After(초·HTTP 날짜), 10초 timeout, offline, 오류 안내, 중복 요청 차단과 복구 구현 완료.

## 3. 실행 명령
Node.js 24.x, npm 필요. 외부 npm 의존성이 없어 설치 명령 불필요.
저장소를 새 폴더에 clone한 뒤 그 폴더에서 실행한다.
```bash
npm run handoff:check
npm run task5:check
npm test
npm run build
npm run dev
```
Windows PowerShell에서 실행 정책 오류가 나면 npm 대신 npm.cmd를 사용한다.
`npm`은 Node.js 패키지 관리 도구이며 `run`은 package.json의 이름 붙인 스크립트를 실행한다.
고정 검사와 빌드는 환경값 없이 실행된다. 기존 금·은 서버/DB 사용은 기존 설치안내의 환경값이 필요하며, 비밀값을 보고서에 넣지 않는다.
로컬 정보판: http://localhost:3000 / 비교 보고서: http://localhost:3000/task5.html

## 4. 통과 검사
고정 검사 T05-CU01~T05-CU10: 10/10 PASS. 문서·검사 코드 변경 0건.
B 실행 회차 2회: 처음 5/10, 수정 후 10/10. FAIL 회차 1회.
기존 및 추가 회귀 검사 33/33 PASS, build PASS.
추가 회귀 검사는 Retry-After 정확한 경계, HTTP 날짜, 실제 abort 타이머, 동시 요청, 본문 오류를 확인한다.
결과: `docs/task5/evidence/ai-b-fixed-tests.txt`, `ai-b-regression.txt`, `ai-b-build.txt`.

## 5. 남은 문제
- 실제 원천 GET에서 HTTP 404 확인. 모의 자동 검사 통과를 실제 가격 수신 성공으로 해석하지 않는다.
- A 실제 사용량과 FAIL 회차가 미기록. 커밋 시각 차이를 실제 작업시간으로 대신 쓰지 않는다.
- A 실제 모델이 없어 서로 다른 서비스/모델 여부 확인 불가. B를 Claude로 기록하지 않는다.
- 사용자 요청 수는 이 턴의 작업 요청 1회로 관측했지만 A와 집계 단위 일치 여부는 미확인이다.
- 학생 본인의 도구 선택 기준/판단 3줄 필요.
- 브라우저 검사는 Chromium 실행 파일 부재 및 다운로드 실패로 미실행. 새 시크릿 창 공개 URL 확인 필요.

## 6. 다음 행동
1. 실제 원천 복구 및 공개 배포 화면을 확인한다. 고정 원천·검사 변경이 필요하면 별도 판단을 받아 변경 이력을 남긴다.
2. A 사용량·모델 증빙과 학생 판단을 채운다. `public/task5.html`은 확인 대기 상태를 명시한 비교 보고서다.
3. 과제 전체 통과는 위 미확인 항목 해결 후 판단한다. 자세한 누락 전후: `docs/task5/handoff-gaps.md`.

## 7. 건드리지 말 것
기존 금(XAU)·은(XAG) 조회/저장/검증, Supabase 스키마, 과제4 실제 이틀 증빙, 공식 T04 fixture/hash/검사, .env와 비밀값, 고정 검사 문서 및 실행 코드의 ID·입력·기대값.
