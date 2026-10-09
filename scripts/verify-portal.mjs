import fs from 'node:fs';import assert from 'node:assert/strict';
assert.equal(fs.readFileSync('CNAME','utf8').trim(),'koomean.com');
if(process.env.GITHUB_REPOSITORY)assert.equal(process.env.GITHUB_REPOSITORY,'koomean/koomeanportal');
const html=fs.readFileSync('index.html','utf8');
for(const text of ['id="applications"','id="admin-modal"','Koo Mean Portal','Content-Security-Policy'])assert.ok(html.includes(text));
for(const text of ['id="feed"','id="links-container"','id="article-viewer"'])assert.ok(!html.includes(text));
for(const file of [...html.matchAll(/(?:src|href)="(assets\/[^\"]+)"/g)].map(m=>m[1]))assert.ok(fs.existsSync(file),file);
console.log('PASS Portal identity, CNAME and assets');
