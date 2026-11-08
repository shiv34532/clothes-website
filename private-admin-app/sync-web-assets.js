const fs = require('fs');
const path = require('path');

const root = __dirname;
const target = path.join(root, 'www');
const files = [
  'index.html',
  'app.js',
  'real-seed-data.js',
  'styles.css',
  'manifest.webmanifest',
  'sw.js',
  'icon-192.png',
  'icon-512.png'
];

fs.mkdirSync(target, { recursive: true });
for (const file of files) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(target, file));
  }
}
console.log(`Copied ${files.length} admin app web assets to www/`);
