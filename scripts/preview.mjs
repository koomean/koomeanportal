// Local QA only. Production files and authentication code are never modified.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORTAL_PREVIEW_PORT || 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORTAL_PREVIEW_PORT must be between 1024 and 65535');
const apiURL = 'https://koomean-proxy.meanchannel52.workers.dev';
const routeNames = new Set(['apps', 'favorites', 'account', 'settings', 'help', 'admin']);
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.woff2':'font/woff2', '.mp4':'video/mp4', '.txt':'text/plain; charset=utf-8'};
const publicApps = [
  {rowIdx:1, name:'Koo Mean SITE', url:'https://link.koomean.com/', icon:'fas fa-link', description:'รวมลิงก์และช่องทางติดตาม Koo Mean', group:'public', color:'#2460e8', starred:true},
  {rowIdx:2, name:'Koo Mean Blog', url:'https://blog.koomean.com/', icon:'fas fa-book-open', description:'เรื่องราว เทคโนโลยี และสิ่งที่อยากแบ่งปัน', group:'public', color:'#8155be', starred:true},
  {rowIdx:3, name:'Short URL', url:'https://shorturl.koomean.com/', icon:'fas fa-arrow-up-right-from-square', description:'สร้างลิงก์สั้น จัดการลิงก์ และติดตามการเปิด', group:'public', color:'#287b71'},
  {rowIdx:4, name:'Synology', url:'https://synology.koomean.com/', icon:'fas fa-hard-drive', description:'เข้าถึงไฟล์และพื้นที่จัดเก็บส่วนตัว', group:'public', color:'#426784'},
  {rowIdx:5, name:'Koo Mean Video', url:'https://video.koomean.com/', icon:'fas fa-play', description:'วิดีโอและเนื้อหาที่คัดสรรไว้ให้รับชม', group:'public', color:'#c34c5a'},
  {rowIdx:6, name:'Vision Assistant', url:'https://visionassistant.koomean.com/', icon:'fas fa-eye', description:'ผู้ช่วยอัจฉริยะที่ทำให้การมองเห็นเข้าถึงได้', group:'public', color:'#7455b1'},
  {rowIdx:7, name:'GitHub', url:'https://github.com/koomean', icon:'fab fa-github', description:'โค้ด โครงการ และสิ่งที่กำลังพัฒนา', group:'public', color:'#516074'},
  {rowIdx:8, name:'Portfolio', url:'https://koomean.github.io/Portfolio/', icon:'fas fa-user', description:'รู้จัก Koo Mean ผ่านผลงานและประสบการณ์', group:'public', color:'#a06b31'}
];
const privateApp = {rowIdx:99, name:'Dashboard ตัวอย่าง', url:'https://dashboard.koomean.com/', icon:'fas fa-chart-line', description:'ตัวอย่างแอปสำหรับบัญชีผู้ดูแลระบบ', group:'admin', color:'#2460e8'};
const links = [
  {title:'YouTube', url:'https://www.youtube.com/@koomean', icon:'fab fa-youtube', group:'public'},
  {title:'GitHub', url:'https://github.com/koomean', icon:'fab fa-github', group:'public'},
  {title:'Instagram', url:'https://www.instagram.com/koomean/', icon:'fab fa-instagram', group:'public'},
  {title:'Koo Mean SITE', url:'https://link.koomean.com/', icon:'fas fa-link', group:'public'}
];
const tokens = new Set();
let model, pending = [];
function reset() {
  for (const release of pending) release();
  pending = [];
  model = {role:'admin', registration:false, registered:false, rateLimited:false, maintenance:false, delayNext:false, name:'Koo Mean Demo', apps:structuredClone(publicApps), requests:[]};
}
reset();
const escape = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
function send(res, status, body, type='application/json; charset=utf-8', headers={}) {
  res.writeHead(status, {'Content-Type':type, 'Cache-Control':'no-store', 'X-Portal-Preview':'synthetic-fixture', 'X-Content-Type-Options':'nosniff', ...headers});
  res.end(body);
}
const json = (res, status, data, headers) => send(res, status, JSON.stringify(data), undefined, headers);
function token() {
  const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const value = encode({alg:'fixture', typ:'JWT'})+'.'+encode({email:'demo@example.invalid', name:model.name, exp:Math.floor(Date.now()/1000)+3600, nonce:randomUUID()})+'.fixture';
  tokens.add(value);
  return value;
}
async function form(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 65536) throw new Error('Preview request too large');
  }
  return new URLSearchParams(body);
}
function snapshot(authenticated) {
  const admin = authenticated && model.role === 'admin';
  const user = {email:'demo@example.invalid', name:model.name, role:model.role, pic:''};
  const data = {applications:[...model.apps, ...(admin?[privateApp]:[])], links, user:authenticated?user:{role:'public'}, allUsers:admin?[user,{email:'reader@example.invalid',name:'สมาชิกตัวอย่าง',role:'user',pic:''}]:[]};
  if (authenticated && model.registration && !model.registered) data.requireRegistration = true;
  return structuredClone(data);
}
async function handleAPI(req, res) {
  const params = await form(req), action = params.get('action'), rawToken = params.get('idToken');
  const authenticated = Boolean(rawToken && tokens.has(rawToken));
  model.requests.push({action, authenticated, time:new Date().toISOString()});
  model.requests = model.requests.slice(-30);
  if (rawToken && !authenticated) return json(res, 401, {authError:true,message:'Unknown preview identity'});
  if (action === 'maintenanceStatus') return json(res,200,{maintenance:{active:model.maintenance,note:'กำลังทดสอบหน้าปิดปรับปรุงในพรีวิว',reopenAt:Date.now()+120000,serverTime:Date.now()}});
  if (action === 'bootstrap') {
    if (model.rateLimited) return json(res,429,{message:'Fixture rate limit. Turn it off in preview controls.'},{'Retry-After':'5'});
    const data = snapshot(authenticated);
    if (authenticated && model.delayNext) {
      model.delayNext = false;
      await new Promise(resolve => {
        let done = false;
        const release = () => { if (done) return; done=true; clearTimeout(timer); pending=pending.filter(item=>item!==release); resolve(); };
        const timer = setTimeout(release, 8000);
        pending.push(release);
      });
    }
    if (!res.destroyed) json(res,200,data);
    return;
  }
  if (!authenticated) return json(res,401,{message:'Sign in with the demo button first'});
  if (action === 'register') {
    if (params.get('termsAccepted') !== 'true') return json(res,400,{message:'Preview consent is required'});
    model.registered=true; return json(res,200,{success:true});
  }
  if (action === 'updateUserName') {
    model.name = String(params.get('newName') || model.name).slice(0,50);
    return json(res,200,{success:true,name:model.name});
  }
  if (model.role !== 'admin') return json(res,403,{message:'Preview administrator role required'});
  const row = Number(params.get('rowIdx'));
  if (['addApplication','updateApplication'].includes(action)) {
    const app = Object.fromEntries(['name','url','description','group','color','icon'].map(key=>[key,params.get(key)||'']));
    app.starred=params.get('starred')==='true';
    if (action==='addApplication') {app.rowIdx=Math.max(...model.apps.map(item=>item.rowIdx),0)+1;model.apps.push(app);}
    else model.apps=model.apps.map(item=>item.rowIdx===row?{...item,...app}:item);
  } else if (action === 'deleteApplication') model.apps=model.apps.filter(item=>item.rowIdx!==row);
  else if (action === 'moveApplication') {
    const index=model.apps.findIndex(item=>item.rowIdx===row), target=index+(params.get('dir')==='up'?-1:1);
    if(index>=0&&target>=0&&target<model.apps.length) [model.apps[index],model.apps[target]]=[model.apps[target],model.apps[index]];
  } else if (action === 'updateRole') {
    if(params.get('targetEmail')==='demo@example.invalid') model.role=params.get('newRole')||'user';
  } else return json(res,400,{message:'Unknown preview action: '+action});
  json(res,200,{success:true});
}
const googleJS = `(() => {
  let config;
  window.google = {accounts:{id:{
    initialize(value){ config=value; },
    disableAutoSelect(){},
    renderButton(element){
      const button=document.createElement('button');
      button.type='button';button.className='btn btn-primary';
      button.textContent=document.documentElement.lang==='en'?'Sign in with demo account':'เข้าสู่ระบบด้วยบัญชีตัวอย่าง';
      button.addEventListener('click',async()=>{
        button.disabled=true;
        try { const response=await fetch('/__fixture/token',{cache:'no-store'});const data=await response.json();config?.callback({credential:data.credential}); }
        finally {button.disabled=false;}
      });
      element.replaceChildren(button);
    }
  }}};
})();`;
function controlPage() {
  const requests=model.requests.map(item=>`<tr><td>${escape(item.action)}</td><td>${item.authenticated?'Demo account':'Public'}</td><td>${escape(item.time.slice(11,19))}</td></tr>`).reverse().join('');
  const control=(action,label)=>`<form method="post" action="/__fixture/control"><button name="action" value="${action}">${label}</button></form>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portal fixture controls</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:840px;padding:32px 20px;margin:auto;background:#f4f7fc;color:#142a43}h1{line-height:1.2}a{color:#174ac5}section{background:#fff;padding:20px;margin:20px 0;border:1px solid #d8e1ed;border-radius:12px}p{max-width:70ch}form{display:inline-block;margin:4px}button{cursor:pointer;padding:10px 16px;background:#eaf0ff;color:#143e94;border:1px solid #bdcceb;border-radius:7px;font:inherit}table{width:100%;text-align:left;border-collapse:collapse}td,th{padding:7px;border-bottom:1px solid #e1e8f2}code{overflow-wrap:anywhere}strong{color:#114486}</style></head><body><h1>Portal fixture controls</h1><p>This server is for local UI checks. Accounts, API data, and all changes exist only in memory. No production API request or real Google sign-in is sent.</p><p><a href="/">Open Portal preview</a> · <a href="/__fixture/">Refresh controls</a></p><section><h2>Demo identity</h2><p>Current role: <strong>${escape(model.role)}</strong>. Change role here, then refresh the Portal catalog. Sign in through the Portal’s demo account button.</p>${control('admin','Use admin role')}${control('user','Use user role')}${control('notadmin','Use notadmin role')}${control('revoke','Revoke admin role')}</section><section><h2>Scenarios</h2><p>Registration required: <strong>${model.registration&&!model.registered}</strong> · Rate limit: <strong>${model.rateLimited}</strong> · Maintenance: <strong>${model.maintenance}</strong> · Pending responses: <strong>${pending.length}</strong></p>${control('registration','Require registration on next sign-in')}${control('registration-off','Disable registration scenario')}${control('rate-on','Enable 429')}${control('rate-off','Disable 429')}${control('delay','Delay next authenticated bootstrap by 8 seconds')}${control('release','Release delayed responses')}${control('maintenance-on','Enable maintenance')}${control('maintenance-off','Disable maintenance')}${control('reset','Reset all fixture data')}</section><section><h2>Recent fixture requests</h2><p>Only action names and demo authentication state are recorded.</p><table><thead><tr><th>Action</th><th>Identity</th><th>UTC</th></tr></thead><tbody>${requests}</tbody></table></section></body></html>`;
}
async function handleControl(req,res) {
  const params=await form(req), action=params.get('action');
  if(['admin','user','notadmin'].includes(action)) model.role=action;
  else if(action==='revoke') model.role='user';
  else if(action==='registration'){model.registration=true;model.registered=false;}
  else if(action==='registration-off') model.registration=false;
  else if(action==='rate-on') model.rateLimited=true;
  else if(action==='rate-off') model.rateLimited=false;
  else if(action==='maintenance-on') model.maintenance=true;
  else if(action==='maintenance-off') model.maintenance=false;
  else if(action==='delay') model.delayNext=true;
  else if(action==='release') {for(const release of [...pending]) release();}
  else if(action==='reset') reset();
  else return json(res,400,{message:'Unknown fixture control'});
  send(res,303,'','text/plain',{'Location':'/__fixture/'});
}
async function staticFile(req,res,pathname) {
  let relative, status=200;
  const segments=pathname.split('/').filter(Boolean);
  if(pathname==='/'||pathname==='/index.html') relative='index.html';
  else if(segments.length===1&&routeNames.has(segments[0])) {
    if(!pathname.endsWith('/')) return send(res,308,'','text/plain',{'Location':pathname+'/'});
    relative=segments[0]+'/index.html';
  } else if(segments.length===2&&routeNames.has(segments[0])&&segments[1]==='index.html') relative=segments.join('/');
  else if(segments.length>1&&['assets','licenses'].includes(segments[0])&&!segments.some(item=>item==='.'||item==='..'||item.startsWith('.'))) relative=segments.join('/');
  else if(pathname==='/404.html') {relative='404.html';status=404;}
  else {relative='404.html';status=404;}
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)) return send(res,404,'Missing','text/plain');
  let data;
  try { data=await fs.readFile(file); }
  catch {return send(res,404,'Build this preview with npm run build first.','text/plain');}
  const extension=path.extname(file);
  if(extension==='.js') {
    data=Buffer.from(data.toString('utf8').replaceAll(apiURL,'/__fixture/api').replaceAll('https://accounts.google.com/gsi/client','/__fixture/gsi.js'));
  }
  const contentType=mime[extension]||'application/octet-stream';
  if(req.method==='HEAD') return send(res,status,'',contentType,{'Content-Length':String(data.length)});
  // Browsers may request a byte range for the local hero video.
  if(extension==='.mp4'&&req.headers.range) {
    const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    if(match) {
      const start=Number(match[1]),end=Math.min(Number(match[2]||data.length-1),data.length-1);
      if(start<=end&&start<data.length) return send(res,206,data.subarray(start,end+1),contentType,{'Content-Range':`bytes ${start}-${end}/${data.length}`,'Accept-Ranges':'bytes','Content-Length':String(end-start+1)});
      return send(res,416,'',contentType,{'Content-Range':`bytes */${data.length}`});
    }
  }
  send(res,status,data,contentType,{'Content-Length':String(data.length)});
}
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://127.0.0.1:'+port);
    const pathname=decodeURIComponent(url.pathname);
    if(req.method==='POST'&&pathname==='/__fixture/api') return await handleAPI(req,res);
    if(req.method==='POST'&&pathname==='/__fixture/control') return await handleControl(req,res);
    if(!['GET','HEAD'].includes(req.method)) return send(res,405,'Method not allowed','text/plain',{'Allow':'GET, HEAD, POST'});
    if(pathname==='/__fixture'||pathname==='/__fixture/') return send(res,200,controlPage(),'text/html; charset=utf-8');
    if(pathname==='/__fixture/token') return json(res,200,{credential:token()});
    if(pathname==='/__fixture/gsi.js') return send(res,200,googleJS,'text/javascript; charset=utf-8');
    await staticFile(req,res,pathname);
  } catch(error) {
    if(!res.headersSent) json(res,500,{message:'Local fixture request failed'});
    else res.end();
    console.error('Preview error:',error.message);
  }
});
server.on('error',error=>{console.error(`Preview could not listen on 127.0.0.1:${port}: ${error.code || error.message}`);process.exit(1);});
server.listen(port,'127.0.0.1',()=>{
  console.log(`Portal synthetic fixture preview: http://127.0.0.1:${port}/`);
  console.log(`Scenario controls: http://127.0.0.1:${port}/__fixture/`);
  console.log('Production API/GIS URLs are replaced only in served JavaScript. All writes are in memory.');
});
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{for(const release of [...pending])release();server.close(()=>process.exit(0));});
