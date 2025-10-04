const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src192 = path.join(__dirname, '..', 'icons', 'icon-192.svg');
const src512 = path.join(__dirname, '..', 'icons', 'icon-512.svg');
const outDir = path.join(__dirname, '..', 'icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function gen() {
  await sharp(src192).png().resize(192, 192).toFile(path.join(outDir, 'icon-192.png'));
  await sharp(src512).png().resize(512, 512).toFile(path.join(outDir, 'icon-512.png'));
  console.log('Generated PNG icons in icons/');
}

gen().catch(err => { console.error(err); process.exit(1); });
