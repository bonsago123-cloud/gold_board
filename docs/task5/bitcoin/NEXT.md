# 다음 AI가 완성할 작업

## 현재 경계
사용자 요청: 비트코인 선택, 구리 화면 제거, 이번 AI는 전부 완성하지 않고 다음 AI가 이어받는다.
A가 완료: 고정10개와 공통 상한을 구현 전에 freeze; normalizeBitcoin; 준비 화면; 구리 호출 제거; 통합 검증·인계 절차.
B가 완료할 것: BTC 전송/오류/상태/화면 한 기능. DB 기록·차트·코인 추가로 범위를 늘리지 않는다.
구리 소스 두 파일은 옛 검사 재현에만 남기며 빌드 산출물에서는 제외한다. 과거 비교 보고서는 역사 기록이다.

## 첫 실패와 구현 순서
1. `npm run handoff:resume`. 첫 로컬 기능 실패는 T05-BTC03. Git anchor가 미확인이면 최초 업로드 전인지 확인한다.
2. `public/bitcoin-core.mjs`의 fetchBitcoinQuote를 완성한다. options={fetcher, now, timeoutMs}; Promise<정규화 quote> 반환. AbortController, 429 Retry-After, 500, HTML/JSON 오류, offline 구분. 정상 예시를 실제 응답으로 속이지 않는다.
3. `public/bitcoin-client.mjs`의 createBitcoinClient(onChange, options)를 완성한다. view()는 상태 사본; request()는 Promise<boolean>. 정상/오류 모두 최소30초 대기, 429는 Retry-After 이상 대기. 마지막 정상 quote와 두 시각 보존; 복구 fresh/none.
4. dashboard.mjs에서 BTC 모듈을 연결하고 bitcoin-* DOM을 렌더링한다. 금·은 렌더를 건드리지 않는다. 버튼의 준비 문구/disabled를 실제 상태로 바꾼다. 숫자·단위·출처·두 시각·오류·대기 시간 표시.
5. `npm run task5:check`, `npm test`, `npm run build`; 이후 `npm run handoff:finish`. 모의10개 통과 후 실제 사이트 검사 실패도 해결한다.
6. 로컬과 배포가 다르면 사용자 업로드를 기다리는 BLOCKED 인계로 넘긴다. 업로드 뒤 동일 소스로 다시 검증한다.
7. `docs/handoff/SITE-CHECK.md`에 따라 자동검사 밖 항목도 실행. `handoff/bitcoin/manual.json`은 실제 증거가 있을 때만 채운다.
8. 공개 `task5.html`에 비트코인 익명 A/B 비교표와 확인법4줄을 추가한다. 실제 시간/요청/FAIL 회차/통과 수/시작종료 커밋, 다른 모델 증거, 동일 인계 증거, 학생 판단3줄을 확보한다. 미확인 값은 추정 금지.

## 출처 계약
Gold API 공식 문서: https://gold-api.com/docs 및 https://gold-api.com/llms.txt (2026-10-14 확인).
공식 문서는 BTC, /price/{symbol}, 기본 USD, 키 없는 조회 및 30초 캐시를 설명한다.
endpoint: https://api.gold-api.com/price/BTC. 실제 endpoint 성공은 별도 live_api/site gate로 확인한다.
웹 조회 도구에서는 endpoint 접근 불가였지만, 이후 로컬 live_api gate가 HTTP200과 CORS 및 BTC 응답 정규화 성공을 확인했다(2026-10-14T07:00:23Z). 실제 화면 기능 완료와는 별개다. 최신 handoff 이력에서 다시 확인한다.
정규화는 currency USD 명시 응답을 요구한다. 실제 응답에 currency가 없다면 조건을 몰래 완화하지 말고 문서와 실제 응답의 차이를 기록한다.

## A/B 측정
고정 상한: 각 30분, 사용자 작업 지시 10건. 도구 호출은 이 요청 수에 포함하지 않는다.
A 시작: a-start.json. A 종료: a-end.json. 도구 호출수와 사용자 요청수를 혼동하지 않는다.
A의 정확한 모델 ID는 확인되지 않음. B를 다른 서비스로 선택하면 서비스 차이를 검증하기 쉽다.
B 시작 전 받은 current.md 바이트를 별도 evidence 파일로 보존한다. resume이 받은 해시를 session.json에 기록한다.
A 종료 업로드 커밋이 있어야 B 시작 소스를 고정할 수 있다. 로컬 수정 상태의 기준 HEAD를 A 종료 커밋으로 쓰지 않는다.
과거 구리의 상한/측정과 섞거나 BTC 검사를 옛 A 시작 때 이미 고정했다고 주장하지 않는다.

## 빠진 환경값
BTC는 API 키 불필요. 기존 금·은 DB 기능에는 기존 배포의 환경설정이 필요하다.
새 환경에 값이 없으면 .env.example을 읽고 해당 gate를 미확인으로 남긴다. 비밀값을 보고서/ZIP에 넣지 않는다.
