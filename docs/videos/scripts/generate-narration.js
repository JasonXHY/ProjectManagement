/**
 * 生成 PMAer 总览视频配音音频
 * 使用 Edge TTS (XiaoxiaoNeural) 合成中文女声
 *
 * 用法: node docs/videos/scripts/generate-narration.js
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const VOICE = 'zh-CN-XiaoxiaoNeural';

// 配音文案 — 按时间轴对齐视频场景
const segments = [
  { text: 'PMAer，AI驱动的项目管理助手。', start: 0.5, end: 4.5 },
  { text: '项目文件散落各处，管理混乱低效。', start: 5.5, end: 10.5 },
  { text: 'PMAer将所有文件统一归档，通过AI智能分类，自动识别文件内容。', start: 13, end: 19 },
  { text: 'AI分析文件，精准归类到对应阶段，项目阶段自动推进。', start: 21, end: 27 },
  { text: '十个卡片按阶段智能切换，项目全貌，一页掌握。', start: 29, end: 36 },
  { text: '一键导出导入，项目转交不丢数据。', start: 39, end: 46 },
  { text: 'PMAer，体验深化版，让项目管理更智能。', start: 49, end: 57 },
];

async function generate() {
  // 为每个片段生成独立音频
  const segmentFiles = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segFile = path.join(OUTPUT_DIR, `.seg_${i}.mp3`);
    const duration = seg.end - seg.start;

    // 使用 edge-tts 生成音频
    const cmd = `edge-tts --voice "${VOICE}" --text "${seg.text}" --write-media "${segFile}"`;
    console.log(`  Generating segment ${i}: "${seg.text.substring(0, 20)}..."`);
    execSync(cmd, { stdio: 'pipe' });

    // 获取实际音频时长
    const probe = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${segFile}"`
    , { encoding: 'utf-8' }).trim();
    const actualDur = parseFloat(probe);
    console.log(`    Duration: ${actualDur}s (target: ${duration}s)`);

    segmentFiles.push({ file: segFile, start: seg.start, duration: actualDur });
  }

  // 生成静音底板 (60秒)
  const silenceFile = path.join(OUTPUT_DIR, '.silence.mp3');
  execSync(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 60 -q:a 9 "${silenceFile}"`, { stdio: 'pipe' });
  console.log('  Generated 60s silence base');

  // 使用 adelay 将每个片段延迟到正确时间点，然后混合
  const inputs = [`-i "${silenceFile}"`];
  const filterParts = [];

  for (let i = 0; i < segmentFiles.length; i++) {
    const seg = segmentFiles[i];
    inputs.push(`-i "${seg.file}"`);
    const delayMs = Math.round(seg.start * 1000);
    // adelay: delay the audio, then pad to full length
    filterParts.push(`[${i + 1}]adelay=${delayMs}|${delayMs},apad=whole_dur=60[s${i}]`);
  }

  // 混合所有轨道
  const mixInputs = segmentFiles.map((_, i) => `[s${i}]`).join('');
  filterParts.push(`[0]${mixInputs}amix=inputs=${segmentFiles.length + 1}:duration=first:dropout_transition=0[out]`);

  const filterComplex = filterParts.join(';');
  const finalAudio = path.join(OUTPUT_DIR, 'narration.mp3');

  const ffmpegCmd = [
    'ffmpeg -y',
    inputs.join(' '),
    `-filter_complex "${filterComplex}"`,
    '-map "[out]"',
    '-t 60',
    '-q:a 2',
    `"${finalAudio}"`,
  ].join(' ');

  console.log('  Mixing audio...');
  execSync(ffmpegCmd, { stdio: 'pipe' });

  // 验证
  const dur = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${finalAudio}"`, { encoding: 'utf-8' }).trim();
  console.log(`\nDone! Narration: ${finalAudio} (${dur}s)`);

  // 清理临时文件
  for (const seg of segmentFiles) {
    fs.unlinkSync(seg.file);
  }
  fs.unlinkSync(silenceFile);
}

generate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
