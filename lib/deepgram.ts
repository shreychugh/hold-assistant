const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY!
const SW_AUTH = Buffer.from(
  `${process.env.SIGNALWIRE_PROJECT_ID}:${process.env.SIGNALWIRE_API_TOKEN}`
).toString('base64')

export async function transcribeRecording(recordingUrl: string): Promise<string> {
  // SignalWire recordings require Basic auth; request mp3 explicitly
  const audioRes = await fetch(recordingUrl + '.mp3', {
    headers: { Authorization: `Basic ${SW_AUTH}` },
  })
  if (!audioRes.ok) throw new Error(`Failed to fetch recording: ${audioRes.status}`)
  const audioBuffer = await audioRes.arrayBuffer()

  const dgRes = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=false&language=en',
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/mpeg',
      },
      body: audioBuffer,
    }
  )
  if (!dgRes.ok) throw new Error(`Deepgram error: ${dgRes.status}`)

  const data = await dgRes.json() as {
    results?: { channels?: [{ alternatives?: [{ transcript?: string }] }] }
  }
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''
}
