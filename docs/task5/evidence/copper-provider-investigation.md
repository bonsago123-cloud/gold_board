# 구리 API 조사 — 2026-10-14

## 실행 범위
저장소 6336e975438394e3a6762cf05eefd7efe77f4edc를 새 폴더에 복제하고 Node 24.19.0에서 npm ci와 handoff:resume을 실행했다. 이번 실행은 후속 조사이며 과거 A/B 실험 사용량이나 모델 차이 증거로 사용하지 않는다.

## 관찰
- 고정 검사 10/10, 회귀 검사 39/39, 빌드 및 실제 배포 파일 일치 PASS.
- https://metalmarket.cash/developers/metal-price-api 는 HTTP 200이며 /api/v1/prices/{metal_id}, copper ID, /api/v1/prices, /api/docs를 안내한다.
- 문서에 적힌 /api/v1/prices/copper, /api/v1/prices, /api/docs는 실제 GET에서 모두 HTTP 404와 HTML을 반환했다. CORS 허용 헤더도 없었다.
- 확인 시각, 주소, 상태, 응답 유형은 같은 폴더의 copper-provider-investigation.json에 보존한다.
- 따라서 단순히 문서대로 URL을 수정해서 해결할 수 있는 다른 정상 경로는 확인하지 못했다. 제공자 전체의 영구 중단 여부까지 입증한 것은 아니다.

## 결정이 필요한 이유
AGENTS.md는 고정 검사 ID·입력·기대값·실행 코드를 변경하지 않도록 요구한다. T05-CU04와 CU05는 고정 엔드포인트 및 MetalMarket.cash 출처에 의존한다. 다른 제공자로 교체하고 동일한 실험이 통과했다고 기록하면 원래 비교 조건을 위반한다.

## 다음 행동
1. 원래 실험과 고정 검사는 그대로 보존한다. 현재 상태는 BLOCKED다.
2. 제공자 복구를 기다려 같은 검사로 재검증하거나, 사용자가 출처 변경을 결정하면 별도 실험에서 새 출처·검사 10개·공통 상한을 구현 전에 고정한다.
3. 실제 A/B 사용량, 다른 모델 사용 여부와 학생 판단의 미확인 값은 추측해서 채우지 않는다.

과거 대화를 재요청할 필요는 없다. 이번 조사 자료와 handoff/latest.json으로 다음 작업을 이어간다.
