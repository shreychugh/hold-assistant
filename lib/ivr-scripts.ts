export interface IVRStep {
  pauseBeforeMs: number  // wait this long before sending digits
  digits: string         // DTMF digits to send ('0'-'9', '*', '#')
}

export interface IVRScript {
  companyName: string
  issueLabel: string
  phoneNumber: string
  steps: IVRStep[]
  maxWaitMs: number      // give up after this long in hold queue
  notes: string          // human-readable notes about this sequence
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW TO MAP AN IVR SEQUENCE
// 1. Call the number below
// 2. Listen to each prompt and note what number to press
// 3. Fill in steps: pauseBeforeMs is how long the prompt takes to finish
//    before you'd naturally press the button (usually 3000–5000ms)
// 4. Test by calling again and timing your button presses
// ─────────────────────────────────────────────────────────────────────────────

export const IVR_SCRIPTS: Record<string, IVRScript> = {

  // ── CIBC ────────────────────────────────────────────────────────────────────
  // Direct lost/stolen line — tends to reach agent faster than main line
  // Call 1-800-663-4575 and map what you hear
  'cibc:lost_stolen_card': {
    companyName: 'CIBC',
    issueLabel: 'Lost or Stolen Credit Card',
    phoneNumber: '+18006634575',
    steps: [
      { pauseBeforeMs: 5000, digits: '1' },  // "Welcome to CRDC" → press 1 for lost/stolen
      { pauseBeforeMs: 6000, digits: '3' },  // Card type menu → press 3 for other credit card
    ],
    maxWaitMs: 45 * 60 * 1000,
    notes: 'CRDC line. 1=lost/stolen, then 3=other credit card. Hold music follows.',
  },

  // ── TD BANK ─────────────────────────────────────────────────────────────────
  // TD has a dedicated lost/stolen Visa line
  // Call 1-800-983-8472 and map what you hear
  'td:lost_stolen_card': {
    companyName: 'TD Bank',
    issueLabel: 'Lost or Stolen Credit Card',
    phoneNumber: '+18009838472',
    steps: [
      // TODO: Call 1-800-983-8472 and fill these in
    ],
    maxWaitMs: 45 * 60 * 1000,
    notes: 'Dedicated TD Visa lost/stolen line.',
  },

  // ── RBC ─────────────────────────────────────────────────────────────────────
  // RBC dedicated lost/stolen Visa line
  // Call 1-800-769-2512 and map what you hear
  'rbc:lost_stolen_card': {
    companyName: 'RBC',
    issueLabel: 'Lost or Stolen Credit Card',
    phoneNumber: '+18007692512',
    steps: [
      // TODO: Call 1-800-769-2512 and fill these in
    ],
    maxWaitMs: 45 * 60 * 1000,
    notes: 'RBC 24/7 lost/stolen line.',
  },

  // ── ROGERS ──────────────────────────────────────────────────────────────────
  // Rogers billing support
  // Call 1-888-764-3771 and map what you hear
  'rogers:billing': {
    companyName: 'Rogers',
    issueLabel: 'Billing Issue',
    phoneNumber: '+18887643771',
    steps: [
      // TODO: Call 1-888-764-3771 and fill these in
      // Typical Rogers flow: 1=English, then billing option
    ],
    maxWaitMs: 60 * 60 * 1000,
    notes: 'Rogers general support. Navigate to billing department.',
  },

  // ── BELL ────────────────────────────────────────────────────────────────────
  // Bell billing support
  // Call 1-866-310-2355 and map what you hear
  'bell:billing': {
    companyName: 'Bell',
    issueLabel: 'Billing Issue',
    phoneNumber: '+18663102355',
    steps: [
      // TODO: Call 1-866-310-2355 and fill these in
    ],
    maxWaitMs: 60 * 60 * 1000,
    notes: 'Bell home services billing line.',
  },
}

export function getIVRScript(company: string, issueType: string): IVRScript | null {
  return IVR_SCRIPTS[`${company}:${issueType}`] ?? null
}

// Converts steps array into a single DTMF string with 'W' pauses (500ms each)
// Used when building the LaML response
export function buildDTMFString(steps: IVRStep[]): string {
  return steps.map(step => {
    const pauses = 'w'.repeat(Math.round(step.pauseBeforeMs / 500))
    return pauses + step.digits
  }).join('')
}
