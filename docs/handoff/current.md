# 현재 인수인계 — task5-copper-live

## 1. 목표
과제4 금·은 정보판에 구리(CU) 현재 시세 조회 기능 한 개를 추가한다. 구리 데이터는 인증 없는 공개 REST API를 사용한다.

## 2. 현재 상태
AI A 시작 전 상태다. 기존 금·은 기능은 과제4 완료 상태이며 구리 기능은 아직 구현하지 않았다.

## 3. 실행 명령
```bash
npm install
npm run handoff:check
npm test
npm run build
```

AI A 구현 후에는 `npm run task5:check`도 실행한다.

## 4. 통과 검사
아직 AI A 구현 전이므로 T05-CU01~T05-CU10은 미실행이다. 원문은 `docs/task5/copper-fixed-tests.md`에 고정되어 있다.

## 5. 남은 문제
구리 조회·정규화·표시 기능 전체가 아직 미구현이다.

## 6. 다음 행동
AI A는 T05-CU01~T05-CU05를 목표로 성공 경로를 구현하고, T05-CU06~T05-CU10에 해당하는 복원력 기능은 B에게 남긴다.

## 7. 건드리지 말 것
기존 금·은 저장 로직, Supabase 스키마, 과제4 실제 이틀 증빙, 공식 T04 검사, 비밀값을 변경하지 않는다.
