# Hold Assistant — QA & Testing Guide

---

## Step 1 — Project Scaffold

**Branch:** `feature/project-scaffold`

- [ ] Run `npm install` in `backend/` — zero errors
- [ ] Run `node index.js` — server starts and logs `Listening on port 3001`
- [ ] Confirm all folders exist: `backend/routes/`, `backend/lib/`, `backend/workers/`, `backend/ivr/`
- [ ] Confirm `.env.example` lists all required environment variable keys
- [ ] `GET /health` returns `200 OK`

---

## Step 2 — Data Layer (Firebase Firestore)

**Branch:** `feature/data-layer`

- [ ] App starts without Firebase credential errors
- [ ] Run the seed script (or manual test): write a dummy session doc to Firestore
- [ ] Open Firebase console → Firestore → confirm doc appears under `sessions/` collection
- [ ] Read the doc back via the SDK and confirm all fields match what was written
- [ ] Delete the test doc after confirming

---

## Step 3 — Job Queue (Redis + Bull)

**Branch:** `feature/job-queue`

- [ ] App starts without Redis connection errors
- [ ] Manually enqueue a test job via the queue client
- [ ] Confirm job appears in Upstash Redis dashboard (or Bull Board if wired up)
- [ ] Worker picks up the job and logs the payload
- [ ] Failed job lands in the failed queue (simulate by throwing inside the processor)

---

## Step 4 — POST /session

**Branch:** `feature/session-api`

```bash
curl -X POST http://localhost:3001/session \
  -H "Content-Type: application/json" \
  -d '{"company":"CIBC","issueType":"Lost/Stolen Credit Card","userPhone":"+14165550100"}'
```

- [ ] Returns `200` with a `sessionId`
- [ ] Firestore doc created with `status: "initiated"`
- [ ] Call job enqueued in Bull queue
- [ ] Missing fields return `400` with a validation error message
- [ ] Duplicate `userPhone` with an active session returns `409`

---

## Step 5 — GET /session/:id

**Branch:** `feature/session-api`

```bash
curl http://localhost:3001/session/<sessionId>
```

- [ ] Returns `200` with the full session object
- [ ] All fields present: `sessionId`, `company`, `issueType`, `userPhone`, `status`, `createdAt`, `updatedAt`
- [ ] Unknown `sessionId` returns `404`
- [ ] Status reflects the current Firestore value (manually update Firestore and re-poll to confirm)

---

## Step 6 — SignalWire Outbound Call

**Branch:** `feature/ivr-navigation`

- [ ] Trigger a call job manually (or via `POST /session`)
- [ ] SignalWire dashboard shows an outbound call placed to the correct company number
- [ ] Firestore session updates to `status: "calling"`
- [ ] Call SID stored in session doc (`callSid` field)
- [ ] If SignalWire credentials are invalid, session updates to `status: "failed"` with an error log

---

## Step 7 — IVR Navigation Webhook

**Branch:** `feature/ivr-navigation`

Simulate a SignalWire webhook POST for each company:

```bash
curl -X POST http://localhost:3001/signalwire/webhook \
  -d 'CallSid=CA123&CallStatus=in-progress&To=+18005550001'
```

- [ ] Returns valid LAML/XML (no parse errors)
- [ ] DTMF digits match the expected IVR sequence for each company:
  - [ ] CIBC — Lost/Stolen Card sequence
  - [ ] TD Bank — Lost/Stolen Card sequence
  - [ ] RBC — Lost/Stolen Card sequence
  - [ ] Rogers — Billing Issue sequence
  - [ ] Bell — Billing Issue sequence
- [ ] Firestore session updates to `status: "navigating"`
- [ ] Invalid `CallSid` returns `400`

---

## Step 8 — Human Detection (Deepgram)

**Branch:** `feature/human-detection`

- [ ] Deepgram client initializes without errors on startup
- [ ] Stream a sample audio file of a human agent greeting through the detector
- [ ] Human speech triggers the detection event and logs `human detected`
- [ ] Stream hold music / IVR audio — detection does NOT fire
- [ ] Firestore session updates to `status: "waiting"` once detection fires
- [ ] Detection result includes a confidence score above the configured threshold

---

## Step 9 — human-detected Endpoint & Callback

**Branch:** `feature/human-detection`

```bash
curl -X POST http://localhost:3001/signalwire/human-detected \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<sessionId>"}'
```

- [ ] Returns `200 OK`
- [ ] Firestore session updates to `status: "agent_found"`
- [ ] SignalWire dashboard shows a new outbound call placed to `userPhone`
- [ ] Agent call SID stored in session doc (`agentCallSid` field)
- [ ] Unknown `sessionId` returns `404`

---

## Step 10 — Call Bridging

**Branch:** `feature/call-bridging`

- [ ] Answer the callback call on a real phone (or use SignalWire test number)
- [ ] Both call legs (user + company agent) are bridged within 5 seconds of user answering
- [ ] Firestore session updates to `status: "connected"`
- [ ] Audio flows both ways — no one-way audio
- [ ] Hanging up either leg ends both legs cleanly
- [ ] Session `updatedAt` timestamp is refreshed on connection

---

## Step 11 — Frontend: Home Page

**Branch:** `feature/frontend-pages`

- [ ] `npm run dev` starts without errors
- [ ] Home page loads at `http://localhost:3000`
- [ ] Company dropdown shows all 5 companies
- [ ] Issue type dropdown updates based on selected company
- [ ] Phone number field accepts only valid Canadian phone numbers
- [ ] Submitting with missing fields shows inline validation errors
- [ ] Valid form submission POSTs to `/api/session` and redirects to `/status/<sessionId>`

---

## Step 12 — Frontend: Status Page

**Branch:** `feature/frontend-pages`

- [ ] `/status/<sessionId>` loads without errors
- [ ] Status message displays correctly for each state:
  - [ ] `initiated` → "Getting ready..."
  - [ ] `calling` → "Calling [Company]..."
  - [ ] `navigating` → "Navigating menus..."
  - [ ] `waiting` → "Waiting for agent..."
  - [ ] `agent_found` → "Agent found! Calling you now..."
  - [ ] `connected` → "Connected! Pick up your phone."
  - [ ] `failed` → "Something went wrong. Please try again."
- [ ] Page polls every 2 seconds and updates without full page reload
- [ ] Unknown `sessionId` shows a not-found message
- [ ] Page is usable on a 375px wide mobile screen

---

## Step 13 — Next.js API Proxy Route

**Branch:** `feature/frontend-pages`

```bash
curl -X POST http://localhost:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{"company":"Rogers","issueType":"Billing Issue","userPhone":"+14165550100"}'
```

- [ ] Returns same `sessionId` response as the direct backend call
- [ ] Backend receives the request (check backend logs)
- [ ] Network errors from the backend surface as `502` to the caller, not a crash

---

## Step 14 — End-to-End Test (3 of 5 Companies)

**Branch:** `feature/testing`

Run the complete flow from browser to connected call for each target company:

| Company | Issue | Pass |
|---------|-------|------|
| CIBC | Lost/Stolen Credit Card | [ ] |
| TD Bank | Lost/Stolen Credit Card | [ ] |
| RBC | Lost/Stolen Credit Card | [ ] |

For each run verify:
- [ ] Setup time under 60 seconds from form submit to callback ring
- [ ] All status transitions appear on the status page in order
- [ ] User's phone rings after agent is detected
- [ ] Call connects and audio is clear on both sides
- [ ] Session ends cleanly with `status: "connected"` in Firestore

---

## Step 15 — Deployment

**Branch:** `feature/deploy`

**Backend (Render)**
- [ ] Service deploys without build errors
- [ ] All environment variables set in Render dashboard
- [ ] `GET https://<render-url>/health` returns `200`
- [ ] `POST https://<render-url>/session` creates a session in production Firestore

**Frontend (Vercel)**
- [ ] Deployment succeeds with no build errors
- [ ] All environment variables set in Vercel dashboard (including `NEXT_PUBLIC_BACKEND_URL`)
- [ ] Home page loads at production URL
- [ ] Form submission hits the Render backend (check network tab)

**Smoke Test (Production)**
- [ ] Run one full end-to-end flow on production for CIBC
- [ ] Status page updates in real-time on production
- [ ] Callback call connects successfully
