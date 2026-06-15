import { NextRequest, NextResponse } from 'next/server'

const PROJECT_ID = process.env.SIGNALWIRE_PROJECT_ID!
const API_TOKEN = process.env.SIGNALWIRE_API_TOKEN!
const SPACE_URL = process.env.SIGNALWIRE_SPACE_URL!
const AUTH = Buffer.from(`${PROJECT_ID}:${API_TOKEN}`).toString('base64')

export async function POST(req: NextRequest) {
  const { callSid } = await req.json()
  if (!callSid) return NextResponse.json({ error: 'callSid required' }, { status: 400 })

  const res = await fetch(
    `https://${SPACE_URL}/api/laml/2010-04-01/Accounts/${PROJECT_ID}/Calls/${callSid}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${AUTH}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ Status: 'completed' }).toString(),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `SignalWire error: ${res.status} ${text}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
