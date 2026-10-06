const fs = require('fs');
const path = require('path');

const root = __dirname;
const target = path.join(root, 'www');
const files = ['index.html', 'app.js', 'styles.css', 'manifest.webmanifest', 'sw.js'];

fs.mkdirSync(target, { recursive: true });
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(target, file));
console.log(`Copied ${files.length} admin app web assets to www/`);
