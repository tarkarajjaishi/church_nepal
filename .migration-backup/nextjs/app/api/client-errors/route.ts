import { NextRequest } from 'next/server'
import { appendFile, mkdir } from 'fs/promises'
import path from 'path'

// Use a path relative to the project root so this works on any OS / Docker
const LOG_FILE = path.resolve(process.cwd(), '.bridge', 'client-errors.log')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const entry = JSON.stringify({
      message: body.message || '',
      stack: body.stack || '',
      url: body.url || '',
      source: body.source || '',
      ts: body.ts || new Date().toISOString(),
    })
    await mkdir(path.dirname(LOG_FILE), { recursive: true })
    await appendFile(LOG_FILE, entry + '\n')
  } catch {
    // silently ignore write failures
  }
  return new Response(null, { status: 204 })
}
