import {METALS,normalizeMetal} from '../public/metals.mjs';
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'method_not_allowed'});}
  const symbol=new URL(req.url,'https://localhost').searchParams.get('symbol');
  if(!Object.hasOwn(METALS,symbol))return res.status(400).json({error:'unsupported_symbol'});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
    const response=await fetch(`https://api.gold-api.com/price/${symbol}`,{signal:controller.signal,headers:{Accept:'application/json'},redirect:'error'});
    if(!response.ok){
      const code=response.status===429?'rate_limited':[401,403].includes(response.status)?'access_denied':'upstream_error';
      const header=response.headers.get('retry-after');const seconds=/^\d+$/.test(header??'')?Number(header):Math.ceil((Date.parse(header)-Date.now())/1000);
      const wait=Number.isFinite(seconds)?Math.max(30,Math.min(3600,seconds)):60;
      res.setHeader('Retry-After',String(wait));return res.status(502).json({error:code,retry_after:wait});
    }
    let raw;try{raw=await response.json();}catch{throw new Error('schema_changed');}
    const quote=normalizeMetal(raw,symbol,new Date().toISOString());
    res.setHeader('Cache-Control','public, s-maxage=30');return res.status(200).json({quote});
  }catch(error){return res.status(502).json({error:controller.signal.aborted?'timeout':error.message==='schema_changed'?'schema_changed':'offline',retry_after:60});}
  finally{clearTimeout(timer);}
}
