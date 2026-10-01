import {rheniumQuote,rheniumHistory} from '../server/rhenium.mjs';
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'method_not_allowed'});}
 const key=process.env.METALS_API_KEY;if(!key)return res.status(503).json({error:'setup_required',retry_after:3600});
 const history=new URL(req.url,'https://localhost').searchParams.get('history')==='true';
 const url=new URL(history?'https://metals-api.com/api/timeseries':'https://metals-api.com/api/latest');
 url.search=new URLSearchParams({access_key:key,base:'USD',symbols:'RHENIUM'}).toString();
 if(history){const end=new Date(Date.now()-86400000),start=new Date(end.getTime()-29*86400000);url.searchParams.set('start_date',start.toISOString().slice(0,10));url.searchParams.set('end_date',end.toISOString().slice(0,10));}
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(10000),redirect:'error'});const data=await response.json();
  if(!response.ok||data.success===false){const code=Number(data.error?.code||response.status);return res.status(502).json({error:code===429?'rate_limited':[401,403].includes(code)?'access_denied':'upstream_error',retry_after:3600});}
  const result=history?{points:rheniumHistory(data),fetched_at:new Date().toISOString()}:{quote:rheniumQuote(data)};
  res.setHeader('Cache-Control',history?'public, s-maxage=86400':'public, s-maxage=3600');return res.status(200).json(result);
 }catch(error){return res.status(502).json({error:error.message==='schema_changed'?'schema_changed':'upstream_error',retry_after:3600});}
}
