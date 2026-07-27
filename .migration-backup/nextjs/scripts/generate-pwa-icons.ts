import fs from 'fs'
import path from 'path'
import { deflateSync } from 'zlib'

function crc32(buf: Buffer): number {
  let crc = -1
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return crc ^ -1
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crcData = Buffer.concat([typeBuf, data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(crcData) >>> 0, 0)
  return Buffer.concat([length, typeBuf, data, crcBuf])
}

function createPng(size: number, draw: (x: number, y: number) => [number, number, number, number]): Buffer {
  const pixels: Buffer[] = []
  for (let y = 0; y < size; y++) {
    const scanline = Buffer.alloc(1 + size * 4)
    scanline[0] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y)
      scanline[1 + x * 4] = r
      scanline[2 + x * 4] = g
      scanline[3 + x * 4] = b
      scanline[4 + x * 4] = a
    }
    pixels.push(scanline)
  }
  const rawData = Buffer.concat(pixels)
  const compressed = deflateSync(rawData)

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function drawCrossIcon(size: number): Buffer {
  const blue = [0x0b, 0x3c, 0x5d, 255]
  const white = [0xff, 0xff, 0xff, 255]
  const transparent = [0, 0, 0, 0]

  return createPng(size, (x, y) => {
    const cx = size / 2
    const cy = size / 2
    const armW = size * 0.22
    const armLen = size * 0.4

    const inVertical = Math.abs(x - cx) < armW / 2 && Math.abs(y - cy) < armLen
    const inHorizontal = Math.abs(y - cy) < armW / 2 && Math.abs(x - cx) < armLen

    if (inVertical || inHorizontal) {
      return white
    }

    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const radius = size * 0.46

    if (dist < radius) {
      return blue
    }
    if (dist < radius + 2) {
      const edge = (dist - radius) / 2
      return [
        Math.round(blue[0] * (1 - edge) + transparent[0] * edge),
        Math.round(blue[1] * (1 - edge) + transparent[1] * edge),
        Math.round(blue[2] * (1 - edge) + transparent[2] * edge),
        Math.round(255 * (1 - edge) + transparent[3] * edge),
      ]
    }
    return transparent
  })
}

const publicDir = path.join(process.cwd(), 'public')
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), drawCrossIcon(192))
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), drawCrossIcon(512))
console.log('Generated icon-192.png and icon-512.png')
