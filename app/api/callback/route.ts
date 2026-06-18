import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/firebase-admin'
import { hangupCall } from '@/lib/signalwire'

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

  const session = await getSession(sessionId)
  if (!session) return xml('<Hangup/>')

  // Status callbacks for non-answer events
  if (callStatus && callStatus !== 'in-progress') {
    if (session.status === 'agent_found') {
      // User never answered — fail the session and release the company agent
      const reason =
        callStatus === 'no-answer' ? 'Callback not answered' :
        callStatus === 'busy'      ? 'Your line was busy when we called back' :
                                     `Callback ended before connecting (${callStatus})`
      console.log(`[callback] User did not answer (${callStatus}) — failing session`)
      if (session.callSid) {
        try { await hangupCall(session.callSid) } catch {}
      }
      await updateSession(sessionId, { status: 'failed', errorMessage: reason })
    } else if (callStatus === 'completed' && session.status === 'connected') {
      // Call ended normally after user was connected
      console.log('[callback] Call completed normally')
      await updateSession(sessionId, { status: 'completed' })
    }
    return new NextResponse('', { status: 200 })
  }

  console.log('[callback] User answered — joining conference')
  await updateSession(sessionId, { status: 'connected' })

  return xml(
    `<Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="true">${sessionId}</Conference></Dial>`
  )
}
