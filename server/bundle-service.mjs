import {rpc} from './store.mjs';
import {fetchOutcomes} from './bundle-sources.mjs';
import {ageBundle} from '../public/bundle-core.mjs';
export async function bundleSnapshot(){return ageBundle(await rpc('market_snapshot'));}
export async function collectBundle(){
 const claim=await rpc('market_claim');
 if(!claim.token)return {...await bundleSnapshot(),cooldown:true};
 const outcomes=await fetchOutcomes();
 await rpc('market_finish',{p_token:claim.token,p_outcomes:outcomes});
 return bundleSnapshot();
}
