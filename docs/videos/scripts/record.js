/**
 * PMAer product demo video recording script
 * Based on 侧耳倾听 record.js, adapted for PMAer 8 independent videos
 * Usage: node docs/videos/scripts/record.js [scene_name]
 *   no args: record all scenes
 *   with args: record only the specified scene
 */
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BASE_DIR = path.join(__dirname, '..');
const HTML_DIR = path.join(BASE_DIR, 'html');
const OUTPUT_DIR = path.join(BASE_DIR, 'output');
const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;

const scenes = [
  { file: '00-overview.html', duration: 60, name: '00-overview' },
  { file: '01-card-system.html', duration: 30, name: '01-card-system' },
  { file: '02-ai-classification.html', duration: 30, name: '02-ai-classification' },
  { file: '03-profit-calculator.html', duration: 30, name: '03-profit-calculator' },
  { file: '04-project-handover.html', duration: 30, name: '04-project-handover' },
  { file: '05-ai-chat-summary.html', duration: 30, name: '05-ai-chat-summary' },
  { file: '06-signature-tracking.html', duration: 30, name: '06-signature-tracking' },
  { file: '07-settings.html', duration: 30, name: '07-settings' },
];

async function recordScene(browser, scene) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: { dir: OUTPUT_DIR, size: { width: WIDTH, height: HEIGHT } },
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.id = '__freeze';
    style.textContent =
      '*, *::before, *::after { animation-play-state: paused !important;' +
      ' -webkit-animation-play-state: paused !important; }';
    const attach = () => (document.head || document.documentElement).appendChild(style);
    if (document.head || document.documentElement) attach();
    else document.addEventListener('DOMContentLoaded', attach, { once: true });
    window.__unfreeze = () => document.getElementById('__freeze')?.remove();
  });

  const filePath = path.join(HTML_DIR, scene.file);
  if (!fs.existsSync(filePath)) {
    console.log('  SKIP: ' + scene.file + ' not found');
    await context.close();
    return null;
  }

  await page.goto('file:///' + filePath.replace(/\\/g, '/'), { waitUntil: 'domcontentloaded' });

  await page.evaluate(async () => {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    await Promise.all([...links].map(link =>
      new Promise(resolve => { link.onload = resolve; link.onerror = resolve; setTimeout(resolve, 3000); })
    ));
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  });

  await page.evaluate(() => { if (window.__unfreeze) window.__unfreeze(); });
  await page.waitForTimeout(scene.duration * 1000);

  const video = page.video();
  await context.close();
  const webmPath = await video.path();
  console.log('  WebM: ' + webmPath);

  const mp4Path = path.join(OUTPUT_DIR, scene.name + '.mp4');
  const cmd = [
    'ffmpeg', '-y', '-i', '"' + webmPath + '"',
    '-t', String(scene.duration), '-r', String(FPS),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20',
    '-movflags', '+faststart', '"' + mp4Path + '"',
  ].join(' ');
  console.log('  Encoding: ' + scene.name + '.mp4');
  execSync(cmd, { stdio: 'pipe' });

  const dur = execSync('ffprobe -v error -show_entries format=duration -of csv=p=0 "' + mp4Path + '"', { encoding: 'utf-8' }).trim();
  console.log('  Duration: ' + dur + 's');
  return mp4Path;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const targetName = process.argv[2];
  const toRecord = targetName ? scenes.filter(s => s.name === targetName) : scenes;
  if (toRecord.length === 0) {
    console.error('Scene not found: ' + targetName);
    console.error('Available: ' + scenes.map(s => s.name).join(', '));
    process.exit(1);
  }

  console.log('Launching browser (Edge)...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });

  for (const scene of toRecord) {
    console.log('\nRecording: ' + scene.file + ' (' + scene.duration + 's)');
    await recordScene(browser, scene);
  }
  await browser.close();

  const webmFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
  for (const f of webmFiles) fs.unlinkSync(path.join(OUTPUT_DIR, f));

  console.log('\nDone! Videos: ' + OUTPUT_DIR);
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
