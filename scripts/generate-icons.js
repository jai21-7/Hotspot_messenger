// One-time script: creates PWA PNG icons (run: node scripts/generate-icons.js)
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.join(__dirname, "..", "public", "icons");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function makePng(size, maskable) {
  const pixels = Buffer.alloc(size * size * 4);
  const pad = maskable ? 0.08 : 0;
  const rOuter = size * (0.48 - pad);
  const rInner = size * (0.42 - pad);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - size / 2 + 0.5;
      const dy = y - size / 2 + 0.5;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= rOuter) {
        pixels[i] = 13;
        pixels[i + 1] = 148;
        pixels[i + 2] = 136;
        pixels[i + 3] = 255;
        if (d > rInner) {
          pixels[i] = 15;
          pixels[i + 1] = 118;
          pixels[i + 2] = 110;
        }
      } else {
        pixels[i + 3] = 0;
      }
    }
  }

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    pixels.copy(raw, row + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

fs.writeFileSync(path.join(OUT_DIR, "icon-192.png"), makePng(192, false));
fs.writeFileSync(path.join(OUT_DIR, "icon-512.png"), makePng(512, false));
fs.writeFileSync(path.join(OUT_DIR, "icon-maskable.png"), makePng(512, true));
console.log("Icons written to public/icons/");
