const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'wzknhexk',
  api_key: '775349879285534',
  api_secret: 'UioxSzxXyfcVORlZRZy_36JOS68'
});

async function test() {
  try {
    console.log("Testing Cloudinary Ping / Upload...");
    const sampleUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const res = await cloudinary.uploader.upload(sampleUri, { folder: 'little_to_large/test' });
    console.log("SUCCESS! Cloudinary URL:", res.secure_url);
  } catch (err) {
    console.error("CLOUDINARY TEST FAILED:", err);
  }
}

test();
