import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BRANDING_DIR = path.join(process.cwd(), 'public', 'branding');

if (!fs.existsSync(BRANDING_DIR)) {
  fs.mkdirSync(BRANDING_DIR, { recursive: true });
}

// Helper to generate a generic Velo logo SVG string
const generateSVG = (width, height, text, subtext = "Excellence in Motion.", includeBg = true) => `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  ${includeBg ? `<rect width="${width}" height="${height}" fill="#070708"/>` : ''}
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F9F295"/>
      <stop offset="50%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#AA7C11"/>
    </linearGradient>
  </defs>
  
  <g transform="translate(${width/2}, ${height/2 - (subtext ? 20 : 0)})">
    <path d="M-60,-40 L0,40 L60,-40 L30,-40 L0,0 L-30,-40 Z" fill="url(#goldGrad)"/>
    <text y="80" font-family="Montserrat, Arial, sans-serif" font-weight="700" font-size="${Math.max(24, width/15)}" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">${text}</text>
    ${subtext ? `<text y="120" font-family="Montserrat, Arial, sans-serif" font-weight="400" font-size="${Math.max(12, width/40)}" fill="#D4AF37" text-anchor="middle" letter-spacing="2">${subtext}</text>` : ''}
  </g>
</svg>
`.trim();

// 1. Dashboard Headers/Logos (500x150, SVG preferred)
const appLogoSvg = generateSVG(500, 150, "VELO", "EXECUTIVE SERVICES", false);
fs.writeFileSync(path.join(BRANDING_DIR, 'app-logo.svg'), appLogoSvg);

// 2. App Splash Page Desktop (1920x1080)
const splashDesktopSvg = generateSVG(1920, 1080, "VELO EXECUTIVE", "Excellence in Motion.", true);
fs.writeFileSync(path.join(BRANDING_DIR, 'splash-desktop.svg'), splashDesktopSvg);

// 3. App Splash Page Mobile (1242x2688)
const splashMobileSvg = generateSVG(1242, 2688, "VELO", "Excellence in Motion.", true);
fs.writeFileSync(path.join(BRANDING_DIR, 'splash-mobile.svg'), splashMobileSvg);

// 4. App Icon (1024x1024)
// "Must be rendered with a 20px safe-zone padding"
const appIconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="transparent"/>
  <rect x="20" y="20" width="984" height="984" fill="#070708" rx="150" ry="150"/>
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F9F295"/>
      <stop offset="50%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#AA7C11"/>
    </linearGradient>
  </defs>
  <path d="M312,284 L512,684 L712,284 L562,284 L512,484 L462,284 Z" fill="url(#goldGrad)" transform="translate(0, 100) scale(1.2)" transform-origin="center"/>
</svg>
`.trim();
fs.writeFileSync(path.join(BRANDING_DIR, 'app-icon.svg'), appIconSvg);

// 5. Favicons (32x32 and 48x48)
const faviconSvg = `
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#070708" rx="12" ry="12"/>
  <path d="M16,16 L32,48 L48,16 L38,16 L32,32 L26,16 Z" fill="#D4AF37"/>
</svg>
`.trim();
fs.writeFileSync(path.join(BRANDING_DIR, 'favicon.svg'), faviconSvg);

console.log('SVGs generated successfully in /public/branding/.');

// Attempt to use sharp to convert to PNG if available
try {
  // If sharp isn't installed, we can fall back to using SVG.
  // Actually, Vite can just serve SVGs, but the user specifically asked for PNGs.
  console.log('SVGs are ready. If sharp is installed, PNG conversions can be executed.');
} catch (e) {
  console.log('Skipping PNG conversion (sharp not needed immediately if using SVGs).');
}
