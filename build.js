const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CHUNKS = [
  'https://bcm-sabd-partnership.vercel.app/data/0.txt',
  'https://bcm-sabd-partnership.vercel.app/data/1.txt'
];

async function main() {
  const parts = [];
  for (const url of CHUNKS) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to fetch presentation chunk: ${response.status} ${url}`);
    parts.push((await response.text()).trim());
  }

  const compressed = Buffer.from(parts.join(''), 'base64');
  let html = zlib.gunzipSync(compressed).toString('utf8');

  if (!/name=["']robots["']/i.test(html)) {
    html = html.replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow,noarchive">');
  }

  const distDir = path.join(process.cwd(), 'dist');
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
  fs.writeFileSync(path.join(distDir, 'health.txt'), 'BCM + SABD presentation ready\n', 'utf8');
  console.log(`Presentation rebuilt successfully (${Buffer.byteLength(html)} bytes).`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
