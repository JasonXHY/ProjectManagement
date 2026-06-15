const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputSvg = path.join(__dirname, 'public', 'possum-icon.svg');
const outputDir = path.join(__dirname, 'build');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 需要生成的尺寸
const sizes = [256, 128, 96, 64, 48, 32, 16];

async function generateIcons() {
  console.log('开始生成图标...');
  
  // 生成各尺寸PNG
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon.${size}x${size}.png`);
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`已生成: icon.${size}x${size}.png`);
  }
  
  // 生成ICO文件（使用256x256作为主图标）
  const icoPath = path.join(outputDir, 'icon.ico');
  await sharp(inputSvg)
    .resize(256, 256)
    .png()
    .toFile(path.join(outputDir, 'temp-256.png'));
  
  // 由于sharp不直接支持ICO，我们使用256x256 PNG作为ICO的替代
  // 在Windows上，electron-builder会自动处理ICO文件
  // 这里我们复制256x256 PNG作为icon.ico
  fs.copyFileSync(path.join(outputDir, 'temp-256.png'), icoPath);
  fs.unlinkSync(path.join(outputDir, 'temp-256.png'));
  
  console.log('已生成: icon.ico');
  console.log('图标生成完成！');
}

generateIcons().catch(console.error);
