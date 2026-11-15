/**
 * Production protect build for Cloudflare Pages.
 * Source stays readable in the repo; dist/ ships minified + obfuscated JS.
 *
 * Usage: node scripts/protect.mjs
 * CF build command: npm run protect
 * CF output directory: dist
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { minify as minifyHtml } from 'html-minifier-terser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const COPY_ROOT = [
  '_headers',
  '_redirects',
  '404.html',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
];

/** Paths under assets/ that must never ship publicly */
const ASSET_SKIP = new Set([
  'ROSTER.md',
  'learn-day1',
  'reel',
]);

const GUARD = `
(function(){
  var _n=0;
  function punch(){
    try{
      document.documentElement.innerHTML='';
      document.write('');
      location.replace('/');
    }catch(e){}
  }
  function watch(){
    var w=window.outerWidth-window.innerWidth;
    var h=window.outerHeight-window.innerHeight;
    if(w>160||h>160){_n++;if(_n>2)punch();}else{_n=0;}
  }
  document.addEventListener('contextmenu',function(e){e.preventDefault();});
  document.addEventListener('keydown',function(e){
    var k=e.keyCode||e.which;
    if(k===123||(e.ctrlKey&&e.shiftKey&&(k===73||k===74||k===67))||(e.ctrlKey&&k===85)){
      e.preventDefault();e.stopPropagation();punch();
    }
  },true);
  setInterval(watch,1200);
})();
`.trim();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

function copyDir(src, dest, skipNames = ASSET_SKIP) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipNames.has(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to, skipNames);
    else fs.copyFileSync(from, to);
  }
}

function obfuscate(code) {
  return JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.65,
    deadCodeInjection: false,
    debugProtection: true,
    debugProtectionInterval: 2000,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayThreshold: 0.8,
    splitStrings: true,
    splitStringsChunkLength: 6,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
  }).getObfuscatedCode();
}

async function protectHtml(fileName) {
  const srcPath = path.join(root, fileName);
  if (!fs.existsSync(srcPath)) {
    console.warn('skip missing', fileName);
    return;
  }
  let html = fs.readFileSync(srcPath, 'utf8');

  // External CDN scripts stay as-is; only rewrite inline <script>...</script>
  html = html.replace(
    /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi,
    (full, attrs, body) => {
      const trimmed = body.trim();
      if (!trimmed) return full;
      const sealed = obfuscate(`${GUARD}\n${trimmed}`);
      return `<script${attrs}>${sealed}</script>`;
    },
  );

  const minified = await minifyHtml(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    minifyCSS: true,
    minifyJS: false, // already obfuscated
    keepClosingSlash: true,
  });

  const out = path.join(dist, fileName);
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, minified, 'utf8');
  const before = fs.statSync(srcPath).size;
  const after = Buffer.byteLength(minified);
  console.log(`protected ${fileName}: ${before} → ${after} bytes`);
}

async function main() {
  if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true, force: true });
  ensureDir(dist);

  for (const name of COPY_ROOT) {
    copyFile(path.join(root, name), path.join(dist, name));
  }
  copyDir(path.join(root, 'assets'), path.join(dist, 'assets'));

  // Public station only — studio / tools stay out of dist
  await protectHtml('index.html');

  // Ensure redirects/headers land even if copy list missed them
  copyFile(path.join(root, '_headers'), path.join(dist, '_headers'));
  copyFile(path.join(root, '_redirects'), path.join(dist, '_redirects'));
  copyFile(path.join(root, '404.html'), path.join(dist, '404.html'));

  console.log('dist/ ready for Cloudflare Pages (output directory: dist)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
