import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {webkit, devices} from 'playwright';

const root = process.cwd(), checks = [];
const browser = await webkit.launch({headless:true});
const watchdog = setTimeout(() => process.exit(1), 90000);
function ok(name, value) { assert.ok(value, name); checks.push(name); console.log('PASS ' + name); }
async function setup(device, {paused = false, reduced = false, empty = false} = {}) {
  const context = await browser.newContext({...device, reducedMotion:reduced ? 'reduce' : 'no-preference'});
  if (paused) await context.addInitScript(() => localStorage.setItem('koomean_portal_prefs_v3', JSON.stringify({marqueeEnabled:false})));
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let release;
  const responseReady = new Promise(resolve => { release = resolve; });
  await page.route('https://koomean.com/**', route => {
    const file = path.join(root, new URL(route.request().url()).pathname.replace(/^\/$/, '/index.html'));
    return file.startsWith(root + '/') && fs.existsSync(file) ? route.fulfill({path:file}) : route.fulfill({status:404});
  });
  await page.route('https://koomean-proxy.meanchannel52.workers.dev/**', async route => {
    const params = new URLSearchParams(route.request().postData());
    assert.equal(params.has('idToken'), false, 'Motion checks remain anonymous');
    if (params.get('action') === 'maintenanceStatus') return route.fulfill({json:{maintenance:{active:false}}});
    assert.equal(params.get('action'), 'bootstrap');
    await responseReady;
    return route.fulfill({json:{applications:[], user:{role:'public'}, links:empty ? [] : ['YouTube','GitHub','Instagram','Facebook'].map(title => ({title, url:'https://example.invalid/' + title.toLowerCase(), group:'public', icon:'fas fa-star'}))}});
  });
  await page.goto('https://koomean.com/', {waitUntil:'domcontentloaded'});
  return {context, page, errors, release};
}
async function rendered(page) {
  await page.waitForFunction(() => document.getElementById('marquee-section').getAttribute('aria-busy') === 'false');
}
async function moving(page) {
  const sample = () => page.locator('#marquee-track').evaluate(track => ({time:track.getAnimations()[0]?.currentTime, transform:getComputedStyle(track).transform, state:getComputedStyle(track).animationPlayState}));
  const before = await sample();
  await page.waitForTimeout(250);
  const after = await sample();
  return after.state === 'running' && after.time > before.time + 100 && after.transform !== before.transform;
}
try {
  for (const [name, device] of [['iPad portrait',devices['iPad Pro 11']], ['iPad landscape',devices['iPad Pro 11 landscape']], ['iPhone',devices['iPhone 13']]]) {
    const env = await setup(device), {page} = env;
    await page.waitForTimeout(150);
    ok(name + ': an empty rail has no animation while bootstrap is pending', await page.locator('#marquee-track').evaluate(track => !track.children.length && getComputedStyle(track).animationName === 'none'));
    env.release(); await rendered(page);
    ok(name + ': delayed links start moving without any tap', await moving(page));
    ok(name + ': toolbar controls have equal heights and aligned row edges', await page.evaluate(() => {
      const rects = ['#app-search','#group-filter','.view-switcher','#refresh-btn'].map(selector => document.querySelector(selector).getBoundingClientRect()).filter(rect => rect.width > 0);
      return rects.every(rect => rect.height === 44) && rects.every(rect => rects.every(other => Math.abs(rect.top - other.top) > 1 || Math.abs(rect.bottom - other.bottom) < 1));
    }));
    await page.locator('#marquee-toggle').tap();
    ok(name + ': pause is saved', await page.evaluate(() => JSON.parse(localStorage.getItem('koomean_portal_prefs_v3')).marqueeEnabled === false));
    await page.reload(); await rendered(page);
    ok(name + ': saved pause survives reload', await page.locator('#marquee-track').evaluate(track => getComputedStyle(track).animationPlayState === 'paused'));
    await page.locator('#marquee-toggle').tap();
    ok(name + ': play resumes despite touch focus', await moving(page));
    await page.reload(); await rendered(page);
    ok(name + ': saved play starts on the next visit without a tap', await moving(page));
    ok(name + ': no runtime errors', env.errors.length === 0);
    await env.context.close();
  }
  const reduced = await setup(devices['iPad Pro 11'], {reduced:true});
  reduced.release(); await rendered(reduced.page);
  ok('Reduced motion keeps links static', await reduced.page.locator('#marquee-track').evaluate(track => getComputedStyle(track).animationName === 'none'));
  await reduced.context.close();
  const paused = await setup(devices['iPad Pro 11'], {paused:true});
  paused.release(); await rendered(paused.page);
  ok('An existing saved pause is respected on delayed first load', await paused.page.locator('#marquee-track').evaluate(track => getComputedStyle(track).animationPlayState === 'paused'));
  await paused.context.close();
  const empty = await setup(devices['iPad Pro 11'], {empty:true});
  empty.release(); await rendered(empty.page);
  ok('An empty API result hides the rail and finishes loading', await empty.page.locator('#marquee-section').isHidden());
  await empty.context.close();
  const out = process.env.PORTAL_REPORT_DIR || 'test-results';
  fs.mkdirSync(out, {recursive:true});
  fs.writeFileSync(path.join(out,'webkit-results.json'), JSON.stringify({passed:checks.length, checks}, null, 2) + '\n');
  console.log(checks.length + ' WebKit motion checks passed');
} finally { clearTimeout(watchdog); await browser.close(); }
