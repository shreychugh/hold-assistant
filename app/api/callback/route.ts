import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/firebase-admin'

function xml(content: string) {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  })
}

export async function POST(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) return xml('<Hangup/>')

  const session = await getSession(sessionId)
  if (!session) return xml('<Hangup/>')

  // Already connected — ignore duplicate status callbacks
  if (session.status === 'connected') {
    return new NextResponse('', { status: 200 })
  }

  await updateSession(sessionId, { status: 'connected' })

  return xml(
    `<Say voice="alice">An agent is on the line. Connecting you now.</Say><Dial><Conference waitUrl="" startConferenceOnEnter="true" endConferenceOnExit="true">${sessionId}</Conference></Dial>`
  )
}
