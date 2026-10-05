# METAL / NOTE v3.1 — 금·은 시세

금·은만 조회합니다. 달러·원화 가격, 적용 환율·기준 시각, 차트와 날짜별 기록을 표시합니다. 과제 검증과 예약 수집은 금만 사용합니다.

**업데이트 순서: docs/업데이트-적용.md. 기존 사용자는 sql/004_gold_silver_only.sql 실행 후 파일 교체·재배포가 필요합니다.**

Gold API와 키 없는 ExchangeRate-API를 사용합니다. 환율은 하루 1회 갱신되며 실시간 환율이 아닙니다. 원화값은 원천 USD 값에 환율을 곱한 참고값입니다.

npm test / npm run build / npm run verify:assets. 실제 배포 화면, 두 날짜 증빙과 과정 영수증은 별도로 확인하세요.
