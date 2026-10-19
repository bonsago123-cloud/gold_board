# C26 증빙 보완 — 2026-10-19

첫 실행 시작98개·인계100개·완료100개 파일을 당시 저장한 SHA-256 manifest와 전부 일치하도록 복원했다. 실제 소스 ZIP과 Git bundle, 두 실행의 시작·종료 고정 커밋 쌍을 source-versions에 보존했다. 복원 커밋은 2026-10-19 새로 생성한 것이며 과거 작성으로 소급하지 않았다. 범위는 당시 manifest에 기록된 소스 전체이며 기록 밖의 문서·설정까지 복원했다고 주장하지 않는다.
검증 및 사용법: docs/task5/chart-restart/final/source-versions/README.md. 과거 시작 버전 불완전 안내는 이 복원 결과로 보완한다.

# 완료 후 제출 정리 안내 — 2026-10-19

차트 구현 성공. 완료 업로드 커밋 533f7dfbbdf1742b74a9437cd33c075be29bf721. Actions와 고정 환경 재검사, 실제 페이지 확인까지 완료했다. 아래의 당시 미확인 항목 중 설치 환경·실제 차트 확인은 docs/task5/chart-restart/final/verification.md로 보완했다. 보고서와 제출문은 같은 final 폴더에 있다. 기능 재구현이나 새 실험은 필요 없다. 두 작업자의 원본 인수인계는 history의 outgoing/received 파일 그대로 보존한다.

---

# 현재 인수인계 — BTC 차트 새 작업

## 1. 목표
BTC 차트를 완성한다. 작업자 수 제한 없음. docs/task5/chart-restart/REQUEST.txt 및 고정10개를 유지한다.

## 2. 현재 상태
FEATURE_COMPLETE; 세션 2026-10-17T07-34-01-296Z; 기준 커밋 e1ec0ca9b895665170284afc75b101e334d9af8b; 소스 SHA-256 72f14fd1d5e079018a60b2b696fd1294302e7a8dff3b14471b3cdf2cd720ce9f. 업로드 종료 커밋은 업로드 후 확인 필요.
public/bitcoin-chart.mjs에 BTCUSD(BITSTAMP:BTCUSD) 차트를 연결했다. market.mjs의 mountWidget·CHART_INTERVALS를 재사용하고 market.mjs와 금·은 코드는 바꾸지 않았다. 기본 간격 1시간·Asia/Seoul. 간격 change와 다시 불러오기는 호스트를 비운 뒤 위젯 1개만 다시 붙여 중복 프레임이 생기지 않는다. 비트코인 탭을 처음 보일 때 지연 마운트하고 탭을 다시 열어도 재요청하지 않는다. 이전 마운트의 늦은 오류가 새 마운트의 상태 문구를 덮어쓰지 않게 막았고 pagehide에서 정리한다. 스크립트 요청 실패 시 안내가 뜨고 다시 불러오기로 복구된다. public/index.html의 '차트 연결 기능은 구현 중' 문구를 x축·y축 단위 안내로 교체했다. 현재가·원화·DB·고정검사·freeze는 변경하지 않았다. 고정10개 10/10(연속 5회 동일), npm test 46/46, npm run build 통과.

## 3. 실행 명령
Node 24: npm ci → npx playwright install chromium → npm run handoff:resume → npm run chart:check. 끝날 때 notes.json 작성 → npm run handoff:finish. 이미 열린 세션을 다른 작업자가 인수하면 npm run handoff:takeover. 자세한 규칙은 docs/task5/chart-restart/PROTOCOL.md.

## 4. 통과 검사
BTC-R01: PASS
BTC-R02: PASS
BTC-R03: PASS
BTC-R04: PASS
BTC-R05: PASS
BTC-R06: PASS
BTC-R07: PASS
BTC-R08: PASS
BTC-R09: PASS
BTC-R10: PASS
결과: handoff/restart/latest.json. 합성 검사이며 배포 확인과 별개다.

## 5. 남은 문제
고정10개는 가짜 제공자 스크립트를 쓰는 합성 검사이므로 실제 TradingView 위젯과 BITSTAMP:BTCUSD 표시는 이 환경의 네트워크 제한으로 확인하지 못했다(UNVERIFIED). 배포 뒤 사람이 비트코인 탭에서 직접 확인해야 한다. 이 세션은 npm 레지스트리 접근이 정책으로 거부되어 npm ci를 실행하지 못했다. 사전 설치된 Playwright 1.56.0과 Chromium(PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH), Node v22.22.0(요구 24.x)으로 같은 고정검사를 실행했으며, 고정 버전 Playwright 1.62.1과 Node 24에서의 재확인은 아직 없다. 가짜 스크립트 밖의 보조 점검(탭 재진입, 금 차트 무영향, ?asset=BTC 직접 진입, 콘솔 오류 없음, 옛 스크립트의 늦은 error 이벤트 모의)은 저장소에 넣지 않은 임시 스크립트로만 수행했다. 모델은 설정값이 claude-sonnet-5-5이나 실제 제공 모델은 UNVERIFIED. 업로드 시작·종료 커밋은 사용자 업로드 뒤 확인 필요. 이 결과는 기능 완료 판정일 뿐 과제 제출 완료 증거가 아니다.

## 6. 다음 행동
새 기능을 만들지 말고 확인과 증거만 이어간다. (1) 사용자가 변경 파일을 GitHub에 직접 업로드한다. (2) Node 24와 고정 Playwright 1.62.1 환경(Actions 또는 npm ci 가능한 로컬)에서 npm run chart:check로 10/10을 다시 확인한다. (3) 배포 화면의 비트코인 탭에서 실제 차트 표시, 간격 8종 변경, 다시 불러오기를 사람이 눈으로 확인하고 결과를 기록한다. (4) 업로드 시작·종료 full commit과 과제 제출 증거(서로 다른 서비스 또는 모델의 두 실행, 동일 인계, 공개 비교표, 본인 판단 3줄)를 별도로 준비한다. 차트 외 기능 추가 금지.
완성하지 못해도 finish로 기록하고 다음 작업자가 동일 절차를 반복한다.

## 7. 건드리지 말 것
새 고정10개·freeze, 과거 증거, 금·은·현재가·원화·DB·T04. 사용자가 직접 업로드. 과제 제출 완료는 기능 완료와 별도이며 다른 모델/서비스의 두 실행과 본인 판단 증거가 필요하다.
