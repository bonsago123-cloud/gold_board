import test from 'node:test';
import assert from 'node:assert/strict';
import {REQUIRED,decision,siteDecision} from '../scripts/bitcoin-gates.mjs';
test('BTC completion requires every gate, rejects missing/duplicate/unverified',()=>{
 const all=()=>REQUIRED.map(id=>({id,status:'PASS'}));
 assert.equal(decision(all()),'COMPLETE');
 for(const id of REQUIRED)for(const status of ['FAIL','UNVERIFIED','NOT_RUN']){const g=all();g.find(x=>x.id===id).status=status;assert.equal(decision(g),'BLOCKED');}
 assert.equal(decision(all().slice(1)),'BLOCKED');assert.equal(decision([...all(),all()[0]]),'BLOCKED');
});
test('Site unavailable or incomplete never counts as live success',()=>{
 assert.equal(siteDecision({rows:[{id:'SETUP',status:'UNVERIFIED'}]}),'UNVERIFIED');
 assert.equal(siteDecision({rows:[{id:'S08',status:'PASS'}]}),'UNVERIFIED');
 assert.equal(siteDecision({rows:[{id:'S08',status:'FAIL'},{id:'META',status:'PASS'}]}),'FAIL');
 assert.equal(siteDecision({rows:[{id:'S08',status:'PASS'},{id:'META',status:'PASS'}]}),'PASS');
});
