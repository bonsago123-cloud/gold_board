import test from 'node:test';import assert from 'node:assert/strict';
import {silverEvidence} from '../public/silver-evidence.mjs';import {normalizeRecord} from '../public/bundle-core.mjs';
const q=(d,v=50)=>normalizeRecord({symbol:'XAG',currency:'USD',price:v,updatedAt:d},'XAG',d);
test('silver uses latest two real distinct KST dates; no gold or synthetic substitute',()=>{
 const a=q('2026-10-01T01:00:00Z'),b=q('2026-10-02T01:00:00Z'),c=q('2026-10-03T01:00:00Z');
 const r=silverEvidence({daily:[c,a,b,b,{...c,synthetic:true},{...c,symbol:'XAU'},{...c,value:999}]});assert.deepEqual(r.map(x=>x.date_kst),['2026-10-02','2026-10-03']);assert.equal(r[1].records.XAG.value,50);assert.equal(silverEvidence({daily:[a]}).length,1);
});
