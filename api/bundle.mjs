import {bundleSnapshot,collectBundle} from '../server/bundle-service.mjs';
import {send} from '../server/service.mjs';
import {blankBundle,SYMBOLS} from '../public/bundle-core.mjs';
import {failure} from '../public/core.mjs';
export default async function handler(req,res){
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(res,405,{error:'method_not_allowed'});}
 if(req.method==='POST'){let wrong=req.headers['sec-fetch-site']==='cross-site';if(req.headers.origin){try{wrong||=new URL(req.headers.origin).host!==req.headers.host;}catch{wrong=true;}}if(wrong)return send(res,403,{error:'cross_origin'});}
 try{return send(res,200,req.method==='POST'?await collectBundle():await bundleSnapshot());}
 catch(e){let prior=blankBundle();try{prior=await bundleSnapshot();}catch{}const code=e.code==='setup_required'?'setup_required':'storage_error';for(const s of SYMBOLS)prior.assets[s]=failure(prior.assets[s],code);return send(res,503,{...prior,error:code});}
}
