# 현재 인수인계 — task5-copper-live

## 1. 목표
과제4 금·은 정보판에 구리(CU) 현재 시세 조회 기능을 추가하고 고정 검사 T05-CU01~T05-CU10을 최종적으로 모두 통과시킨다.

## 2. 현재 상태
AI A는 성공 경로를 구현하고 계획된 중단 지점에서 작업을 종료했다.

구현 완료:
- 메인 페이지에 `구리 시세` 영역과 `구리 조회` 버튼 추가
- 인증 없는 `https://metalmarket.cash/api/v1/prices/copper` GET 연결
- 정상 응답의 `id=copper`, `symbol=CU`, 양수 가격, `USD/t` 검증
- 정상 응답을 CU/가격/단위/조회 시각/공개 출처 형태로 정규화
- 성공 시 가격·단위·KST 조회 시각·MetalMarket.cash 출처 표시

의도적으로 미완료:
- 실패 시 마지막 정상값 보존 및 `stale`
- HTTP 429 / Retry-After
- timeout / offline 구분
- 실패 원인과 다시 시도 안내
- 재시도 가능 시각 전 중복 요청 차단 및 성공 복구

## 3. 실행 명령
```bash
npm.cmd run handoff:check
npm.cmd run task5:check
npm.cmd test
npm.cmd run build
```

PowerShell에서 `npm.ps1` 실행 정책 오류가 나면 `npm` 대신 `npm.cmd`를 사용한다.

## 4. 통과 검사
AI A 자동 검사 결과:
- T05-CU01 PASS
- T05-CU02 PASS
- T05-CU03 PASS
- T05-CU04 PASS
- T05-CU05 PASS
- T05-CU06 FAIL
- T05-CU07 FAIL
- T05-CU08 FAIL
- T05-CU09 FAIL
- T05-CU10 FAIL

현재 `npm.cmd run task5:check`의 `RESULT 5/10`과 종료 코드 1은 계획된 인수인계 상태다. 고정 검사 문서는 수정하지 않는다.

## 5. 남은 문제
현재 `public/copper-client.mjs`는 실패하면 `request_failed` 하나로 처리하고 `last_good`을 지우며 `due=0`으로 둔다. `public/copper-core.mjs`도 429, Retry-After, AbortError와 일반 네트워크 실패를 아직 구분하지 않는다.

## 6. 다음 행동
AI B는 저장소와 이 문서만 보고 다음을 수행한다.

1. `npm.cmd run handoff:check`
2. `npm.cmd run task5:check`로 T05-CU06~T05-CU10 실패 재현
3. `public/copper-core.mjs`에 429/Retry-After/timeout/offline 분류 구현
4. `public/copper-client.mjs`에 마지막 정상값 보존, `stale`, `due`, 중복 요청 차단, 성공 복구 구현
5. `public/dashboard.mjs`에 실패 원인과 다시 시도 안내 구현
6. 같은 고정 검사에서 `RESULT 10/10` 달성
7. 기존 `npm.cmd test`와 `npm.cmd run build` 회귀 확인
8. `HANDOFF.json`의 phase를 `COMPLETE`로 갱신하고 B 종료 커밋 SHA 기록

## 7. 건드리지 말 것
- 기존 금(XAU) 조회·저장·검증
- 기존 은(XAG) 조회·저장·검증
- Supabase 스키마
- 과제4 실제 이틀 증빙
- 공식 T04 fixture·hash·검사
- `.env*`와 비밀값
- `docs/task5/copper-fixed-tests.md`의 검사 ID·입력·기대값
