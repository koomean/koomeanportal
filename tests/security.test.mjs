import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8'), source=fs.readFileSync('src/index.html','utf8');
function sourceFunction(name) {
 const start=source.indexOf('function '+name+'(');assert.ok(start!==-1);
 const end=source.indexOf('\n      function ',start+10);
 return source.slice(start,end).trim();
}
const safeUrl=vm.runInNewContext('('+sourceFunction('safeUrl')+')',{URL});
const validColor=vm.runInNewContext('('+sourceFunction('validColor')+')');
const canonicalUrl=vm.runInNewContext('('+sourceFunction('canonicalUrl')+')',{URL});
test('Public build contains only external executable JS and strict CSP',()=>{
 assert.match(html,/script-src-attr 'none'/);assert.match(html,/object-src 'none'/);assert.match(html,/base-uri 'none'/);
 assert.doesNotMatch(html,/<script(?:\s[^>]*)?>\s*[^<\s]/i);
 assert.doesNotMatch(html,/\son(?:click|error|load|key\w+)\s*=/i);
 assert.doesNotMatch(html,/unsafe-eval/);assert.doesNotMatch(html,/<video[^>]*\ssrc=/i);
});
test('Unsafe, credential-bearing and non-web URLs cannot enter application links',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,test','file:///x','https://user:password@example.com','//example.com','not a URL'])assert.equal(safeUrl(url),'');
 assert.equal(safeUrl('https://example.com/Apps?a=1'),'https://example.com/Apps?a=1');
 assert.notEqual(canonicalUrl('https://example.com/Apps'),canonicalUrl('https://example.com/apps'));
});
test('Colors follow the server contract and exclude CSS injection',()=>{
 for(const c of ['#fff','#123456','#12345678'])assert.equal(validColor(c),true);
 for(const c of ['#ffff','#12345','#1234567','red','#fff;position:fixed'])assert.equal(validColor(c),false);
});
test('Search highlights text without breaking escaped HTML entities',()=>{
 const highlight=vm.runInNewContext('('+sourceFunction('highlight')+')',{escapeHtml:value=>String(value??'').replace(/[&<>"'`]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]))});
 assert.equal(highlight('<img onerror="alert(1)">','<img'),'<mark>&lt;img</mark> onerror=&quot;alert(1)&quot;&gt;');
 assert.equal(highlight('A & B','&'),'A <mark>&amp;</mark> B');
});
test('Repository and custom domain guards',()=>{
 assert.equal(fs.readFileSync('CNAME','utf8').trim(),'koomean.com');
 assert.match(html,/Koo Mean Portal/);assert.match(html,/id="applications"/);
 assert.doesNotMatch(html,/id="feed"|id="links-container"|id="article-viewer"/);
 assert.match(source,/function restoreSession\(\) \{ clearSession\(\); \}/);
 assert.doesNotMatch(source,/localStorage\.setItem\(SESSION_KEY/);
});
