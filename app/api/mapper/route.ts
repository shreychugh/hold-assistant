import { NextRequest, NextResponse } from 'next/server'
import { makeCall } from '@/lib/signalwire'

export async function POST(req: NextRequest) {
  const { phoneNumber } = await req.json()

  if (!phoneNumber) {
    return NextResponse.json({ error: 'phoneNumber required' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:3000`

  const webhookUrl = `${baseUrl}/api/mapper/webhook`

  try {
    const callSid = await makeCall(phoneNumber, webhookUrl)
    return NextResponse.json({
      message: 'Call started. Check back in 2 minutes for transcript.',
      callSid,
      transcriptUrl: `${baseUrl}/api/mapper/webhook?callSid=${callSid}`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
