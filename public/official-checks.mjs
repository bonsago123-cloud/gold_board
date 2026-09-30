import { resetEvaluationState,runFixture } from './official-adapter.mjs';
export const OFFICIAL_FILES=['normal-d1-a','normal-d1-b','normal-d2','timeout','auth-401','rate-429','offline','schema-break','recover-d2'];
export function matchesExpected(state,fixture){
  const e=fixture.expected;
  return state.status?.freshness===e.freshness&&state.status?.error_code===e.error_code&&state.daily_readings.length===e.row_count&&
    state.current_reading?.normalized_value===e.stored_value&&state.last_delta===e.delta&&
    (!e.record_date||state.current_reading?.record_date===e.record_date);
}
export function officialSuite(fixtures){
  const results=[];
  let s=resetEvaluationState();
  const apply=id=>{const f=fixtures.find(f=>f.fixture_id===id);if(!f)throw new Error('Missing fixture');s=runFixture(s,f);return matchesExpected(s,f);};
  let ok=apply('T04-NORMAL-D1-A');const firstId=s.daily_readings[0].record_id;
  ok=apply('T04-NORMAL-D1-B')&&ok;ok=s.daily_readings[0].record_id===firstId&&ok;
  ok=apply('T04-NORMAL-D1-B')&&ok;ok=apply('T04-NORMAL-D2')&&ok;results.push({label:'같은 날짜 원자적 갱신·다음 날짜 추가·변화 15',ok});
  for(const id of ['T04-TIMEOUT','T04-AUTH-401','T04-RATE-429','T04-OFFLINE','T04-SCHEMA-BREAK']){
    s=resetEvaluationState();apply('T04-NORMAL-D1-A');apply('T04-NORMAL-D1-B');
    const before=JSON.stringify(s.daily_readings);const value=JSON.stringify(s.current_reading);
    const failed=apply(id)&&JSON.stringify(s.daily_readings)===before&&JSON.stringify(s.current_reading)===value;
    const recovered=apply('T04-RECOVER-D2')&&s.daily_readings.filter(r=>r.record_date==='2026-08-25').length===1;
    const duplicateSafe=apply('T04-RECOVER-D2')&&s.daily_readings.length===2;
    results.push({label:`${id} → T04-RECOVER-D2`,ok:failed&&recovered&&duplicateSafe});
  }
  return {results,state:s};
}
