import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('resume retains usage; changed incoming handoff is rejected; frozen bytes cannot change',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'handoff-cycle-'));
 try{
 for(const d of ['scripts','docs','public','api','tests'])await cp(d,path.join(root,d),{recursive:true});
 for(const p of ['package.json','package-lock.json','AGENTS.md'])await cp(p,path.join(root,p));
 const run=mode=>spawnSync(process.execPath,['scripts/handoff-cycle.mjs',mode],{cwd:root,encoding:'utf8'});
 assert.equal(run('resume').status,0);
 const p=path.join(root,'handoff/restart/session.json'),s=JSON.parse(await readFile(p));
 assert.equal(run('request').status,0);assert.equal(run('resume').status,0);
 const resumed=JSON.parse(await readFile(p));assert.equal(resumed.id,s.id);assert.equal(resumed.started_at,s.started_at);assert.equal(resumed.user_work_requests,2);
 resumed.closed_at=new Date().toISOString();resumed.outgoing_handoff_sha256='incorrect';await writeFile(p,JSON.stringify(resumed));assert.equal(run('resume').status,2);
 const fixed=path.join(root,'docs/task5/chart-restart/fixed-tests.json');await writeFile(fixed,(await readFile(fixed,'utf8'))+' ');assert.equal(run('check').status,2);
 }finally{await rm(root,{recursive:true,force:true});}
});
