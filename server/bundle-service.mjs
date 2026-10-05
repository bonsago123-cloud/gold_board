import {rpc} from './store.mjs';
import {fetchOutcomes} from './bundle-sources.mjs';
import {ageBundle,SYMBOLS} from '../public/bundle-core.mjs';
export async function bundleSnapshot(){const data=await rpc('market_snapshot');data.assets=Object.fromEntries(SYMBOLS.map(s=>[s,data.assets[s]]));data.evidence=[];if(data.last_run){const outcomes=(data.last_run.outcomes??[]).filter(o=>SYMBOLS.includes(o.symbol));data.last_run=outcomes.length===2?{...data.last_run,outcomes,success_count:outcomes.filter(o=>o.error==='none').length}:null;}return ageBundle(data);}
export async function collectBundle(){
 const claim=await rpc('market_claim');
 if(!claim.token)return {...await bundleSnapshot(),cooldown:true};
 const outcomes=await fetchOutcomes();
 await rpc('market_finish',{p_token:claim.token,p_outcomes:outcomes});
 return bundleSnapshot();
}
