import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {transform} from 'esbuild';
const hash = value => createHash('sha256').update(value).digest('hex').slice(0,16);
const router = fs.readFileSync('src/router.js','utf8');
const routes = [...router.match(/const PORTAL_PATHS = Object\.freeze\((\[[^;]+\])\);/)[1].matchAll(/"(\/[a-z/]*\/?)"/g)].map(match=>match[1]);
if (!routes.includes('/') || routes.some(path=>!/^\/(?:[a-z]+\/)?$/.test(path))) throw new Error('Invalid Portal routes');
let html = fs.readFileSync('src/index.html','utf8').replace('/* BUILD_THEME */',fs.readFileSync('src/theme.js','utf8')).replace('/* BUILD_MAINTENANCE */',fs.readFileSync('src/maintenance.js','utf8')).replace('/* BUILD_I18N */',fs.readFileSync('src/i18n.js','utf8')).replace('/* BUILD_ROUTER */',router);
html = html.replace(/\b(src|href|data-src)="assets\//g,'$1="/assets/');
const iconNames = fs.readdirSync('src/icons').filter(file => /^[a-z0-9-]+\.svg$/.test(file)).map(file => file.slice(0,-4)).sort();
const uiIcon = name => {
  if (!iconNames.includes(name)) throw new Error('Unknown UI icon: '+name);
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#ui-${name}"></use></svg>`;
};
const sprite = iconNames.map(name => {
  const svg = fs.readFileSync(`src/icons/${name}.svg`,'utf8');
  if (/<(?:script|foreignObject|image|use)\b|\son\w+=|\shref=/i.test(svg)) throw new Error('Unsafe SVG: '+name);
  return `<symbol id="ui-${name}" viewBox="0 0 24 24">${svg.replace(/<!--[\s\S]*?-->/g,'').replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'').trim()}</symbol>`;
}).join('');
html = html.replace('/* BUILD_ICON_NAMES */ []',JSON.stringify(iconNames));
html = html.replace('<!-- BUILD_ICON_SPRITE -->',`<svg class="icon-definitions" width="0" height="0" aria-hidden="true" focusable="false">${sprite}</svg>`);
html = html.replace(/<span data-ui-icon="([a-z0-9-]+)"><\/span>/g,(_,name)=>uiIcon(name));
const scripts = [], styles = [fs.readFileSync('src/vendor.css','utf8')];
html = html.replace(/<style>([\s\S]*?)<\/style>/g, (_,css) => { styles.push(css); return ''; });
styles.push(fs.readFileSync('src/enhancements.css','utf8'));
styles.push(fs.readFileSync('src/experience.css','utf8'));
styles.push(fs.readFileSync('src/maintenance.css','utf8'));
html = html.replace(/<script>([\s\S]*?)<\/script>/g, (_,js) => { scripts.push(js); return ''; });
html = html.replace(/<link[^>]+href="https:\/\/(?:fonts.googleapis.com|fonts.gstatic.com|cdnjs.cloudflare.com)[^"]+"[^>]*>/g,'');
html = html.replace(/<!--[\s\S]*?-->/g,'');
const css = (await transform(styles.join('\n'),{loader:'css',minify:true,target:'es2022'})).code;
const js = (await transform(scripts.join('\n;\n'),{loader:'js',minify:true,target:'es2022',legalComments:'none'})).code;
fs.mkdirSync('assets',{recursive:true});
// Keep published content-hashed assets: cached HTML and open tabs still reference them.
const cssFile = 'portal-'+hash(css)+'.css', jsFile = 'app-'+hash(js)+'.js';
fs.writeFileSync('assets/'+cssFile,css); fs.writeFileSync('assets/'+jsFile,js);
const csp = "default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self' https://accounts.google.com/gsi/; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; font-src 'self'; img-src 'self' https: data:; media-src 'self' https://d8j0ntlcm91z4.cloudfront.net; connect-src 'self' https://koomean-proxy.meanchannel52.workers.dev https://accounts.google.com/gsi/ https://thesvg.org/api/registry.json; frame-src https://accounts.google.com/gsi/; form-action 'none'; upgrade-insecure-requests";
html = html.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="'+csp+'">');
html = html.replace('</head>',`<link rel="stylesheet" href="/assets/${cssFile}">\n<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/ibm-2e57acf1ca9e.woff2">\n<link rel="preload" as="image" href="/assets/hero-poster.webp" fetchpriority="high">\n<script src="/assets/${jsFile}" defer></script>\n</head>`);
html = html.replace(/\n\s*\n/g,'\n'); fs.writeFileSync('index.html',html);
for (const route of routes.filter(path=>path!=='/')) {
  const directory = route.slice(1,-1);
  fs.mkdirSync(directory,{recursive:true}); fs.writeFileSync(directory+'/index.html',html);
}
// GitHub Pages serves this body with HTTP 404 and retains the missing URL.
// It deliberately does not redirect the request or rewrite it to the home page.
let notFound=html.replace(/<title>[^<]*<\/title>/,'<title>404 · Koo Mean Portal</title>\n<meta name="robots" content="noindex">');
for(const id of ['home','app-catalog','page-header','not-found']) {
  notFound=notFound.replace(new RegExp(`<([a-z][\\w:-]*)\\b([^>]*\\bid="${id}"[^>]*)>`,'i'),(_tag,name,attributes)=>{
    const visibleAttributes=attributes.replace(/\s+hidden(?:="[^"]*")?/g,'');
    return `<${name}${visibleAttributes}${id==='not-found'?'':' hidden'}>`;
  });
}
fs.writeFileSync('404.html',notFound);
const manifest = {htmlBytes:Buffer.byteLength(html),routes,notFound:'404.html',css:{file:cssFile,bytes:Buffer.byteLength(css)},js:{file:jsFile,bytes:Buffer.byteLength(js)}};
fs.writeFileSync('build-manifest.json',JSON.stringify(manifest,null,2)+'\n'); console.log(manifest);
