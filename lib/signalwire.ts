const PROJECT_ID = process.env.SIGNALWIRE_PROJECT_ID!
const API_TOKEN = process.env.SIGNALWIRE_API_TOKEN!
const SPACE_URL = process.env.SIGNALWIRE_SPACE_URL!
const FROM_NUMBER = process.env.SIGNALWIRE_PHONE_NUMBER!

const SW_BASE = `https://${SPACE_URL}/api/laml/2010-04-01/Accounts/${PROJECT_ID}`
const AUTH = Buffer.from(`${PROJECT_ID}:${API_TOKEN}`).toString('base64')

// ── REST helpers ──────────────────────────────────────────────────────────────

export async function makeCall(to: string, webhookUrl: string): Promise<string> {
  const res = await fetch(`${SW_BASE}/Calls`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${AUTH}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: FROM_NUMBER,
      Url: webhookUrl,
      StatusCallback: webhookUrl,
      StatusCallbackMethod: 'POST',
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`SignalWire makeCall failed: ${res.status} ${text}`)
  }

  const data = await res.json() as { sid: string }
  return data.sid
}

export async function bridgeCalls(callSid: string, userPhone: string, webhookUrl: string): Promise<string> {
  // Call the user back
  const res = await fetch(`${SW_BASE}/Calls`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${AUTH}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: userPhone,
      From: FROM_NUMBER,
      Url: `${webhookUrl}?action=bridge&companySid=${callSid}`,
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`SignalWire bridgeCalls failed: ${res.status} ${text}`)
  }

  const data = await res.json() as { sid: string }
  return data.sid
}

// ── LaML (XML) builders ───────────────────────────────────────────────────────

export function lamlNavigate(dtmfSequence: string, gatherUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play digits="${dtmfSequence}"/>
  <Gather input="speech" timeout="300" action="${gatherUrl}" method="POST">
  </Gather>
</Response>`
}

export function lamlWaitForAgent(gatherUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="300" action="${gatherUrl}" method="POST">
  </Gather>
</Response>`
}

export function lamlBridgeToAgent(companySid: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference>${companySid}</Conference>
  </Dial>
</Response>`
}

export function lamlHoldCompanyCall(conferenceName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference waitUrl="" startConferenceOnEnter="false">${conferenceName}</Conference>
  </Dial>
</Response>`
}

export function lamlHangup(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`
}
