import { NextRequest, NextResponse } from 'next/server'

const PROJECT_ID = process.env.SIGNALWIRE_PROJECT_ID!
const API_TOKEN = process.env.SIGNALWIRE_API_TOKEN!
const SPACE_URL = process.env.SIGNALWIRE_SPACE_URL!
const AUTH = Buffer.from(`${PROJECT_ID}:${API_TOKEN}`).toString('base64')

export async function POST(req: NextRequest) {
  const { callSid, digit, nextIndex, baseUrl } = await req.json()

  if (!callSid || !digit || nextIndex === undefined || !baseUrl) {
    return NextResponse.json({ error: 'callSid, digit, nextIndex, baseUrl required' }, { status: 400 })
  }

  const actionUrl = `${baseUrl}/api/mapper/webhook?index=${nextIndex}`
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play digits="${digit}"/>
  <Record maxLength="60" playBeep="false" timeout="0" action="${actionUrl}" method="POST"/>
</Response>`

  const res = await fetch(
    `https://${SPACE_URL}/api/laml/2010-04-01/Accounts/${PROJECT_ID}/Calls/${callSid}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${AUTH}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ Twiml: twiml }).toString(),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `SignalWire error: ${res.status} ${text}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
