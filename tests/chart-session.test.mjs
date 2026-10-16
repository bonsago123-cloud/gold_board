import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
test('Repeated resume preserves usage; subsequent sessions archive and link prior handoff',async()=>{
 const d=await mkdtemp(join(tmpdir(),'chart-session-'));
 try{
  await mkdir(join(d,'docs/handoff'),{recursive:true});await mkdir(join(d,'scripts'));
  await writeFile(join(d,'docs/handoff/current.md'),'handoff');
  await copyFile(resolve('scripts/handoff-chart.mjs'),join(d,'scripts/handoff-chart.mjs'));
  for(const args of [['init'],['add','.'],['-c','user.name=Test','-c','user.email=test@example.invalid','commit','-m','fixture']])assert.equal(spawnSync('git',args,{cwd:d}).status,0);
  const run=()=>spawnSync(process.execPath,['scripts/handoff-chart.mjs','resume'],{cwd:d,encoding:'utf8'});
  const read=async()=>JSON.parse(await readFile(join(d,'handoff/chart/session.json')));
  assert.equal(run().status,0);const first=await read();first.user_work_requests=4;await writeFile(join(d,'handoff/chart/session.json'),JSON.stringify(first));
  assert.equal(run().status,0);assert.deepEqual(await read(),first);
  first.closed_at=new Date().toISOString();await writeFile(join(d,'handoff/chart/session.json'),JSON.stringify(first));
  assert.equal(run().status,0);const next=await read();assert.notEqual(next.id,first.id);assert.equal(next.parent_session_id,first.id);assert.equal(next.user_work_requests,1);assert.equal(JSON.parse(await readFile(join(d,'handoff/chart/history',first.id+'.session.json'))).user_work_requests,4);
 }finally{await rm(d,{recursive:true,force:true});}
});
