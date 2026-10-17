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

## 사용자 추가 요구: 금·은·비트코인 탭

기본 금 탭을 유지하고 BTC는 선택할 때만 표시한다. BTC에서 금은 자동 조회를 중단하며, BTC 현재가/시각은 탭 이동으로 초기화하지 않는다. 각 차트는 재표시 때 크기 계산을 위해 다시 마운트한다. URL ?asset=BTC로 BTC 탭을 직접 열 수 있다.

고정 BCH01은 루트 첫 화면에서 BTC 요소가 보이기를 기대하므로 새 요구와 충돌한다. 고정 검사 파일은 변경하지 않았다. 브라우저 설치 후 해당 실패는 숨기지 말고 기록해야 한다. 탭을 먼저 선택하는 별도 검사로 새 요구를 확인하되 기존 검사 PASS로 대체하지 않는다.

## 공통 UI·KRW 및 자동 검사 추가

- 금은과 동일 CSS 클래스로 남색 USD/KRW 카드·출처/두 시각 패널 구현. KRW는 동일 FX 클라이언트를 공유하며 기존 환율 API·갱신 주기는 변경하지 않음.
- mock BTC 82,138.65625 USD × 1,400 KRW/USD = 표시 114,994,119 KRW. 미반올림 원값으로 계산. FX 없음은 —, 이전 FX 1,300 사용은 명시 안내.
- 추가 UI 테스트 10/10 PASS. 최초 추가 fixture의 전역 const 충돌은 IIFE로 수정했으며 최초 결과도 session history에 보존. 제품 코드는 테스트 조건을 위한 우회 없음.
- 기존 frozen 차트 fixture에도 전역 const s 중복 선언이 있고 기본 금 탭에서 BTC가 숨겨져 원본 결과 2/10. 원본 파일 변경 없이 결과를 보존.
- Playwright 기본 다운로드 실패 대신 scratch의 @sparticuz/chromium 패키지에서 Chromium 153.0.8010.0을 추출해 실행. fixture와 테스트 코드는 그대로, 브라우저 실행 경로만 로컬 설치. CI는 기존 Playwright 브라우저 설치 유지.
- 데스크톱/390px 모바일 구조·가로 넘침 검사 PASS. 이 환경에는 한글 폰트가 없어 스크린샷 글리프는 제한됨; DOM 한국어 문구 및 동작은 검증. 차트 script 모형은 실데이터 표시 증거가 아님.
- 이번 요청 전 중단 세션은 실제 경과시간을 보존한 interrupted 기록으로 종료. 새 요청의 새 세션이 부모를 연결. 과제 비교에 제한 초과 세션을 통과 대상으로 사용하지 않음.

운영 사이트 점검: curl HEAD HTTP200, Chromium 직접 탐색 net::ERR_EMPTY_RESPONSE. 브라우저 연결이 없는 상태에서 후속 버튼 검사는 유효한 실제 기능 증거가 아니며 실행 제한시간 종료 시 미확인으로 남긴다. HTTP200으로 화면 동작 성공을 대체하지 않는다.

실제 사이트 자동 검사 개선: 탐색 실패 후 무효한 버튼 대기를 중단. 각 독립 페이지는 계속 탐색하고 접근 못한 화면의 행동은 UNVERIFIED로 남긴다. finish 첫 시도는 중단 후 동일 세션 시간/요청 수를 유지하여 다시 실행.
