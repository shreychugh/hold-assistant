import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/firebase-admin'
import { makeCall } from '@/lib/signalwire'
import { getIVRScript, buildDTMFString } from '@/lib/ivr-scripts'
import { transcribeRecording } from '@/lib/deepgram'

function xml(content: string) {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  })
}

const RECORDING_PHRASES = [
  'for holding', 'for your patience', 'for continuing to hold',
  'your call is important', 'next available', 'remain on the line',
  'you can also manage', 'we apologize', 'calls are answered',
  'cibc.com', 'mobile app', 'banking through', 'privacy policy',
  'voice verification', 'voice for id', 'answered by the next',
  'respectful', 'disrespectful', 'behavior will not be tolerated',
  'our employees', 'caring environment',
]

export async function POST(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  const action = req.nextUrl.searchParams.get('action')
  if (!sessionId) return xml('<Hangup/>')

  const body = await req.text()
  const params = new URLSearchParams(body)
  const callSid = params.get('CallSid')
  const callStatus = params.get('CallStatus')

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`

  console.log(`[webhook] action=${action} callStatus=${callStatus} sessionId=${sessionId?.slice(0, 8)}`)

  const session = await getSession(sessionId)
  if (!session) return xml('<Hangup/>')

  // Stop if session is already terminal
  if (session.status === 'agent_found' || session.status === 'connected') {
    return new NextResponse('', { status: 200 })
  }
  if (session.status === 'failed' || session.status === 'cancelled') {
    return xml('<Hangup/>')
  }

  // Auto-expire sessions older than 90 minutes
  if (Date.now() - session.createdAt > 90 * 60 * 1000) {
    await updateSession(sessionId, { status: 'failed', errorMessage: 'Session timed out after 90 minutes' })
    return xml('<Hangup/>')
  }

  const terminalStatuses = ['completed', 'failed', 'busy', 'no-answer', 'canceled']
  if (callStatus && terminalStatuses.includes(callStatus)) {
    await updateSession(sessionId, { status: 'failed', errorMessage: `Call ended: ${callStatus}` })
    return xml('<Hangup/>')
  }

  const transcribeUrl = `${base}/api/webhook?sessionId=${sessionId}&amp;action=transcribe`
  const recordXml = `<Record maxLength="3" action="${transcribeUrl}" method="POST" playBeep="false"/>`

  // Agent detection via Deepgram — fires after each 3-second recording clip
  if (action === 'transcribe') {
    const recordingUrl = params.get('RecordingUrl')

    if (!recordingUrl) {
      console.log('[transcribe] No RecordingUrl — keep recording')
      return xml(recordXml)
    }

    let transcript = ''
    try {
      transcript = await transcribeRecording(recordingUrl)
    } catch (err) {
      console.error('[transcribe] Deepgram error:', err)
      return xml(recordXml)
    }

    const lower = transcript.toLowerCase().trim()
    console.log(`[transcribe] "${lower.substring(0, 120)}"`)

    if (!lower) return xml(recordXml)

    const wordCount = lower.split(/\s+/).length
    const isRecording = RECORDING_PHRASES.some(p => lower.includes(p)) || wordCount > 12

    if (isRecording) {
      console.log('[transcribe] Hold music — keep recording')
      return xml(recordXml)
    }

    console.log('[transcribe] Agent detected — bridging')
    await updateSession(sessionId, { status: 'agent_found' })

    const callbackUrl = `${base}/api/callback?sessionId=${sessionId}`
    try {
      const userCallSid = await makeCall(session.userPhone, callbackUrl)
      await updateSession(sessionId, { agentCallSid: userCallSid })
      console.log('[transcribe] Callback placed:', userCallSid)
    } catch (err) {
      console.error('[transcribe] makeCall failed:', err)
    }

    return xml(`<Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="false">${sessionId}</Conference></Dial>`)
  }

  // Initial call connected — navigate IVR then listen for agent
  const script = getIVRScript(session.company, session.issueType)
  if (!script) return xml('<Hangup/>')

  await updateSession(sessionId, { callSid: callSid ?? session.callSid, status: 'navigating' })
  const dtmf = buildDTMFString(script.steps)
  await updateSession(sessionId, { status: 'waiting' })

  return xml(`<Play digits="${dtmf}"/><Pause length="40"/>${recordXml}`)
}
