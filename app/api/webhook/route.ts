import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/firebase-admin'
import { makeCall } from '@/lib/signalwire'
import { getIVRScript, buildDTMFString } from '@/lib/ivr-scripts'

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
  const speechResult = params.get('SpeechResult') // null if not present

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`

  console.log(`[webhook] action=${action} callStatus=${callStatus} speech=${JSON.stringify(speechResult)}`)

  const session = await getSession(sessionId)
  if (!session) return xml('<Hangup/>')

  // Stop if session is already terminal
  if (session.status === 'agent_found' || session.status === 'connected') {
    return new NextResponse('', { status: 200 })
  }
  if (session.status === 'failed' || session.status === 'cancelled') {
    return xml('<Hangup/>')
  }

  const terminalStatuses = ['completed', 'failed', 'busy', 'no-answer', 'canceled']
  if (callStatus && terminalStatuses.includes(callStatus)) {
    await updateSession(sessionId, { status: 'failed', errorMessage: `Call ended: ${callStatus}` })
    return xml('<Hangup/>')
  }

  const agentUrl = `${base}/api/webhook?sessionId=${sessionId}&amp;action=agent`
  const redirectUrl = `${base}/api/webhook?sessionId=${sessionId}&amp;action=agent`
  // Gather + Redirect: if Gather times out with no speech, Redirect re-enters agent loop
  const gatherXml = `<Gather input="speech" timeout="3600" speechTimeout="3" hints="hello,hi,how can I help you,my name is,good morning,good afternoon,this is,how may I assist" action="${agentUrl}" method="POST"></Gather><Redirect method="POST">${redirectUrl}</Redirect>`

  // Agent detection — only when Gather fires with actual speech
  if (action === 'agent') {
    const lower = (speechResult ?? '').toLowerCase().trim()

    if (!lower) {
      console.log('[agent] Empty/null speech — keep listening')
      return xml(gatherXml)
    }

    const wordCount = lower.split(/\s+/).length
    const isRecording = RECORDING_PHRASES.some(p => lower.includes(p)) || wordCount > 12

    console.log(`[agent] Speech: "${lower.substring(0, 100)}" | words: ${wordCount} | isRecording: ${isRecording}`)

    if (isRecording) {
      console.log('[agent] Announcement detected, ignoring')
      return xml(gatherXml)
    }

    console.log('[agent] Real agent detected! Bridging...')
    await updateSession(sessionId, { status: 'agent_found' })

    const callbackUrl = `${base}/api/callback?sessionId=${sessionId}`
    try {
      const userCallSid = await makeCall(session.userPhone, callbackUrl)
      await updateSession(sessionId, { agentCallSid: userCallSid })
      console.log('[agent] Callback call placed:', userCallSid)
    } catch (err) {
      console.error('[agent] Callback call failed:', err)
    }

    return xml(`<Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="false">${sessionId}</Conference></Dial>`)
  }

  // Initial call connected — navigate IVR then listen for agent
  const script = getIVRScript(session.company, session.issueType)
  if (!script) return xml('<Hangup/>')

  await updateSession(sessionId, { callSid: callSid ?? session.callSid, status: 'navigating' })
  const dtmf = buildDTMFString(script.steps)
  await updateSession(sessionId, { status: 'waiting' })

  return xml(`<Play digits="${dtmf}"/><Pause length="40"/>${gatherXml}`)
}
