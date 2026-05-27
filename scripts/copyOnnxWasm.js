// Copies onnxruntime-web WASM files to public/onnx/ for offline serving.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../node_modules/onnxruntime-web/dist')
const destDir = path.join(__dirname, '../public/onnx')

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.wasm'))
  files.forEach(f => {
    const dest = path.join(destDir, f)
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(srcDir, f), dest)
    }
  })
  if (files.length) console.log(`Copied ${files.length} ONNX WASM files to public/onnx/`)
} else {
  console.warn('onnxruntime-web not found, skipping WASM copy')
}
