import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/firebase-admin'
import { hangupCall } from '@/lib/signalwire'

export async function POST(req: NextRequest) {
  const { sessionId, cancelledBy = 'admin' } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const session = await getSession(sessionId)
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Hang up company call
  if (session.callSid) {
    try { await hangupCall(session.callSid) } catch {}
  }
  // Hang up user callback call if exists
  if (session.agentCallSid) {
    try { await hangupCall(session.agentCallSid) } catch {}
  }

  await updateSession(sessionId, { status: 'cancelled', errorMessage: `Cancelled by ${cancelledBy}` })
  return NextResponse.json({ ok: true })
}
