const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const version = process.env.BUILD_VERSION || pkg.version || '0.0.0';
const commit = process.env.GIT_COMMIT || process.env.VCS_REF || '';
const buildTime = new Date().toISOString();

const payload = {
  version,
  commit,
  buildTime,
};

const targets = [
  path.join(rootDir, 'public', 'version.json'),
  path.join(rootDir, 'src', 'version.json'),
];

for (const target of targets) {
  const dir = path.dirname(target);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(target, JSON.stringify(payload, null, 2));
}

console.log(`[version] Generated build metadata: ${JSON.stringify(payload)}`);
