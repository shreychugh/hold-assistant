import { NextResponse } from 'next/server'
import { getAllSessions, updateSession } from '@/lib/firebase-admin'

const ACTIVE_STATUSES = ['initiated', 'calling', 'navigating', 'waiting', 'agent_found']
const MAX_SESSION_MS = 90 * 60 * 1000

export async function GET() {
  const sessions = await getAllSessions(50)

  // Auto-expire any active sessions older than 90 minutes
  await Promise.all(
    sessions
      .filter(s => ACTIVE_STATUSES.includes(s.status) && Date.now() - s.createdAt > MAX_SESSION_MS)
      .map(s => updateSession(s.sessionId, { status: 'failed', errorMessage: 'Session timed out after 90 minutes' }))
  )

  return NextResponse.json({ sessions: await getAllSessions(50) }, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
