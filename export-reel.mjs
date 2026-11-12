import { chromium } from 'playwright';
import { mkdir, writeFile, rm, unlink } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';

const OUT_DIR = 'H:\\DEV\\Web Games\\Reels';
const FRAMES = join(OUT_DIR, '_frames');
const MP4 = join(OUT_DIR, 'infinite-express-reel.mp4');
const AUDIO = 'H:\\DEV\\Web Games\\Infinite Express\\assets\\audio\\infinite-express-voiceover.mp3';
const STUDIO = 'http://127.0.0.1:8765/index.html';
const FPS = 30;

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: false });
    p.on('exit', code => (code === 0 ? resolve() : reject(new Error(cmd + ' exited ' + code))));
  });
}

await mkdir(OUT_DIR, { recursive: true });
await rm(FRAMES, { recursive: true, force: true });
await mkdir(FRAMES, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--enable-webgl']
});
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
page.setDefaultTimeout(120000);

console.log('Opening studio…');
await page.goto(STUDIO, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__reelExport && window.__reelExport.ready());

const duration = await page.evaluate(() => window.__reelExport.duration());
const total = Math.ceil(duration * FPS);
console.log(`Rendering ${total} frames @ ${FPS}fps (${duration.toFixed(2)}s)…`);

for (let i = 0; i < total; i++) {
  const time = Math.min(duration, i / FPS);
  const dataUrl = await page.evaluate(t => window.__reelExport.renderAt(t), time);
  const b64 = dataUrl.split(',')[1];
  const file = join(FRAMES, `frame_${String(i).padStart(5, '0')}.jpg`);
  await writeFile(file, Buffer.from(b64, 'base64'));
  if (i % 30 === 0 || i === total - 1) console.log(`  frame ${i + 1}/${total}`);
}

await browser.close();

console.log('Muxing MP4…');
await run('ffmpeg', [
  '-y',
  '-framerate', String(FPS),
  '-i', join(FRAMES, 'frame_%05d.jpg'),
  '-i', AUDIO,
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-preset', 'medium',
  '-crf', '17',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-shortest',
  '-movflags', '+faststart',
  MP4
]);

await rm(FRAMES, { recursive: true, force: true });
console.log('Saved:', MP4);
