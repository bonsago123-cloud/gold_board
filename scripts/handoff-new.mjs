import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';

const [featureId,title,fixedTestsDocument]=process.argv.slice(2);
if(!featureId||!title||!fixedTestsDocument){
  console.error('usage: npm run handoff:new -- <feature-id> "<title>" <fixed-tests-document>');
  process.exit(1);
}
if(!/^[a-z0-9][a-z0-9-]*$/.test(featureId)){
  console.error('feature-id must use lowercase letters, numbers and hyphens');
  process.exit(1);
}

const manifest=JSON.parse(await readFile('HANDOFF.json','utf8'));
const tests=await readFile(fixedTestsDocument,'utf8');
const ids=[...tests.matchAll(/^\|\s*([A-Z][A-Z0-9-]+)\s*\|/gm)].map(m=>m[1]).filter(id=>id!=='ID');
if(!ids.length){
  console.error('no fixed test IDs found in the supplied document');
  process.exit(1);
}

await mkdir('docs/handoff/archive',{recursive:true});
try{
  const safeOld=(manifest.current_feature?.id??'previous').replace(/[^a-zA-Z0-9-]/g,'-');
  await copyFile(manifest.handoff_document??'docs/handoff/current.md',`docs/handoff/archive/${new Date().toISOString().replace(/[:.]/g,'-')}-${safeOld}.md`);
}catch{}

manifest.phase='AI_A_START';
manifest.current_feature={id:featureId,title,improvement:title};
manifest.fixed_tests_document=fixedTestsDocument;
manifest.fixed_test_ids=ids;
manifest.next_action='Read docs/handoff/current.md and begin the new feature from the fixed tests.';
manifest.ai_a_start_commit='사용자가 시작 커밋 후 기록';
manifest.ai_a_handoff_commit=null;
manifest.ai_b_start_commit=null;
manifest.ai_b_end_commit=null;
await writeFile('HANDOFF.json',JSON.stringify(manifest,null,2)+'\n');

const current=`# 현재 인수인계 — ${featureId}

## 1. 목표
${title}

## 2. 현재 상태
새 기능 시작 전 상태다.

## 3. 실행 명령
\`\`\`bash
npm run handoff:check
npm test
npm run build
\`\`\`

## 4. 통과 검사
고정 검사 문서: \`${fixedTestsDocument}\`

## 5. 남은 문제
고정 검사 기준으로 아직 구현하지 않았다.

## 6. 다음 행동
고정 검사의 앞부분부터 구현하고 계획한 중단 지점에서 인수인계한다.

## 7. 건드리지 말 것
\`HANDOFF.json\`의 protected_areas를 따른다.
`;
await writeFile('docs/handoff/current.md',current);
console.log(`new handoff initialized: ${featureId} (${ids.length} fixed tests)`);
