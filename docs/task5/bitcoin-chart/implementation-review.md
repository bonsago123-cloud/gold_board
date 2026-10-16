# 차트 구현과 검증 제한

- 입력 근거: 새 clone의 AGENTS.md, 현재 인수인계, 고정 검사 및 과제 원문. 이전 대화 검색 없음.
- 받은 인수인계 원문과 해시는 handoff/chart/history의 이번 세션 received.md 및 session.json에 보존.
- 첫 검사와 구현 뒤 직접 검사는 모두 브라우저 실행 불가로 10개 UNVERIFIED. FAIL 회차 0은 통과를 뜻하지 않는다. 종료 검사는 latest.json 참조.
- npm ci 성공, Node 24.19.0. Chromium 전체 및 headless-shell 설치 모두 다운로드 ZIP 손상으로 실패. 고정 검사 파일 수정 없음.
- 공식 TradingView Advanced Chart 문서: https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/
- 공식 BTCUSD 위젯 예시: https://www.tradingview.com/widget-docs/widgets/charts/mini-chart/demos/monthly-crypto/
- 공식 출처에 있는 BITSTAMP:BTCUSD를 사용. 실제 이 환경의 위젯 데이터 표시는 아직 미확인.
- 차트 간격 변경/재시도는 mountWidget만 호출. 현재가/DB 클라이언트를 가져오지 않는다.
- 원천 갱신 지연: 메인 안내 영역은 source_stale일 때 숨김. 오래된 값 배지/가격/시각/실제 오류 판정은 그대로. 금·은 검증 페이지에는 설명과 기존 실제 오류 표시가 남음. 서버 연결 실패 안내는 계속 노출.
- task5.html의 기존 현재가 시간 칸에 새 차트 세션 시간이 잘못 표시될 수 있었음. 차트 표를 분리하고 예전 칸은 미확인으로 보존.
- 인계 누락 보완: SITE-CHECK 마지막 현재 경로가 이전 현재가 실험을 가리켰음. 차트 경로로 정정; 고정검사 및 과거 인계 사본 변경 없음.
- 자동 생성 HANDOFF.json의 source_commit이 갱신되지 않던 문제를 수정. 기준 HEAD와 업로드 종료 commit은 별개이며 종료 commit은 업로드 전 null.
- 실제 배포/전체 기능/모바일/외부 링크/이틀 실데이터/자동 갱신 경과 검사는 브라우저 설치 실패로 UNVERIFIED. 모의 결과로 대체하지 않음.
- GitHub 원격 쓰기 및 배포 없음. 사용자가 ZIP 업로드 후 Actions artifact와 실사이트를 다시 확인해야 함.
