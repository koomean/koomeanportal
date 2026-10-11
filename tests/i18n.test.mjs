import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/index.html', 'utf8');
const copy = fs.readFileSync('src/i18n.js', 'utf8');
function sourceFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  return source.slice(start, source.indexOf('\n      }', start) + 8);
}
function setup(lang = 'en') {
  const nodes = new Map();
  const state = {lang, applications:[], users:[], pinned:new Set(), selectedIcon:'', selectedIconName:'', commandItems:[], commandIndex:0, favoritesOnly:false};
  const context = vm.createContext({state, URL,
    $:id => {
      if (!nodes.has(id)) nodes.set(id, {value:'', textContent:'', innerHTML:'', hidden:false, setAttribute(){}, addEventListener(){}, classList:{toggle(){}}});
      return nodes.get(id);
    },
    isAdmin:()=>true, uiIcon:()=>'<svg></svg>', iconHtml:()=>'', getIconHtml:()=>'<svg></svg>',
    renderCommandItems(){}, openModal(){}, openLogin(){}, refreshPortal(){},
    window:{open(){}}, loadError:null
  });
  vm.runInContext(copy + '\n' + source.slice(source.indexOf('      const text = {'), source.indexOf('      const state = {')) + '\n' +
    source.match(/const t = key =>[^\n]+/)[0] + '\nthis.translate = t; this.dictionary = uiText;', context);
  for (const name of ['escapeHtml','safeUrl','canonicalUrl','validColor','highlight','localizeMessage','groupKey','groupName','groupColor','appDescription','cardHtml','renderApplications','renderError','renderAdminItems','renderAdminUsers','refreshIconPreview','buildCommandItems','renderWelcome']) {
    vm.runInContext(sourceFunction(name), context);
  }
  return {context, nodes, state, node:context.$, t:context.translate};
}

test('Every declarative translation and dynamic copy key has both languages', () => {
  const x = setup();
  const keys = [...source.matchAll(/data-i18n(?:-(?:title|aria-label|placeholder|content))?="(\w+)"|\bt\("(\w+)"\)/g)].map(m=>m[1] || m[2]);
  for (const key of new Set(keys)) {
    x.state.lang = 'th'; assert.notEqual(x.t(key), key, `Thai ${key}`);
    x.state.lang = 'en'; assert.notEqual(x.t(key), key, `English ${key}`);
  }
  for (const [key, pair] of Object.entries(x.context.dictionary)) {
    assert.equal(pair.length, 2, key);
    assert.ok(pair.every(value=>typeof value==='string' && value.length), key);
    assert.doesNotMatch(pair[1], /[\u0e00-\u0e7f]/, key);
  }
});

test('User-reported navigation, search, footer and help text are bound to language', () => {
  for (const key of ['home','account','searchApps','searchAppsPlaceholder','footer','help','helpTitle','helpDescription','helpWhat','helpLogin','helpApps','shortcutsDescription']) {
    assert.match(source, new RegExp(`data-i18n(?:-aria-label|-placeholder)?="${key}"`));
  }
});

test('Dynamic app controls, empty states and command actions switch without stale Thai', () => {
  const x=setup();
  const app={url:'https://example.com/', name:'Example', group:'public', description:'Authored description'};
  const html=x.context.cardHtml(app,'');
  assert.match(html,/aria-label="Favorites"/);
  assert.match(html,/Open application in a new tab/);
  x.node('app-search').value='missing'; x.context.renderApplications();
  assert.match(x.node('applications').innerHTML,/Try another search/);
  assert.doesNotMatch(x.node('applications').innerHTML,/[\u0e00-\u0e7f]/);
  x.context.buildCommandItems();
  assert.deepEqual(Array.from(x.state.commandItems, item=>item.title), ['Sign in','Settings','Refresh data']);
  x.state.lang='th'; x.context.buildCommandItems();
  assert.equal(x.state.commandItems[1].title,'การตั้งค่า');
});

test('Admin controls and account welcome use current language and escape user input', () => {
  const x=setup();
  x.state.applications=[{url:'https://example.com/',name:'<img>',group:'public',rowIdx:1}];
  x.context.renderAdminItems();
  assert.match(x.node('admin-items').innerHTML,/title="Edit"/);
  assert.match(x.node('admin-items').innerHTML,/&lt;img&gt;/);
  x.context.renderAdminUsers(); assert.match(x.node('admin-users').innerHTML,/No users found/);
  x.context.refreshIconPreview(); assert.equal(x.node('icon-name').textContent,'No icon selected');
  x.state.user={name:'<img>'}; x.context.renderWelcome();
  assert.match(x.node('hero-title').innerHTML,/Welcome &lt;img&gt;/);
  x.state.lang='th'; x.context.renderWelcome(); assert.match(x.node('hero-title').innerHTML,/ยินดีต้อนรับ/);
});

test('Existing UI errors and original catalog copy translate without modifying app data', () => {
  const x=setup();
  assert.equal(x.context.localizeMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'),'Cannot connect to the server');
  x.context.renderError('เซิร์ฟเวอร์ตอบกลับด้วยข้อมูลที่ไม่ถูกต้อง');
  assert.match(x.node('applications').innerHTML,/The server returned an invalid response/);
  const app={url:'https://blog.koomean.com/',description:'blog ของ koomean'};
  assert.equal(x.context.appDescription(app),'Koo Mean’s blog');
  assert.equal(app.description,'blog ของ koomean');
  assert.equal(x.context.appDescription({...app,description:'Custom content'}),'Custom content');
});
