export async function transcribeRecording(recordingUrl: string): Promise<string> {
  const swAuth = Buffer.from(
    `${process.env.SIGNALWIRE_PROJECT_ID}:${process.env.SIGNALWIRE_API_TOKEN}`
  ).toString('base64')

  // Fetch recording from SignalWire with Basic auth
  const audioRes = await fetch(recordingUrl, {
    headers: { Authorization: `Basic ${swAuth}` },
  })
  if (!audioRes.ok) {
    throw new Error(`Failed to fetch recording: ${audioRes.status} ${await audioRes.text()}`)
  }
  const audioBuffer = await audioRes.arrayBuffer()
  const contentType = audioRes.headers.get('content-type') ?? 'audio/wav'

const dgRes = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=false&language=en',
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': contentType,
      },
      body: audioBuffer,
    }
  )
  if (!dgRes.ok) {
    throw new Error(`Deepgram error: ${dgRes.status} ${await dgRes.text()}`)
  }

  const data = await dgRes.json() as {
    results?: { channels?: [{ alternatives?: [{ transcript?: string }] }] }
  }
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''
}
