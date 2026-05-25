// Script para generar los iconos PWA de Madraza
// Uso: node generate-icons.mjs
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let Resvg;
try {
  ({ Resvg } = await import('@resvg/resvg-js'));
} catch {
  console.log('Instalando @resvg/resvg-js...');
  execSync('pnpm add @resvg/resvg-js --save-dev', { stdio: 'inherit', cwd: __dirname });
  ({ Resvg } = await import('@resvg/resvg-js'));
}

const svgPath = join(__dirname, 'public/assets/madraza-vector.svg');
const iconsDir = join(__dirname, 'public/icons');

const svgRaw = readFileSync(svgPath, 'utf8');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

for (const size of sizes) {
  const resvg = new Resvg(svgRaw, {
    background: '#1e1839',
    fitTo: { mode: 'width', value: size },
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  const dest = join(iconsDir, `icon-${size}x${size}.png`);
  writeFileSync(dest, png);
  console.log(`✓ icon-${size}x${size}.png`);
}

console.log('\nIconos generados en public/icons/');
