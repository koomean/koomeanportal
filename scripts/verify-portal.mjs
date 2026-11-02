import fs from 'node:fs';import assert from 'node:assert/strict';
assert.equal(fs.readFileSync('CNAME','utf8').trim(),'koomean.com');
if(process.env.GITHUB_REPOSITORY)assert.equal(process.env.GITHUB_REPOSITORY,'koomean/koomeanportal');
const html=fs.readFileSync('index.html','utf8');
for(const text of ['id="applications"','id="admin-modal"','Koo Mean Portal','Content-Security-Policy'])assert.ok(html.includes(text));
for(const text of ['id="feed"','id="links-container"','id="article-viewer"'])assert.ok(!html.includes(text));
const manifest=JSON.parse(fs.readFileSync('build-manifest.json','utf8'));
assert.deepEqual(manifest.routes,['/','/apps/','/favorites/','/account/','/settings/','/help/','/admin/']);
for(const file of ['index.html','404.html',...manifest.routes.filter(path=>path!=='/').map(path=>path.slice(1)+'index.html')]) {
  const page=fs.readFileSync(file,'utf8');
  for(const text of ['id="route-outlet"','id="not-found"','Content-Security-Policy'])assert.ok(page.includes(text),file+': '+text);
  assert.doesNotMatch(page,/\b(?:src|href|data-src)="assets\//,file+': relative asset');
  assert.doesNotMatch(page,/<meta[^>]+http-equiv="refresh"/i,file+': redirect');
  for(const asset of [...page.matchAll(/(?:src|href|data-src)="(\/assets\/[^\"]+)"/g)].map(m=>m[1]))assert.ok(fs.existsSync(asset.slice(1)),file+': '+asset);
}
assert.match(fs.readFileSync('404.html','utf8'),/<title>404 · Koo Mean Portal<\/title>/);
console.log('PASS Portal identity, CNAME, page routes, 404 and assets');
