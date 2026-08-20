const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const svgBuffer = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0f172a"/>
  <rect x="32" y="32" width="448" height="448" rx="96" fill="none" stroke="#3b82f6" stroke-width="16" opacity="0.4"/>
  <path d="M160 120h192c22.1 0 40 17.9 40 40v224c0 22.1-17.9 40-40 40H160c-22.1 0-40-17.9-40-40V160c0-22.1 17.9-40 40-40z" fill="#1e293b" stroke="#3b82f6" stroke-width="20"/>
  <path d="M180 200h152M180 260h152M180 320h100" stroke="#60a5fa" stroke-width="24" stroke-linecap="round"/>
  <circle cx="360" cy="150" r="36" fill="#f59e0b"/>
</svg>`);

async function generatePNGs() {
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(dir, 'icon-512.png'));

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(dir, 'icon-192.png'));

  console.log('PNG Icons successfully created in public/icons');
}

generatePNGs().catch(console.error);
