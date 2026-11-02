import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('src/router.js','utf8');
function setup(path='/') {
  const nodes=new Map(), listeners=new Map(), windowListeners=new Map();
  class Node {
    constructor(tag='div') {this.tagName=tag.toUpperCase();this.hidden=false;this.inert=false;this.children=[];this.dataset={};this.attributes=new Map();this.classes=new Set();this.textContent='';this.classList={add:(...names)=>names.forEach(name=>this.classes.add(name)),remove:(...names)=>names.forEach(name=>this.classes.delete(name)),toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this.children=children;}
    setAttribute(key,value){this.attributes.set(key,value);}
    getAttribute(key){return this.attributes.get(key)??null;}
    removeAttribute(key){this.attributes.delete(key);}
    hasAttribute(key){return this.attributes.has(key);}
    querySelector(){return this.heading??null;}
    querySelectorAll(){return this.closeButtons??[];}
    focus(){document.activeElement=this;}
  }
  const $=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
  const links=['/','/apps/','/favorites/','/account/','/settings/','/help/','/admin/'].map(path=>{const link=new Node('a');link.dataset.route=path;link.setAttribute('href',path);return link;});
  const document={documentElement:new Node('html'),createElement:tag=>new Node(tag),querySelectorAll:()=>links,addEventListener:(name,fn)=>listeners.set(name,fn),title:''};
  $('not-found').heading=new Node('h1');
  for(const id of ['account-modal','settings-modal','help-modal','admin-modal']) {
    $(id).classes.add('modal-backdrop');$(id).setAttribute('role','dialog');$(id).setAttribute('aria-modal','true');$(id).closeButtons=[new Node('button')];
  }
  const history=[];
  const window={location:new URL(path,'https://koomean.com'),history:{pushState(_state,_title,path){history.push(path);window.location=new URL(path,window.location);},replaceState(_state,_title,path){window.location=new URL(path,window.location);}},addEventListener:(name,fn)=>windowListeners.set(name,fn),dispatchEvent(){},scrollTo(){}};
  const state={lang:'th',user:null,verified:false,token:'memory-only-fixture'};
  let renders=0;
  const context=vm.createContext({URL,document,window,state,$,isAdmin:()=>Boolean(state.user&&state.verified&&state.user.role==='admin'),renderApplications:()=>renders++,CustomEvent:class {constructor(type,options){this.type=type;this.detail=options?.detail;}}});
  vm.runInContext(source+'\nthis.router={canonicalPortalPath,currentPortalRoute,navigatePortal,renderPortalRoute,initPortalRouter};',context);
  return {router:context.router,$,nodes,document,window,state,history,links,windowListeners,listeners,renders:()=>renders,run:code=>vm.runInContext(code,context)};
}

test('Only explicit Portal paths and their index aliases are recognized',()=>{
  const {router}=setup();
  assert.equal(router.canonicalPortalPath('/index.html'),'/');
  for(const route of ['apps','favorites','account','settings','help','admin']) {
    for(const path of ['/'+route,'/'+route+'/','/'+route+'/index.html']) assert.equal(router.canonicalPortalPath(path),'/'+route+'/');
  }
  for(const path of ['/missing','/apps/missing','/account/index.html/missing','/Apps/','//apps/','/apps%2F','/404.html'])assert.equal(router.canonicalPortalPath(path),'404');
});

test('Route transitions retain the in-memory identity and update visible page and navigation',()=>{
  const x=setup();x.router.initPortalRouter();
  assert.equal(x.$('home').hidden,false);assert.equal(x.$('app-catalog').hidden,false);
  assert.equal(x.$('route-outlet').children.length,4);
  assert.equal(x.$('settings-modal').classes.has('modal-backdrop'),false);
  assert.equal(x.$('settings-modal').getAttribute('role'),null);
  assert.equal(x.$('settings-modal').closeButtons[0].hidden,true);
  assert.equal(x.router.navigatePortal('/settings'),true);
  assert.equal(x.window.location.pathname,'/settings/');
  assert.equal(x.state.token,'memory-only-fixture');
  assert.equal(x.$('settings-modal').hidden,false);assert.equal(x.$('app-catalog').hidden,true);
  assert.equal(x.links[4].getAttribute('aria-current'),'page');
  assert.equal(x.document.activeElement,x.$('page-heading'));
  assert.equal(x.renders(),1);
  x.router.navigatePortal('/favorites/');
  assert.equal(x.$('app-catalog').hidden,false);assert.equal(x.$('home').hidden,true);
  assert.equal(x.$('favorites-filter').hidden,true);
  assert.equal(x.links[4].getAttribute('aria-current'),null);
  x.state.favoritesOnly=true;x.router.navigatePortal('/apps/');
  assert.equal(x.$('favorites-filter').hidden,false);assert.equal(x.state.favoritesOnly,true);
});

test('Account and administrator pages gate content against current verified identity',()=>{
  const x=setup('/account/');x.router.initPortalRouter();
  assert.equal(x.$('account-modal').hidden,true);assert.equal(x.$('route-guard').hidden,false);
  assert.equal(x.$('route-guard').children.at(-1).dataset.action,'login');
  x.state.user={role:'public'};x.state.verified=true;x.router.renderPortalRoute();
  assert.equal(x.$('route-guard').hidden,true);assert.equal(x.$('account-modal').hidden,false);
  x.router.navigatePortal('/admin/');
  assert.equal(x.$('admin-modal').hidden,true);assert.equal(x.$('route-guard').children.length,2);
  x.state.user.role='admin';x.router.renderPortalRoute();assert.equal(x.$('admin-modal').hidden,false);
  x.state.verified=false;x.router.renderPortalRoute();
  assert.equal(x.$('admin-modal').hidden,true);assert.equal(x.$('admin-modal').inert,true);
});

test('Unknown nested paths remain visible as 404 and never become a catalog route',()=>{
  const x=setup('/apps/no-such-page');x.router.initPortalRouter();
  assert.equal(x.window.location.pathname,'/apps/no-such-page');
  assert.equal(x.$('not-found').hidden,false);assert.equal(x.$('home').hidden,true);assert.equal(x.$('app-catalog').hidden,true);
  assert.equal(x.$('page-header').hidden,true);assert.equal(x.$('route-guard').hidden,true);
  assert.equal(x.document.title,'404 · Koo Mean Portal');
  assert.ok(x.links.every(link=>link.getAttribute('aria-current')===null));
});

test('Canonicalization, language, browser history and maintenance obey route boundaries',()=>{
  const x=setup('/help/index.html?from=portal');x.router.initPortalRouter();
  assert.equal(x.window.location.pathname,'/help/');assert.equal(x.window.location.search,'?from=portal');
  x.state.lang='en';x.windowListeners.get('koo-language-change')();assert.equal(x.$('page-heading').textContent,'Help');
  assert.equal(x.router.navigatePortal('https://example.com/settings/'),false);assert.equal(x.history.length,0);
  x.document.documentElement.dataset.maintenance='active';
  assert.equal(x.router.navigatePortal('/apps/'),false);assert.equal(x.window.location.pathname,'/help/');
  delete x.document.documentElement.dataset.maintenance;
  x.window.location=new URL('https://koomean.com/apps/');x.windowListeners.get('popstate')();
  assert.equal(x.$('page-heading').textContent,'All applications');assert.equal(x.$('app-catalog').hidden,false);
});

test('The asynchronous bootstrap profile update preserves the active route title',()=>{
  const main=fs.readFileSync('src/index.html','utf8');
  const start=main.indexOf('      function applyProfile()');
  const end=main.indexOf('      function clearPortalData()',start);
  assert.ok(start>=0&&end>start);
  for(const path of ['/settings/','/apps/missing-page']) {
    const x=setup(path);x.state.lang='en';x.state.profile={name:'Profile name'};
    x.router.initPortalRouter();const title=x.document.title;
    x.run(main.slice(start,end)+'\napplyProfile();');
    assert.equal(x.document.title,title,path);
  }
});

test('Build publishes real known pages and a nonredirecting custom 404 with root-relative assets',()=>{
  const manifest=JSON.parse(fs.readFileSync('build-manifest.json','utf8'));
  assert.deepEqual(manifest.routes,['/','/apps/','/favorites/','/account/','/settings/','/help/','/admin/']);
  for(const path of ['index.html','404.html',...manifest.routes.filter(path=>path!=='/').map(path=>path.slice(1)+'index.html')]) {
    const html=fs.readFileSync(path,'utf8');assert.match(html,/id="not-found"/);
    assert.match(html,/src="\/assets\/app-[a-f0-9]+\.js"/);
    assert.doesNotMatch(html,/\b(?:src|href|data-src)="assets\//);
    assert.doesNotMatch(html,/http-equiv="refresh"/i);
  }
  const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
  const notFound=fs.readFileSync('404.html','utf8');
  assert.match(notFound,/<section\b[^>]*id="home"[^>]*\shidden/);
  assert.match(notFound,/<section\b[^>]*id="app-catalog"[^>]*\shidden/);
  assert.doesNotMatch(notFound,/<section\b[^>]*id="not-found"[^>]*\shidden/);
  assert.match(notFound,/<meta name="robots" content="noindex">/);
  assert.match(workflow,/cp index\.html 404\.html CNAME _site\//);
  assert.match(workflow,/cp -R apps favorites account settings help admin _site\//);
});
