import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const base=process.cwd();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.split('/').some(p=>p.startsWith('.')&&p!=='')){res.writeHead(403);res.end();return;}
  let file=path.resolve(base,'.'+pathname);
  if(file!==base&&!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  const content=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(content);
 }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/status.html?type=missing"><a href="/status.html?type=missing">الصفحة غير متوفرة</a></html>');}
});
server.listen(Number(process.env.PORT||8000),'127.0.0.1',()=>console.log(`Hayat: http://localhost:${server.address().port}`));
