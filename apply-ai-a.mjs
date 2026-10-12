import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

const repo = process.cwd();

async function write(rel, content) {
  const full = path.join(repo, rel);
  await mkdir(path.dirname(full), {recursive:true});
  await writeFile(full, content, 'utf8');
}

async function read(rel) {
  return readFile(path.join(repo, rel), 'utf8');
}

function run(command, args) {
  const r = spawnSync(command, args, {cwd:repo, encoding:'utf8', shell:false});
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r;
}

const handoffPath = 'HANDOFF.json';
let handoff;
try {
  handoff = JSON.parse(await read(handoffPath));
} catch {
  throw new Error('HANDOFF.json이 없습니다. gold_board-main 루트에서 실행하세요.');
}

if (handoff.current_feature?.id !== 'task5-copper-live') {
  throw new Error('현재 HANDOFF 기능이 task5-copper-live가 아닙니다.');
}
if (handoff.phase !== 'AI_A_START') {
  throw new Error(`현재 phase가 AI_A_START가 아닙니다: ${handoff.phase}`);
}

let indexHtml = await read('public/index.html');
if (!indexHtml.includes('id="copper-live"')) {
  indexHtml = indexHtml.replace(
    '<span class="top-meta">금 · 은 <span class="desktop">· KST / UTC+9</span></span>',
    '<span class="top-meta">금 · 은 · 구리 <span class="desktop">· KST / UTC+9</span></span>'
  );

  const copperSection = `<section id="copper-live" class="proof">
<div class="section-heading"><div><p class="eyebrow">INDUSTRIAL METAL / COPPER</p><h2>구리 시세</h2></div><button id="copper-refresh" class="secondary">구리 조회</button></div>
<p class="section-note">MetalMarket.cash 공개 REST API에서 구리 현재가를 조회합니다. 회원가입·API 키 없이 사용하며 단위는 USD/t입니다. 과제5 개선 기능의 AI A 구현 범위입니다.</p>
<div class="proof-grid">
<div class="proof-cell"><h3>현재 구리 가격</h3><strong id="copper-price">—</strong><p id="copper-unit">USD/t</p></div>
<div class="proof-cell"><h3>상태</h3><strong id="copper-status">조회 전</strong><p id="copper-error">오류 없음</p></div>
<div class="proof-cell"><h3>조회 시각 · KST</h3><strong id="copper-fetched-at">—</strong><p><a href="https://metalmarket.cash/developers/metal-price-api" target="_blank" rel="noopener noreferrer">MetalMarket.cash</a></p></div>
</div>
</section>
`;
  indexHtml = indexHtml.replace('<section class="fx-panel">', copperSection + '<section class="fx-panel">');
  await write('public/index.html', indexHtml);
}

await write('public/copper-core.mjs', `export const COPPER_ENDPOINT='https://metalmarket.cash/api/v1/prices/copper';
export const COPPER_SOURCE='https://metalmarket.cash/developers/metal-price-api';
export const COPPER_UNIT='USD/t';

export class CopperError extends Error{
  constructor(code='request_failed'){
    super(code);
    this.code=code;
  }
}

export function normalizeCopper(raw,fetchedAt){
  if(!raw||Array.isArray(raw)||raw.id!=='copper'||raw.symbol!=='CU'||
     typeof raw.price!=='number'||!Number.isFinite(raw.price)||raw.price<=0||
     raw.unit!==COPPER_UNIT){
    throw new CopperError('schema_changed');
  }
  if(!Number.isFinite(Date.parse(fetchedAt)))throw new CopperError('schema_changed');
  return {
    symbol:'CU',
    value:raw.price,
    unit:COPPER_UNIT,
    source_url:COPPER_SOURCE,
    fetched_at:fetchedAt,
    timezone:'Asia/Seoul'
  };
}

export async function fetchCopperQuote({
  fetcher=fetch,
  now=()=>new Date().toISOString()
}={}){
  let response;
  try{
    response=await fetcher(COPPER_ENDPOINT,{
      method:'GET',
      headers:{Accept:'application/json'},
      cache:'no-store'
    });
  }catch{
    throw new CopperError('request_failed');
  }

  if(!response.ok)throw new CopperError('request_failed');

  let raw;
  try{
    raw=await response.json();
  }catch{
    throw new CopperError('schema_changed');
  }
  return normalizeCopper(raw,now());
}
`);

await write('public/copper-client.mjs', `import {fetchCopperQuote} from './copper-core.mjs';

function blank(){
  return {
    status:'empty',
    error_code:'none',
    last_good:null,
    busy:false,
    due:0
  };
}

export function createCopperClient(onChange=()=>{},options={}){
  let state=blank();

  function emit(){
    onChange({...state});
  }

  async function request(){
    if(state.busy)return false;
    state={...state,busy:true};
    emit();
    try{
      const quote=await fetchCopperQuote(options);
      state={
        status:'fresh',
        error_code:'none',
        last_good:quote,
        busy:false,
        due:0
      };
      emit();
      return true;
    }catch{
      // AI A의 계획된 중단 지점.
      // 실패 원인 구분, 마지막 정상값 보존, retry-after/backoff는 AI B가 구현한다.
      state={
        status:'error',
        error_code:'request_failed',
        last_good:null,
        busy:false,
        due:0
      };
      emit();
      return false;
    }
  }

  return {
    view:()=>({...state}),
    request
  };
}
`);

let dashboard = await read('public/dashboard.mjs');
if (!dashboard.includes("createCopperClient")) {
  dashboard = dashboard.replace(
    "import {createFxClient,toWon} from './fx.mjs';",
    "import {createFxClient,toWon} from './fx.mjs';\nimport {createCopperClient} from './copper-client.mjs';"
  );

  dashboard = dashboard.replace(
    "const fxClient=createFxClient(()=>render(client.view()));",
    `const fxClient=createFxClient(()=>render(client.view()));
const copperClient=createCopperClient(renderCopper);
function renderCopper(v){
 const q=v.last_good;
 $('copper-price').textContent=q?new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:6}).format(q.value):'—';
 $('copper-unit').textContent=q?.unit??'USD/t';
 $('copper-fetched-at').textContent=q?new Date(q.fetched_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'—';
 $('copper-status').textContent=({empty:'조회 전',fresh:'정상',stale:'오래된 값',error:'조회 실패'})[v.status]??v.status;
 $('copper-error').textContent=v.error_code==='none'?'오류 없음':'구리 조회에 실패했습니다.';
 $('copper-refresh').disabled=v.busy;
 $('copper-refresh').textContent=v.busy?'구리 조회 중…':'구리 조회';
}`
  );

  dashboard = dashboard.replace(
    "render(client.view());chart=initMarket(()=>asset);client.request(false);fxClient.request();$('fx-refresh').onclick=()=>fxClient.request();",
    "render(client.view());chart=initMarket(()=>asset);client.request(false);fxClient.request();$('fx-refresh').onclick=()=>fxClient.request();renderCopper(copperClient.view());$('copper-refresh').onclick=()=>copperClient.request();"
  );

  await write('public/dashboard.mjs', dashboard);
}

const task5Check = "import assert from 'node:assert/strict';\nimport {readFile} from 'node:fs/promises';\nimport {normalizeCopper,fetchCopperQuote,COPPER_ENDPOINT} from '../public/copper-core.mjs';\nimport {createCopperClient} from '../public/copper-client.mjs';\n\nconst results=[];\nasync function check(id,fn){\n  try{\n    await fn();\n    results.push({id,pass:true});\n    console.log(`PASS ${id}`);\n  }catch(error){\n    results.push({id,pass:false,message:error?.message??String(error)});\n    console.log(`FAIL ${id} \u00b7 ${error?.message??error}`);\n  }\n}\n\nconst goodRaw={id:'copper',symbol:'CU',price:9876.5,unit:'USD/t'};\nconst goodResponse=(raw=goodRaw)=>({ok:true,status:200,headers:{get:()=>null},json:async()=>raw});\nconst badResponse=(status,headers={})=>({\n  ok:false,\n  status,\n  headers:{get:key=>headers[key.toLowerCase()]??headers[key]??null},\n  json:async()=>({})\n});\n\nawait check('T05-CU01',async()=>{\n  const html=await readFile('public/index.html','utf8');\n  assert.match(html,/id=\"copper-live\"/);\n  assert.match(html,/id=\"copper-refresh\"/);\n  assert.match(html,/\uad6c\ub9ac \uc2dc\uc138/);\n});\n\nawait check('T05-CU02',async()=>{\n  const q=normalizeCopper(goodRaw,'2026-10-12T05:00:00.000Z');\n  assert.equal(q.symbol,'CU');\n  assert.equal(q.value,9876.5);\n  assert.equal(q.unit,'USD/t');\n  assert.equal(q.fetched_at,'2026-10-12T05:00:00.000Z');\n  assert.match(q.source_url,/metalmarket\\.cash/);\n});\n\nawait check('T05-CU03',async()=>{\n  for(const raw of [\n    {...goodRaw,price:0},\n    {...goodRaw,price:-1},\n    {...goodRaw,price:'9876.5'},\n    {...goodRaw,unit:'USD/lb'}\n  ])assert.throws(()=>normalizeCopper(raw,'2026-10-12T05:00:00.000Z'),/schema_changed/);\n});\n\nawait check('T05-CU04',async()=>{\n  let seen;\n  const fetcher=async(url,init)=>{seen={url,init};return goodResponse();};\n  const q=await fetchCopperQuote({fetcher,now:()=> '2026-10-12T05:00:00.000Z'});\n  assert.equal(seen.url,COPPER_ENDPOINT);\n  assert.equal(seen.init.method,'GET');\n  const headers=seen.init.headers??{};\n  assert.equal(Object.keys(headers).some(k=>k.toLowerCase()==='authorization'),false);\n  assert.equal(q.value,9876.5);\n});\n\nawait check('T05-CU05',async()=>{\n  const client=createCopperClient(()=>{},{\n    fetcher:async()=>goodResponse(),\n    now:()=> '2026-10-12T05:00:00.000Z'\n  });\n  await client.request();\n  const v=client.view();\n  assert.equal(v.status,'fresh');\n  assert.equal(v.error_code,'none');\n  assert.equal(v.last_good.value,9876.5);\n  assert.equal(v.last_good.unit,'USD/t');\n  const html=await readFile('public/index.html','utf8');\n  assert.match(html,/id=\"copper-price\"/);\n  assert.match(html,/id=\"copper-fetched-at\"/);\n  assert.match(html,/MetalMarket\\.cash/);\n});\n\nawait check('T05-CU06',async()=>{\n  let call=0;\n  const client=createCopperClient(()=>{},{\n    fetcher:async()=>{\n      call++;\n      if(call===1)return goodResponse();\n      throw new Error('offline');\n    },\n    now:()=> '2026-10-12T05:00:00.000Z'\n  });\n  await client.request();\n  await client.request();\n  const v=client.view();\n  assert.equal(v.status,'stale');\n  assert.equal(v.last_good.value,9876.5);\n});\n\nawait check('T05-CU07',async()=>{\n  const client=createCopperClient(()=>{},{\n    fetcher:async()=>badResponse(429,{'retry-after':'120'}),\n    now:()=> '2026-10-12T05:00:00.000Z'\n  });\n  await client.request();\n  const v=client.view();\n  assert.equal(v.error_code,'rate_limited');\n  assert.ok(v.due>Date.parse('2026-10-12T05:00:00.000Z'));\n});\n\nawait check('T05-CU08',async()=>{\n  const timeoutClient=createCopperClient(()=>{},{\n    fetcher:async()=>{const e=new Error('aborted');e.name='AbortError';throw e;}\n  });\n  await timeoutClient.request();\n  assert.equal(timeoutClient.view().error_code,'timeout');\n\n  const offlineClient=createCopperClient(()=>{},{\n    fetcher:async()=>{throw new TypeError('network');}\n  });\n  await offlineClient.request();\n  assert.equal(offlineClient.view().error_code,'offline');\n});\n\nawait check('T05-CU09',async()=>{\n  let call=0;\n  const client=createCopperClient(()=>{},{\n    fetcher:async()=>{\n      call++;\n      return call===1?goodResponse():badResponse(500);\n    }\n  });\n  await client.request();\n  await client.request();\n  const v=client.view();\n  assert.ok(v.last_good);\n  assert.notEqual(v.error_code,'request_failed');\n  const js=await readFile('public/dashboard.mjs','utf8');\n  assert.match(js,/\ub2e4\uc2dc \uc2dc\ub3c4/);\n});\n\nawait check('T05-CU10',async()=>{\n  let calls=0;\n  const now=Date.parse('2026-10-12T05:00:00.000Z');\n  const client=createCopperClient(()=>{},{\n    fetcher:async()=>{\n      calls++;\n      return calls===1?badResponse(429,{'retry-after':'60'}):goodResponse();\n    },\n    now:()=>new Date(now).toISOString()\n  });\n  await client.request();\n  const before=calls;\n  const accepted=await client.request();\n  assert.equal(accepted,false);\n  assert.equal(calls,before);\n  assert.ok(client.view().due>now);\n});\n\nconst passed=results.filter(r=>r.pass).length;\nconsole.log(`RESULT ${passed}/10`);\nif(passed!==10)process.exitCode=1;\n";
await write('scripts/task5-copper-check.mjs', task5Check);

const pkg = JSON.parse(await read('package.json'));
pkg.scripts['task5:check'] = 'node scripts/task5-copper-check.mjs';
await write('package.json', JSON.stringify(pkg,null,2)+'\n');

handoff.phase = 'READY_FOR_AI_B';
handoff.next_action = 'AI B는 T05-CU06~T05-CU10 실패를 재현한 뒤 실패 시 마지막 정상값 보존, 429/Retry-After, timeout/offline, 사용자 실패 안내, 재시도 차단·복구를 구현해 10/10으로 만든다.';
handoff.ai_a_start_commit = '913c9e174f7fc323013cd424fe1efdc2e7598eca';
handoff.ai_a_handoff_commit = '커밋 후 실제 SHA로 교체';
handoff.ai_b_start_commit = 'AI B 시작 직전 AI A handoff 커밋 SHA와 동일';
await write('HANDOFF.json', JSON.stringify(handoff,null,2)+'\n');

await write('docs/handoff/current.md', `# 현재 인수인계 — task5-copper-live

## 1. 목표
과제4 금·은 정보판에 구리(CU) 현재 시세 조회 기능을 추가하고 고정 검사 T05-CU01~T05-CU10을 최종적으로 모두 통과시킨다.

## 2. 현재 상태
AI A는 성공 경로를 구현하고 계획된 중단 지점에서 작업을 종료했다.

구현 완료:
- 메인 페이지에 \`구리 시세\` 영역과 \`구리 조회\` 버튼 추가
- 인증 없는 \`https://metalmarket.cash/api/v1/prices/copper\` GET 연결
- 정상 응답의 \`id=copper\`, \`symbol=CU\`, 양수 가격, \`USD/t\` 검증
- 정상 응답을 CU/가격/단위/조회 시각/공개 출처 형태로 정규화
- 성공 시 가격·단위·KST 조회 시각·MetalMarket.cash 출처 표시

의도적으로 미완료:
- 실패 시 마지막 정상값 보존 및 \`stale\`
- HTTP 429 / Retry-After
- timeout / offline 구분
- 실패 원인과 다시 시도 안내
- 재시도 가능 시각 전 중복 요청 차단 및 성공 복구

## 3. 실행 명령
\`\`\`bash
npm.cmd run handoff:check
npm.cmd run task5:check
npm.cmd test
npm.cmd run build
\`\`\`

PowerShell에서 \`npm.ps1\` 실행 정책 오류가 나면 \`npm\` 대신 \`npm.cmd\`를 사용한다.

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

현재 \`npm.cmd run task5:check\`의 \`RESULT 5/10\`과 종료 코드 1은 계획된 인수인계 상태다. 고정 검사 문서는 수정하지 않는다.

## 5. 남은 문제
현재 \`public/copper-client.mjs\`는 실패하면 \`request_failed\` 하나로 처리하고 \`last_good\`을 지우며 \`due=0\`으로 둔다. \`public/copper-core.mjs\`도 429, Retry-After, AbortError와 일반 네트워크 실패를 아직 구분하지 않는다.

## 6. 다음 행동
AI B는 저장소와 이 문서만 보고 다음을 수행한다.

1. \`npm.cmd run handoff:check\`
2. \`npm.cmd run task5:check\`로 T05-CU06~T05-CU10 실패 재현
3. \`public/copper-core.mjs\`에 429/Retry-After/timeout/offline 분류 구현
4. \`public/copper-client.mjs\`에 마지막 정상값 보존, \`stale\`, \`due\`, 중복 요청 차단, 성공 복구 구현
5. \`public/dashboard.mjs\`에 실패 원인과 다시 시도 안내 구현
6. 같은 고정 검사에서 \`RESULT 10/10\` 달성
7. 기존 \`npm.cmd test\`와 \`npm.cmd run build\` 회귀 확인
8. \`HANDOFF.json\`의 phase를 \`COMPLETE\`로 갱신하고 B 종료 커밋 SHA 기록

## 7. 건드리지 말 것
- 기존 금(XAU) 조회·저장·검증
- 기존 은(XAG) 조회·저장·검증
- Supabase 스키마
- 과제4 실제 이틀 증빙
- 공식 T04 fixture·hash·검사
- \`.env*\`와 비밀값
- \`docs/task5/copper-fixed-tests.md\`의 검사 ID·입력·기대값
`);

await write('docs/task5/copper-work-log.md', `# 과제5 작업 기록 — 구리 개선

## 시작 소스
- 저장소: \`https://github.com/bonsago123-cloud/gold_board\`
- 과제4 기준 커밋: \`4c4b0bbb92d650728b5349c84545d831277118cf\`
- AI A 시작 커밋: \`913c9e174f7fc323013cd424fe1efdc2e7598eca\`

## 고정 순서
1. 고정 검사·공통 상한·인수인계 자동 발견 규칙 저장
2. AI A 시작
3. AI A 성공 경로 일부 구현
4. AI A 종료·인수인계
5. AI B 시작
6. AI B 완료

## 공통 상한
- AI A: 30분 / 요청 10회
- AI B: 30분 / 요청 10회

## 실제 기록
| 단계 | 시작 버전 | 종료 버전 | 실제 작업시간 | 실제 요청 수 | FAIL 실행 회차 | 통과 수 |
|---|---|---|---|---:|---:|---:|
| AI A | \`913c9e174f7fc323013cd424fe1efdc2e7598eca\` | 커밋 후 실제 SHA 기록 | 실제값 기록 | 실제값 기록 | 실제 실행 기준 기록 | 5/10 |
| AI B | AI A handoff 커밋 SHA | B 완료 커밋 SHA | 실제값 | 실제값 | 실제값 | 목표 10/10 |

실제 시간·요청 수는 추정하지 않고 사용자 측 실행/대화 기록을 기준으로 작성한다.
`);

await write('AI_B_START.txt', `이 저장소를 이어서 작업해.
https://github.com/bonsago123-cloud/gold_board

저장소 안의 인수인계 규칙을 기준으로 진행해.
이전 AI와의 대화 내용은 제공하지 않는다.
`);

console.log('AI A 변경 적용 완료');
console.log('인수인계 검사 실행');
let r = run('npm.cmd', ['run','handoff:check']);
if (r.status !== 0) process.exit(r.status ?? 1);

console.log('과제5 고정 검사 실행');
r = run('npm.cmd', ['run','task5:check']);
const combined = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
if (!combined.includes('RESULT 5/10')) {
  console.error('예상한 AI A 상태(RESULT 5/10)가 아닙니다.');
  process.exit(1);
}

console.log('AI A 계획된 중단 상태 확인: RESULT 5/10');
console.log('이제 기존 회귀 검사: npm.cmd test / npm.cmd run build');
