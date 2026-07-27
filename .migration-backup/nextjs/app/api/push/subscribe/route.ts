import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'push_subscriptions.json')

export async function POST(req: Request) {
  try {
    const subscription = await req.json()

    let subscriptions: any[] = []
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      try {
        subscriptions = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8'))
      } catch {
        subscriptions = []
      }
    }

    const index = subscriptions.findIndex((s: any) => s.endpoint === subscription.endpoint)
    if (index >= 0) {
      subscriptions[index] = { ...subscriptions[index], ...subscription, createdAt: subscriptions[index].createdAt || new Date().toISOString() }
    } else {
      subscriptions.push({ ...subscription, createdAt: new Date().toISOString() })
    }

    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2))
    return NextResponse.json({ ok: true, count: subscriptions.length })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET() {
  try {
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) return NextResponse.json({ subscriptions: [] })
    const data = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8'))
    return NextResponse.json({ subscriptions: data })
  } catch {
    return NextResponse.json({ subscriptions: [] })
  }
}
