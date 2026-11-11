import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync, existsSync, renameSync, readdirSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const outDir = join(root, 'assets');
const rawDir = join(outDir, 'reel-raw');
const finalMp4 = join(outDir, 'infinite-express-reel-live.mp4');
const voMp3 = join(outDir, 'reel-voiceover.mp3');
const ffmpeg =
  process.env.FFMPEG ||
  'C:\\Users\\SRIKANTH\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.css': 'text/css',
};

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(cmd + ' exit ' + code))));
  });
}

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const path = join(root, url === '/' ? 'infinite-express-3d.html' : url.replace(/^\//, ''));
  if (!path.startsWith(root) || !existsSync(path)) {
    res.writeHead(404);
    res.end('missing');
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
});

await new Promise((r) => server.listen(8765, r));
console.log('Serving on http://127.0.0.1:8765');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  recordVideo: { dir: rawDir, size: { width: 1080, height: 1920 } },
});
const page = await context.newPage();
await page.goto('http://127.0.0.1:8765/infinite-express-3d.html?reel=1', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(14000);
await context.close();
await browser.close();
server.close();

const webm = readdirSync(rawDir)
  .filter((f) => f.endsWith('.webm'))
  .map((f) => join(rawDir, f))
  .sort((a, b) => existsSync(b) - existsSync(a))[0];
if (!webm) throw new Error('No recorded webm');

const silentMp4 = join(outDir, 'infinite-express-reel-silent.mp4');
await run(ffmpeg, ['-y', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-an', silentMp4]);

const script =
  "All aboard! Your seat is waiting. This is the Infinite Express — and we're starting a very big, long journey from Unity Station. First we need one hundred followers to fill up the coaches… and make this train depart. Follow at infiniteexpress.live, claim your seat, and let's have some fun.";

if (!existsSync(voMp3)) {
  console.log('Generating local voiceover (ElevenLabs free queue was busy)…');
  await run('npx', ['-y', 'edge-tts', '--voice', 'en-US-BrianNeural', '--rate=+5%', '--text', script, '--write-media', voMp3]);
}

await run(ffmpeg, [
  '-y',
  '-i',
  silentMp4,
  '-i',
  voMp3,
  '-c:v',
  'copy',
  '-c:a',
  'aac',
  '-shortest',
  '-movflags',
  '+faststart',
  finalMp4,
]);

try {
  unlinkSync(webm);
} catch {}
console.log('Saved', finalMp4);
