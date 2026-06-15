import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@deepgram/sdk'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  const callSid = req.nextUrl.searchParams.get('callSid')
  const index = req.nextUrl.searchParams.get('index') ?? '0'
  if (!callSid) return NextResponse.json({ error: 'callSid required' }, { status: 400 })

  const doc = await adminDb.collection('mapper_transcripts').doc(`${callSid}_${index}`).get()
  if (!doc.exists) return NextResponse.json({ status: 'pending' })
  return NextResponse.json({ status: 'done', transcript: doc.data()?.transcript })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = new URLSearchParams(body)
  const index = req.nextUrl.searchParams.get('index') ?? '0'

  const callStatus = params.get('CallStatus')
  const callSid = params.get('CallSid')
  const recordingUrl = params.get('RecordingUrl')

  console.log('\n--- Webhook ---', 'status:', callStatus, '| recording:', !!recordingUrl, '| index:', index)

  const terminalStatuses = ['completed', 'failed', 'busy', 'no-answer', 'canceled']
  const isTerminal = callStatus ? terminalStatuses.includes(callStatus) : false

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'

  if (recordingUrl && callSid) {
    transcribeRecording(callSid, recordingUrl, parseInt(index))
    // Keep call alive so user can send DTMF for next level
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Pause length="300"/></Response>`, {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  if (!isTerminal) {
    const actionUrl = `${proto}://${host}/api/mapper/webhook?index=${index}`
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Record maxLength="60" playBeep="false" timeout="0" action="${actionUrl}" method="POST"/>
</Response>`
    return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } })
  }

  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  })
}

async function transcribeRecording(callSid: string, recordingUrl: string, index: number) {
  const docId = `${callSid}_${index}`
  try {
    const PROJECT_ID = process.env.SIGNALWIRE_PROJECT_ID!
    const API_TOKEN = process.env.SIGNALWIRE_API_TOKEN!
    const auth = Buffer.from(`${PROJECT_ID}:${API_TOKEN}`).toString('base64')

    let audioRes = await fetch(recordingUrl)
    if (audioRes.status === 403 || audioRes.status === 401)
      audioRes = await fetch(recordingUrl, { headers: { Authorization: `Basic ${auth}` } })
    if (audioRes.status === 403 || audioRes.status === 401)
      audioRes = await fetch(recordingUrl, { headers: { Authorization: `Bearer ${API_TOKEN}` } })
    if (!audioRes.ok) throw new Error(`Download failed: ${audioRes.status}`)

    const audioBuffer = await audioRes.arrayBuffer()
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      Buffer.from(audioBuffer),
      { model: 'nova-2', smart_format: true, punctuate: true, mimetype: 'audio/wav' }
    )
    if (error) throw error

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''
    await adminDb.collection('mapper_transcripts').doc(docId).set({ transcript, createdAt: Date.now() })
    console.log(`\n=== TRANSCRIPT [${index}] ===\n${transcript}\n========================\n`)
  } catch (err) {
    console.error('Transcription error:', err)
    await adminDb.collection('mapper_transcripts').doc(docId).set({
      transcript: 'Transcription failed: ' + String(err),
      createdAt: Date.now(),
    })
  }
}
