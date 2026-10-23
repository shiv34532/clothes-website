// Render Root Directory Fallback / Bridge
// If Render Web Service has "Root Directory" set to "public", this entrypoint seamlessly bridges to the root server.js
const path = require('path');

try {
  process.chdir(path.join(__dirname, '..'));
} catch (e) {
  console.warn('[Render Bridge] Warning changing working directory:', e.message);
}

require('../server.js');
