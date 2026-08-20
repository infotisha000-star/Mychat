import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/logo.svg');
const publicDir = path.resolve('public');

async function generateIcons() {
  console.log('Generating PNG icons from logo.svg...');
  
  const svgBuffer = fs.readFileSync(svgPath);

  // 192x192 PWA Icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Generated icon-192.png');

  // 512x512 PWA Icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Generated icon-512.png');

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');

  // 64x64 Favicon
  await sharp(svgBuffer)
    .resize(64, 64)
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Generated favicon.png');

  console.log('All PWA icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
