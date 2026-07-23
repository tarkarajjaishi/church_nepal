import { NextRequest, NextResponse } from 'next/server'
import { API_ORIGIN } from '@/lib/apiBase'

async function proxyToBackend(request: NextRequest) {
  const body = await request.text()
  const url = new URL(request.url)
  const donationId = url.searchParams.get('donation_id')
  const receiptId = url.searchParams.get('receipt')

  let backendUrl: string
  let method: string
  if (receiptId) {
    backendUrl = `${API_ORIGIN}/api/donations/${encodeURIComponent(receiptId)}/receipt`
    method = 'GET'
  } else if (request.method === 'GET' && donationId) {
    backendUrl = `${API_ORIGIN}/api/donations/status?donation_id=${encodeURIComponent(donationId)}`
    method = 'GET'
  } else {
    backendUrl = `${API_ORIGIN}/api/donations/initiate`
    method = 'POST'
  }

  const res = await fetch(backendUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: method === 'GET' ? undefined : body,
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }
  return NextResponse.json(data)
}

export async function GET(request: NextRequest) {
  return proxyToBackend(request)
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request)
}
