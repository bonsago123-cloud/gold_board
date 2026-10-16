# BTC B 작업 및 후속 인계 — 2026-10-16

## 1. 목표
저장소와 첨부 과제5 원문을 읽고 BTC 현재가 조회만 구현. 고정10개, 30분/사용자 지시10건 유지. 금·은·환율 코드, DB 스키마, 공식 fixture, 구리 보관 파일은 변경하지 않음.

## 2. 현재 상태와 변경
- 시작 소스/A 종료 업로드: `549b5176e83d878b92779055686d82e5968846b9`. 작업 전 배포 파일 4개가 이 소스와 동일함을 resume에서 검증.
- `bitcoin-core.mjs`: GET, AbortController, 응답 본문까지 제한시간 적용, HTTP/JSON/네트워크 구분, Retry-After 숫자/날짜.
- `bitcoin-client.mjs`: 최초 실패 error, 성공 뒤 실패 stale 및 마지막 가격·두 시각 보존, 복구 fresh/none, 동시 클릭 차단, 최소30초/Retry-After 대기, 독립 상태 사본.
- `dashboard.mjs`, `index.html`: 조회 버튼, 가격·단위·두 시각·오류·대기 안내 연결. BTC는 DB나 금·은 수집을 변경하지 않음.
- `task5.html`: BTC 익명 비교/확인법/미확인 학생 판단 추가. 구리 과거 결과는 별도 보관 구역으로 유지.
- 인계 생성기의 고정된 “미구현/첫 실패 BTC03” 문구를 수정. 변경 작업트리의 HEAD를 B 종료 커밋으로 가장하지 않고 end_commit=null, end_base_commit와 digest를 남김.
- 추가 회귀 3개는 본문 타임아웃, 동시 클릭/상태 사본, HTTP 날짜 Retry-After를 확인. 고정10개와 실행코드·freeze는 그대로.

## 3. 실행과 재현
Node v24.19.0에서 새 clone으로 `npm ci` 성공. `npm run handoff:resume` 실행 후 구현.
`npm run task5:check` → `npm test` → `npm run build` → `npm run handoff:finish`.
마지막 통합 결과는 `handoff/latest.json`, 종료 사용량은 `handoff/session.json`.
명령 뜻: npm=Node 패키지 관리 도구, ci=clean install(잠금 파일 기준 설치), run=등록 스크립트 실행. resume=재개, finish=종료·인계.

## 4. 검사 결과와 근거
- 처음 고정10개 2/10, 구현 후 10/10. 첫 실패 회차는 1회. finish까지 동일 검사를 총3회 실행 예정이며 최종 결과는 latest 및 history와 대조.
- 기존 회귀 41/41, 추가 BTC 회귀 3/3 실행 통과. 최종 통합 회귀는 finish에 기록.
- Git 최초 BTC 업로드 커밋과 freeze 바이트 일치 PASS. 검사/기대값 삭제·완화·변경 0건.
- 새 fetchBitcoinQuote로 실제 원천값 82073.726562 USD/BTC 수신. source_at 2026-10-16T03:18:48Z, fetched_at 03:18:55.433Z. `docs/task5/bitcoin/b-live-api.json`.
- 실제 운영 사이트 UI 직접 점검: `docs/handoff/site-check-2026-10-16.md`. 합성 검사와 실제 조회를 구분. 금·은 다운로드 원본과 내용 검사도 BTC 증거 디렉터리에 보존.
- 운영 사이트 BTC는 아직 준비 버튼이 비활성: FAIL. 로컬 수정은 업로드 전이므로 배포 일치 실패가 예상됨. 로컬 BTC 브라우저 렌더링은 미확인.

## 5. 남은 문제 / 인계 누락 보완
- Chromium 및 headless-shell 공식 다운로드 모두 손상 ZIP으로 설치 실패. site:check는 SETUP UNVERIFIED. 반복 설치로 성공을 가장하지 않음.
- 별도 cloud browser는 실제 배포 UI를 확인할 수 있었으나 로컬 127.0.0.1:3000은 CONNECTION_REFUSED. 로컬 서버와 cloud browser가 분리돼 있음.
- BTC 출처 링크 직접 브라우저 접속은 ERR_BLOCKED_BY_CLIENT. Node 실제 API 수신은 성공했지만 이를 브라우저 CORS 성공으로 대체하지 않음.
- 차트 휠/범위 클릭으로 확대·축소 변화가 명확히 확인되지 않아 UNVERIFIED. 전체 기능 통과 아님.
- 다른 모델 사용 증명, 학생 판단 3줄, 학생 도구 선택 기준은 없음. 임의 작성·PASS 처리하지 않음. A 기록의 정확한 모델 ID도 미확인.
- 사용자는 저장소/첨부만 제공했으며 구현 판단에는 저장소만 사용. 실행 환경에 사전 요약이 존재하므로 엄격한 무이전맥락 실험 조건 충족을 독립 증명하지 않음.
- 받은 current.md 해시 `95f20aa83eabe6c931c0ac849a2738494fe6fffc5d4badb02fc92877e2040f98`는 a-end와 동일. resume이 원문을 history/*.received.md에 보존.
- 이전 미종료 session은 이번 시작 기록의 inherited_session에 연결; 이번 사용량으로 재활용하지 않음.
- 첨부 과제5와 저장소 assignment.txt는 줄바꿈을 제외한 내용 동일.
- 기존 인계 생성기가 검사를 통과해도 미구현 문구를 계속 쓰는 누락을 발견해 수정. 수정 전 원문은 received.md, 수정 후는 current.md.

## 6. 다음 행동
1. ZIP을 풀고 내용물을 저장소 루트에 경로 그대로 업로드. ZIP 파일 자체를 올리지 않음. upload/ 폴더 사용 금지.
2. 사용자 업로드 커밋을 B 종료 소스로 기록. 배포 후 그 커밋을 새 clone하여 resume/finish와 site:check 재실행.
3. 실제 BTC 버튼 → 양수 가격/출처/두 시각 → 30초 재조회 제한을 확인. 격리 브라우저에서 실패·재시도·복구 UI도 확인.
4. 사이트 보고서 UNVERIFIED를 해소하고 manual.json에 해당 소스 digest/실행시각/진짜 증거를 기록. 모든 gate PASS 전 COMPLETE 금지.
5. A/B 모델 차이와 학생 판단, 공개 보고서 접근 및 종료 커밋을 확인 후 submission 검토. 이번 작업 종료는 과제 완료가 아님.

## 7. 건드리지 말 것 / 측정
고정 검사·freeze/공식 T04/금·은·환율·DB/구리 과거 증거. 비밀값과 대화 전문을 넣지 않음.
사용자 작업 지시 1건(상한10), 시작 2026-10-16T03:16:47.777Z. 실제 종료와 초 단위 시간은 session.closed_at/elapsed_seconds가 기준(상한1800초). 준비 조사 제외. 도구/API 횟수는 사용자 요청 수와 별도이며 정확한 총합은 미집계.
