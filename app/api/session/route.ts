import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createSession, hasActiveSession, updateSession } from '@/lib/firebase-admin'
import { makeCall } from '@/lib/signalwire'
import { getIVRScript } from '@/lib/ivr-scripts'

export async function POST(req: NextRequest) {
  const { company, issueType, userPhone } = await req.json()

  if (!company || !issueType || !userPhone) {
    return NextResponse.json({ error: 'company, issueType, userPhone required' }, { status: 400 })
  }

  const script = getIVRScript(company, issueType)
  if (!script) {
    return NextResponse.json({ error: `No IVR script for ${company}:${issueType}` }, { status: 400 })
  }

  if (await hasActiveSession(userPhone)) {
    return NextResponse.json({ error: 'You already have an active session' }, { status: 409 })
  }

  const sessionId = randomUUID()
  await createSession({ sessionId, company, issueType, userPhone, status: 'initiated' })

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim()
  const webhookUrl = `${baseUrl}/api/webhook?sessionId=${sessionId}`
  console.log('Webhook URL sent to SignalWire:', webhookUrl)

  try {
    const callSid = await makeCall(script.phoneNumber, webhookUrl)
    await updateSession(sessionId, { callSid, status: 'calling' })
    return NextResponse.json({ sessionId })
  } catch (err) {
    await updateSession(sessionId, { status: 'failed', errorMessage: String(err) })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
