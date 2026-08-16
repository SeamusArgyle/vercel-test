const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const ZIP_URL = 'https://filebin.net/bcm-meeting-20260816-seamus/BCM_Website_MAIN_CURRENT.zip';

async function main() {
  const response = await fetch(ZIP_URL);
  if (!response.ok) throw new Error(`Failed to download BCM site archive: ${response.status} ${response.statusText}`);

  const zipBytes = Buffer.from(await response.arrayBuffer());
  const zipPath = '/tmp/bcm-site.zip';
  const unpackDir = '/tmp/bcm-site-unpack';
  const distDir = path.join(process.cwd(), 'dist');

  fs.writeFileSync(zipPath, zipBytes);
  fs.rmSync(unpackDir, { recursive: true, force: true });
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(unpackDir, { recursive: true });
  fs.mkdirSync(distDir, { recursive: true });

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(unpackDir, true);

  let sourceDir = path.join(unpackDir, 'BCM_Website_MAIN_CURRENT');
  if (!fs.existsSync(sourceDir)) {
    const entries = fs.readdirSync(unpackDir, { withFileTypes: true });
    const onlyDir = entries.filter(e => e.isDirectory());
    sourceDir = onlyDir.length === 1 ? path.join(unpackDir, onlyDir[0].name) : unpackDir;
  }

  if (!fs.existsSync(path.join(sourceDir, 'index.html'))) {
    throw new Error('BCM site archive did not contain index.html at the expected root.');
  }

  fs.cpSync(sourceDir, distDir, { recursive: true });
  console.log('BCM meeting site reconstructed successfully.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
