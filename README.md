# GOLD / NOTE — 국제 금시세 정보판

**사용자가 직접 Supabase와 Vercel에 연결하는 과제4용 소스입니다.**

## 먼저 할 일

1. Supabase SQL Editor에서 `sql/001_gold_board.sql` 전체를 실행합니다.
2. 이 폴더의 파일을 **새 공개 GitHub 저장소**에 올립니다. `api`, `public`, `server`, `sql`, `scripts`, `package.json`, `vercel.json`이 저장소 루트에 있어야 합니다.
3. Vercel에서 해당 저장소를 가져오고 환경변수를 설정한 다음 배포합니다.

자세한 클릭 순서: **`docs/설치안내.md`**

## 들어 있는 기능

- 로그인 없는 국제 금시세 정보판: XAU, 미국 달러 / 트로이온스.
- 공개 실제 원천 `https://api.gold-api.com/price/XAU`를 Vercel 서버에서 조회.
- 가격, 단위, 출처 링크, 원천 관측 시각, 조회 시각, Asia/Seoul 표시.
- Supabase 일별 영구 저장: 한국 날짜 기본키, 같은 날 마지막 성공값 갱신.
- 12초 시간초과, 원천 401/403, 429, 네트워크 오류, 형식 변경 구분.
- 실패해도 마지막 정상값과 일별 기록 보존, stale/error 및 다시 시도 표시.
- 원천 시각 또는 조회 시각이 15분 경과한 값은 오래된 값으로 표시.
- 실제 기록과 분리된 합성 재생실, 다섯 실패 자동 검사, D2 복구.
- 원자료·저장값·화면값 대조 및 실제 최초 두 날짜 증빙 JSON 다운로드.
- 어제 대비 금액·변화율 계산. 날짜가 연속하지 않으면 이전 기록 대비로 명시.
- 매일 KST 오전 09:10 예약 조회(Vercel Cron, 실제 실행은 지연될 수 있음).
- 서버 전용 비밀값, RLS, 공개 쓰기 권한 제거, DB에서 동시 조회와 30초 간격 제어.

## 과제 전체 통과를 위해 반드시 남는 실제 작업

코드만으로 다음 항목을 완료했다고 할 수 없습니다.

1. **공개 배포 URL과 공개 소스의 full commit URL**을 만들고 시크릿 창에서 검증해야 합니다.
2. **공식 T04 합성 검사 꾸러미 ZIP**이 조건 텍스트에 첨부되어 있지 않습니다. 현재 `LOCAL-*` 시험값은 자체 제작이며 공식 fixture가 아닙니다. 공식 `public-contract.json`, `asset-manifest.json`, schema, fixtures 9종, 참조 adapter를 받아 hash와 동작을 대조해야 합니다. 특히 공식 `T04-RECOVER-D2` 호환은 아직 확인하지 않았습니다.
3. 배포 후 **서로 다른 실제 KST 날짜에 실제 조회를 성공**시켜야 합니다. 오늘 첫 기록을 남겼다면 다음 한국 날짜에 재조회하세요. 과거 데이터 다운로드나 합성 시계로 대체하면 안 됩니다.

실제 이틀 증빙은 일별 저장소에서 최초 두 날짜를 정확히 2건 선택합니다. 일별 전체 기록은 이후에도 보존합니다. 첫날 여러 번 성공하면 해당 날짜의 최신값으로 갱신되므로 둘째 날 기록 후 증빙을 내려받으세요.

## Vercel 설정 요약

| 항목 | 값 |
|---|---|
| Framework Preset | Other |
| Root Directory | `package.json`이 있는 폴더 |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | 24.x |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase의 서버 전용 legacy `service_role` 키 |
| `CRON_SECRET` | 직접 생성한 충분히 긴 무작위 값 |

환경변수 3개는 Vercel 프로젝트의 서버 환경변수에만 넣습니다. 실제 키를 GitHub, 이 파일, 제출 파일, 프런트엔드 코드, 채팅에 넣지 마세요.

## 로컬 실행 / 검증

Node.js 24 설치 후 이 폴더에서:

```bash
npm test
npm run build
npm run dev
```

`http://localhost:3000`에서 확인합니다. 외부 npm 런타임 패키지가 없어 `npm install` 없이 실행됩니다. 실제 DB를 로컬에서 연결하려면 `.env.example`을 `.env.local`로 복사하고 본인 PC에서 값을 채웁니다. 미설정 상태에서는 가짜 금시세 대신 **서비스 연결 대기**가 표시되고 합성 시험만 동작합니다.

## 구조

```text
public/             공개 화면, 스타일, 공통 판정 로직, 자체 합성 시험값
api/                Vercel Functions: 읽기/조회, 예약 실행
server/             Supabase RPC와 실제 수집 처리
sql/                Supabase SQL
tests/              자체 자동 검사
scripts/            빌드, 개발 서버, 원천 확인, 공식 hash 대조 보조 도구
docs/               설치 순서, 조건별 현황, 제출문, 검증 기록
evidence/           실제 원천 접속 확인용 자료 (DB 일별 증빙 아님)
```

## 데이터 규칙

- Gold API `price`를 수치 변환·통화 환산 없이 보존합니다. `updatedAt`을 원천 관측 시각으로 보존합니다.
- 소수 정밀도는 JavaScript JSON Number가 유지하는 범위를 사용하며 표시는 최대 20자리입니다.
- 조회 시각은 Vercel 서버가 응답 본문을 받은 때입니다. DB가 실제 시각 범위와 KST 날짜를 재검사합니다.
- 성공 레코드의 원자료는 `symbol`, `currency`, `price`, `updatedAt` 공개 필드만 보존합니다.
- 두 기록의 변화액은 `나중 값 − 이전 값`(표시 소수 6자리), 변화율은 `(나중 값 − 이전 값) / 이전 값 × 100`(표시 소수 4자리)입니다.
- 원천 오류는 성공 기록을 덮어쓰지 않습니다. 저장소 장애 시 현재 화면의 마지막 정상값을 유지합니다. 브라우저 보관본은 서버 확인 전 증빙 다운로드를 허용하지 않습니다.
- 서버 수집 경로는 가격·시각·원천 URL을 사용자 입력으로 받지 않습니다. 합성 시험은 DB를 호출하지 않습니다.
- 가격은 Gold API가 제공하는 XAU 현물 참고값이며 국내 소매 금값이나 특정 거래소의 공식 종가가 아닙니다.

## 출처 문서

- Gold API: https://gold-api.com/docs / https://gold-api.com/llms.txt
- Gold API 단위·통화: https://gold-api.com/ / https://gold-api.com/assets/
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Vercel 예약 실행: https://vercel.com/docs/cron-jobs
- Vercel 예약 실행 인증: https://vercel.com/docs/cron-jobs/manage-cron-jobs

확인일: 2026-09-29. 공식 T04 자산의 출처 주소는 미제공 상태입니다.
