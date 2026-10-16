# 실제 운영 사이트 직접 점검 — 2026-10-16

대상: https://goldboard-omega.vercel.app · KST 12:17–12:28 · 별도 Chrome 브라우저, 로그인 없이 실행.
시작 배포는 549b5176e83d878b92779055686d82e5968846b9 기준. 수정본 업로드 전 운영 상태이며 로컬 완료 증거가 아니다.
결과: {'PASS': 62, 'FAIL': 1, 'UNVERIFIED': 8}
자동 site:check는 브라우저 설치 실패로 UNVERIFIED. 아래 직접 확인은 별도 관찰이며 그 gate를 PASS로 덮어쓰지 않는다.

| ID | 경로 | 입력/행동 | 결과 | 관찰 |
|---|---|---|---|---|
| HOME | / | 무로그인 정보판 열기 | PASS | 금·은·BTC 영역 표시. 당시 배포는 시작 커밋과 파일 바이트 일치(resume). |
| GOLD | / | 금 조회 버튼 | PASS | 4174.799805 USD/트로이온스, 5605675 KRW, source 12:17:47/fetched 12:18:09 KST 정상. |
| SILVER | / | 은 탭 전환 및 실제 조회 | PASS | 57.833 USD/트로이온스, 77655 KRW, source 12:18:16/fetched 12:18:20 KST 정상. |
| GOLD-TAB | / | 금 탭/홈 복귀 | PASS | 금 제목, 금 기록, XAU 차트 표시. |
| AUTO-ON | / | 자동 조회 켜기 및 대기 | PASS | 12:24:25와 12:24:57 조회시각, 32초 차이. 요청 패킷 계측은 하지 않음. |
| AUTO-OFF | / | 12:25:10 끈 뒤 12:26:19 확인 | PASS | 자동 갱신 꺼짐. fetched_at 12:24:57 유지. 이후 수동 재시도는 별도. |
| BTC-LIVE | / | BTC 조회 버튼 상태 확인 | FAIL | 비트코인 조회 준비 중(disabled), 구현 중, 가격 —. 수정본 업로드 전. |
| BTC-COOLDOWN | / | BTC 클릭 후 30초 제한 | UNVERIFIED | 운영 BTC 버튼이 비활성이라 실행 불가. 합성 고정검사 성공으로 대신하지 않음. |
| BTC-ERROR | / | BTC 실제 오류 표시 | UNVERIFIED | 운영 BTC 버튼이 비활성이라 실행 불가. 합성 고정검사 성공으로 대신하지 않음. |
| BTC-RECOVER | / | BTC 실패 후 재시도/복구 | UNVERIFIED | 운영 BTC 버튼이 비활성이라 실행 불가. 합성 고정검사 성공으로 대신하지 않음. |
| FX | / | 환율 다시 확인 | PASS | 1 USD=1342.7411 KRW; 기준 09:02:31, 조회12:17:22. 기존 환율 캐시가 유지되어 새 네트워크 요청까지 증명하지 않음. |
| RETRY | / | 일반 다시 시도 | PASS | 버튼 실행 후 정상, 조회시각12:26:20으로 변경. |
| RECORDS | / | 금/은 저장 기록 읽기 | PASS | 금17일, 은 실제 저장값 확인. 다운로드 원본에서 금17/은3개 서로 다른 날짜 검증. |
| CHART-1 | / | 은 차트 간격 1 선택 | PASS | OANDA:XAGUSD와 해당 간격 안내로 변경. 모든 외부 캔들 데이터의 개별 완전 로딩은 별도 미확인. |
| CHART-5 | / | 은 차트 간격 5 선택 | PASS | OANDA:XAGUSD와 해당 간격 안내로 변경. 모든 외부 캔들 데이터의 개별 완전 로딩은 별도 미확인. |
| CHART-15 | / | 은 차트 간격 15 선택 | PASS | OANDA:XAGUSD와 해당 간격 안내로 변경. 모든 외부 캔들 데이터의 개별 완전 로딩은 별도 미확인. |
| CHART-60 | / | 은 차트 간격 60 선택 | PASS | OANDA:XAGUSD와 해당 간격 안내로 변경. 모든 외부 캔들 데이터의 개별 완전 로딩은 별도 미확인. |
| CHART-240 | / | 은 차트 간격 240 선택 | PASS | OANDA:XAGUSD와 해당 간격 안내로 변경. 모든 외부 캔들 데이터의 개별 완전 로딩은 별도 미확인. |
| CHART-D | / | 은 차트 간격 D 선택 | PASS | OANDA:XAGUSD와 해당 간격 안내로 변경. 모든 외부 캔들 데이터의 개별 완전 로딩은 별도 미확인. |
| CHART-W | / | 은 차트 간격 W 선택 | PASS | OANDA:XAGUSD와 해당 간격 안내로 변경. 모든 외부 캔들 데이터의 개별 완전 로딩은 별도 미확인. |
| CHART-M | / | 은 차트 간격 M 선택 | PASS | OANDA:XAGUSD와 해당 간격 안내로 변경. 모든 외부 캔들 데이터의 개별 완전 로딩은 별도 미확인. |
| CHART-RELOAD | / | 차트 다시 불러오기 | PASS | 금 1시간 실제 그래프 표시. OANDA:XAUUSD 가격선 화면 확인. |
| CHART-ZOOM | / | 차트 위 휠 및 1D 범위 클릭 | UNVERIFIED | 클릭/휠을 시도했으나 x축 범위 변화가 확실하지 않음. 확대·축소 성공으로 판정하지 않음. |
| G-OPEN | /verify.html | 검증 링크 이동 | PASS | 해당 종목 검증 페이지 열림. |
| G-COLLECT | /verify.html | 조회·기록·검증 | PASS | fresh/none, 원자료·저장·표시 일치. 금12:19:03, 은12:20:55 KST. |
| G-READ | /verify.html | 저장 기록 새로 읽기 | PASS | 조회 뒤 기록 다시 표시. |
| G-TWO-DAYS | /verify.html | 실제 이틀 표와 변화값 | PASS | 금 09-30→10-01, 4202.100098→4163, -39.100098. 은 10-14→10-16, 59.354→57.833, -1.521000(첫 관측); 이후 갱신 원본은 다운로드에 보존. |
| G-DOWNLOAD | /verify.html | JSON 다운로드 및 내용 파싱 | PASS | 실제 download 이벤트 경로 확보, JSON 파싱·실제 종목·양수·synthetic=false 검증. docs/task5/bitcoin/b-download-check.json. 다운로드 표시 파일명은 도구가 제공하지 않아 별도 미확인. |
| G-FAILURE-SUITE | /verify.html | 5종 실패·복구 전체 검사 | PASS | 5/5 통과, 정상값 보존·같은 날짜1행·복구2행. |
| G-OFFICIAL-SUITE | /verify.html | 공식 전체 순서 검사 | PASS | 정상 날짜 갱신/추가, 5종 실패→복구 모두 통과 표시. |
| G-NORMAL-D1-A | /verify.html | 공식 T04-NORMAL-D1-A 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| G-NORMAL-D1-B | /verify.html | 공식 T04-NORMAL-D1-B 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| G-NORMAL-D2 | /verify.html | 공식 T04-NORMAL-D2 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| G-TIMEOUT | /verify.html | 공식 T04-TIMEOUT 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| G-AUTH-401 | /verify.html | 공식 T04-AUTH-401 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| G-RATE-429 | /verify.html | 공식 T04-RATE-429 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| G-OFFLINE | /verify.html | 공식 T04-OFFLINE 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| G-SCHEMA-BREAK | /verify.html | 공식 T04-SCHEMA-BREAK 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| G-RECOVER-D2 | /verify.html | 공식 T04-RECOVER-D2 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| G-RESET | /verify.html | 합성 상태 초기화 | PASS | 합성 상태만 초기화했습니다. |
| G-RETRY | /verify.html | 공식 실패 뒤 다시 시도 | PASS | T04-RECOVER-D2 · 2행 · fixture 예상 결과 일치. |
| G-DETAILS | /verify.html | 안내/파일별 검증/현재 JSON/원자료 펼치기 | PASS | 4개 details 열림. 금 원자료4174와 표시4174.00 및 시각 일치, 17/17 원본 파일 SHA-256 일치. |
| S-OPEN | /silver-verify.html | 검증 링크 이동 | PASS | 해당 종목 검증 페이지 열림. |
| S-COLLECT | /silver-verify.html | 조회·기록·검증 | PASS | fresh/none, 원자료·저장·표시 일치. 금12:19:03, 은12:20:55 KST. |
| S-READ | /silver-verify.html | 저장 기록 새로 읽기 | PASS | 조회 뒤 기록 다시 표시. |
| S-TWO-DAYS | /silver-verify.html | 실제 이틀 표와 변화값 | PASS | 금 09-30→10-01, 4202.100098→4163, -39.100098. 은 10-14→10-16, 59.354→57.833, -1.521000(첫 관측); 이후 갱신 원본은 다운로드에 보존. |
| S-DOWNLOAD | /silver-verify.html | JSON 다운로드 및 내용 파싱 | PASS | 실제 download 이벤트 경로 확보, JSON 파싱·실제 종목·양수·synthetic=false 검증. docs/task5/bitcoin/b-download-check.json. 다운로드 표시 파일명은 도구가 제공하지 않아 별도 미확인. |
| S-FAILURE-SUITE | /silver-verify.html | 5종 실패·복구 전체 검사 | PASS | 5/5 통과, 정상값 보존·같은 날짜1행·복구2행. |
| S-OFFICIAL-SUITE | /silver-verify.html | 공식 전체 순서 검사 | PASS | 정상 날짜 갱신/추가, 5종 실패→복구 모두 통과 표시. |
| S-NORMAL-D1-A | /silver-verify.html | 공식 T04-NORMAL-D1-A 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| S-NORMAL-D1-B | /silver-verify.html | 공식 T04-NORMAL-D1-B 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| S-NORMAL-D2 | /silver-verify.html | 공식 T04-NORMAL-D2 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| S-TIMEOUT | /silver-verify.html | 공식 T04-TIMEOUT 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| S-AUTH-401 | /silver-verify.html | 공식 T04-AUTH-401 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| S-RATE-429 | /silver-verify.html | 공식 T04-RATE-429 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| S-OFFLINE | /silver-verify.html | 공식 T04-OFFLINE 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| S-SCHEMA-BREAK | /silver-verify.html | 공식 T04-SCHEMA-BREAK 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| S-RECOVER-D2 | /silver-verify.html | 공식 T04-RECOVER-D2 버튼 | PASS | fixture 예상 결과 일치. 정상 D1-A/D1-B 기준 설정 후 실패/복구. 금 첫 긴 호출은 도구 시간초과되어 짧게 재실행한 결과로 판정. |
| S-RESET | /silver-verify.html | 합성 상태 초기화 | PASS | 합성 상태만 초기화했습니다. |
| S-RETRY | /silver-verify.html | 공식 실패 뒤 다시 시도 | PASS | T04-RECOVER-D2 · 2행 · fixture 예상 결과 일치. |
| S-DETAILS | /silver-verify.html | 안내/파일별 검증/현재 JSON/원자료 펼치기 | PASS | 4개 details 열림. 금 원자료4174와 표시4174.00 및 시각 일치, 17/17 원본 파일 SHA-256 일치. |
| OFFICIAL-REDIRECT | /official.html | 공식 안내 주소 열기 | UNVERIFIED | 금 검증 h1까지 확인했으나 URL을 읽은 순간 /official.html 상태. 최종 #official-tests URL은 재확인 필요. |
| REPORT | /task5.html | 비교 보고서 열기 | PASS | 기존 구리 보관 보고서 확인. 새 BTC 보고서는 로컬 수정이며 업로드 전. |
| HANDOFF | /handoff.html | 보고서→인계 링크 | PASS | UNVERIFIED·재검증 필요, 이전 검사시각/다음 행동 표시. main 선택자 오류 후 실제 body 구조로 확인. |
| HOME-LINK | /handoff.html | 정보판 링크 | PASS | 정보판으로 복귀. |
| EXTERNAL-DOC | / | Gold API 문서 출처 접속 | PASS | https://gold-api.com/docs, API Documentation :: Gold API. |
| EXTERNAL-FX | / | 환율 제공자 링크 접속 | PASS | https://www.exchangerate-api.com/, Currency Converter API 페이지. |
| EXTERNAL-CHART | / | TradingView 출처 접속 | PASS | /symbols/XAUUSD/로 리다이렉트, XAUUSD Chart — Gold Spot Price Today. |
| EXTERNAL-BTC | / | BTC 원천 링크 직접 접속 | UNVERIFIED | cloud browser ERR_BLOCKED_BY_CLIENT. Node GET 성공과 구분. |
| EXTERNAL-OTHER | all | 나머지 원천/증거/파일 링크 목적지 | UNVERIFIED | 일부 href/로컬 원본은 확인했으나 모든 외부 링크별 직접 접속은 완료하지 못함. |
| LOCAL-BTC-UI | local | 수정된 로컬 BTC 화면 브라우저 실행 | UNVERIFIED | Chromium 및 headless-shell 손상 ZIP 설치 실패. cloud browser→127.0.0.1:3000 CONNECTION_REFUSED. |

다음 행동: 업로드/배포 후 BTC 실제 UI·오류 복구, 차트 확대/축소, 최종 리다이렉트와 나머지 링크를 재실행. 검증하지 못한 기능은 미확인으로 유지.
