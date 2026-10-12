import {readFile} from 'node:fs/promises';

const manifest=JSON.parse(await readFile('HANDOFF.json','utf8'));
const fail=[];
const required=['schema_version','protocol','phase','current_feature','handoff_document','fixed_tests_document','fixed_test_ids','commands','common_limits','protected_areas','next_action'];
for(const key of required)if(!(key in manifest))fail.push(`HANDOFF.json missing: ${key}`);
if(!Array.isArray(manifest.fixed_test_ids)||manifest.fixed_test_ids.length!==10)fail.push('fixed_test_ids must contain exactly 10 IDs');
if(new Set(manifest.fixed_test_ids??[]).size!==10)fail.push('fixed_test_ids must be unique');
if(manifest.common_limits?.time_minutes_per_ai<=0)fail.push('time limit missing');
if(manifest.common_limits?.request_count_per_ai<=0)fail.push('request count limit missing');

const handoff=await readFile(manifest.handoff_document,'utf8');
for(const title of ['## 1. 목표','## 2. 현재 상태','## 3. 실행 명령','## 4. 통과 검사','## 5. 남은 문제','## 6. 다음 행동','## 7. 건드리지 말 것']){
  if(!handoff.includes(title))fail.push(`handoff missing section: ${title}`);
}

const tests=await readFile(manifest.fixed_tests_document,'utf8');
for(const id of manifest.fixed_test_ids??[])if(!tests.includes(`| ${id} |`))fail.push(`fixed test not found: ${id}`);

if(fail.length){
  console.error('HANDOFF CHECK: FAIL');
  for(const item of fail)console.error('-',item);
  process.exit(1);
}
console.log('HANDOFF CHECK: PASS');
console.log(`feature: ${manifest.current_feature.id}`);
console.log(`phase: ${manifest.phase}`);
console.log(`tests: ${manifest.fixed_test_ids.length}`);
console.log(`next: ${manifest.next_action}`);
