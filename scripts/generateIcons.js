// Generates minimal valid PNG icons for the PWA manifest.
// Uses only Node.js built-ins (no canvas / sharp needed).
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const deflate = promisify(zlib.deflate)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

async function makePng(size) {
  // Deep green fill with a simple bus-like white shape
  const bg = [0x16, 0x61, 0x3a]   // #16613a
  const fg = [0xff, 0xff, 0xff]   // white

  const rows = []
  for (let y = 0; y < size; y++) {
    const row = [0] // PNG filter byte: None
    for (let x = 0; x < size; x++) {
      // Simple bus silhouette centered in icon
      const cx = size / 2, cy = size / 2
      const bw = size * 0.55, bh = size * 0.32
      const rx = Math.abs(x - cx) / (bw / 2)
      const ry = Math.abs(y - cy) / (bh / 2)
      // Bus body rectangle
      const inBody = rx < 1 && ry < 1
      // Wheels
      const wheelR = size * 0.1
      const w1x = cx - bw * 0.28, w1y = cy + bh * 0.55
      const w2x = cx + bw * 0.28, w2y = cy + bh * 0.55
      const inWheel1 = Math.hypot(x - w1x, y - w1y) < wheelR
      const inWheel2 = Math.hypot(x - w2x, y - w2y) < wheelR
      // Windows (two rectangles on bus body)
      const wh = bh * 0.35, ww = bw * 0.22
      const wy = cy - bh * 0.05
      const w3x = cx - bw * 0.22, w4x = cx + bw * 0.05
      const inWin1 = Math.abs(x - w3x) < ww / 2 && Math.abs(y - wy) < wh / 2
      const inWin2 = Math.abs(x - w4x) < ww / 2 && Math.abs(y - wy) < wh / 2
      const isWhite = (inBody && !inWin1 && !inWin2) || inWheel1 || inWheel2
      row.push(...(isWhite ? fg : bg))
    }
    rows.push(Buffer.from(row))
  }

  const raw = Buffer.concat(rows)
  const compressed = await deflate(raw)

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8   // bit depth
  ihdrData[9] = 2   // color type: RGB
  return Buffer.concat([sig, chunk('IHDR', ihdrData), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

const iconDir = path.join(__dirname, '../public/icons')
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true })

async function run() {
  for (const size of [192, 512]) {
    const outPath = path.join(iconDir, `icon-${size}.png`)
    if (!fs.existsSync(outPath)) {
      const png = await makePng(size)
      fs.writeFileSync(outPath, png)
      console.log(`Generated ${outPath}`)
    }
  }
  // Write SVG icon too
  const svgPath = path.join(iconDir, 'icon.svg')
  if (!fs.existsSync(svgPath)) {
    fs.writeFileSync(svgPath, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#16613a" rx="20"/>
  <rect x="20" y="35" width="60" height="30" rx="5" fill="white"/>
  <rect x="25" y="40" width="20" height="12" rx="2" fill="#16613a"/>
  <rect x="55" y="40" width="20" height="12" rx="2" fill="#16613a"/>
  <circle cx="32" cy="68" r="7" fill="white"/>
  <circle cx="68" cy="68" r="7" fill="white"/>
</svg>`)
    console.log(`Generated ${svgPath}`)
  }
}

run().catch(console.error)
