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

  const body = await req.text()
  const params = new URLSearchParams(body)
  const callStatus = params.get('CallStatus')

  console.log(`[callback] sessionId=${sessionId?.slice(0, 8)} callStatus=${callStatus}`)

  // Status callbacks (initiated, ringing, completed) — not the actual answer event
  if (callStatus && callStatus !== 'in-progress') {
    return new NextResponse('', { status: 200 })
  }

  const session = await getSession(sessionId)
  if (!session) return xml('<Hangup/>')

  console.log('[callback] User answered — joining conference')
  await updateSession(sessionId, { status: 'connected' })

  return xml(
    `<Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="true">${sessionId}</Conference></Dial>`
  )
}
