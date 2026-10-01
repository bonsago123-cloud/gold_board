import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import board from '../api/board.mjs';
import cron from '../api/cron.mjs';
import metals from '../api/metals.mjs';
import rhenium from '../api/rhenium.mjs';
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};
const root=path.resolve('public');
http.createServer(async(req,res)=>{
  res.status=(code)=>{res.statusCode=code;return res;}; res.json=(data)=>res.end(JSON.stringify(data));
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/api/board') return board(req,res);
  if(pathname==='/api/cron') return cron(req,res);
  if(pathname==='/api/rhenium') return rhenium(req,res);
  if(pathname==='/api/metals') return metals(req,res);
  const file=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try{const data=await readFile(file);res.setHeader('Content-Type',types[path.extname(file)]??'text/plain');res.end(data);}catch{res.writeHead(404);res.end('Not found');}
}).listen(3000,'0.0.0.0',()=>console.log('Gold Board: http://localhost:3000'));
