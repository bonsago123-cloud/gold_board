// Read-only source evidence capture. Does NOT backdate or insert into Supabase.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SOURCE_URL, normalize } from '../public/core.mjs';
const started=new Date().toISOString();
const response=await fetch(SOURCE_URL,{signal:AbortSignal.timeout(20000),headers:{Accept:'application/json'}});
if(!response.ok)throw new Error(`Source returned HTTP ${response.status}`);
const rawText=await response.text();
const fetchedAt=new Date().toISOString();
const normalized=normalize(JSON.parse(rawText),fetchedAt);
await mkdir('evidence',{recursive:true});
const evidence={note:'실제 원천 접속 확인용 파일. Supabase 일별 저장 증빙이 아니며 자동 가져오지 않습니다.',source_url:SOURCE_URL,request_started_at:started,fetched_at:fetchedAt,
  http_status:response.status,raw_response:JSON.parse(rawText),normalized,sha256_of_raw_utf8:createHash('sha256').update(rawText).digest('hex')};
await writeFile('evidence/source-observation.json',JSON.stringify(evidence,null,2)+'\n');
await writeFile('evidence/source-raw.json',rawText);
console.log(JSON.stringify({date:normalized.date_kst,price:normalized.value,source_at:normalized.source_at,fetched_at:fetchedAt}));
