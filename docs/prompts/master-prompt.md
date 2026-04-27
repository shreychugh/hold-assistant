# Hold Assistant — MVP Execution Plan

## Product Overview
Build a web app called "Hold Assistant" that calls companies on behalf of users, 
navigates their IVR phone trees automatically, detects when a real human agent 
answers, and calls the user back to connect them — so they never wait on hold.

## Target Market
Canada (Phase 1)

## Tech Stack
- Frontend: Next.js (React), hosted on Vercel
- Backend: Node.js + Express, hosted on Render
- Database: Firebase Firestore (real-time session tracking)
- Telephony: SignalWire (calls, DTMF navigation, call bridging)
- Speech/Human Detection: Deepgram (detect when human agent answers)
- Queue: Upstash Redis + Bull (manage concurrent call sessions)

## Core User Flow
1. User opens web app
2. Selects a company and issue type from a pre-built list
3. Enters their callback phone number
4. Hits "Call for Me"
5. Sees a real-time status screen:
   - "Calling [Company]..."
   - "Navigating menus..."
   - "Waiting for agent..."
   - "Agent found! Calling you now..."
6. User's phone rings → they answer → connected directly to human agent

## Phase 1 Companies & IVR Scripts
1. CIBC — Lost/Stolen Credit Card
2. TD Bank — Lost/Stolen Credit Card
3. RBC — Lost/Stolen Credit Card
4. Rogers — Billing Issue
5. Bell — Billing Issue

## Data Model (Firestore)
Collection: sessions
- sessionId: string
- company: string
- issueType: string
- userPhone: string
- status: enum [initiated, calling, navigating, waiting, agent_found, connected, failed]
- createdAt: timestamp
- updatedAt: timestamp
- callSid: string
- agentCallSid: string

## Backend Endpoints
- POST /session
- POST /signalwire/webhook
- POST /signalwire/human-detected
- GET /session/:id

## Build Order
Step 1 — Project Setup
Step 2 — Backend: Session & Call Trigger
Step 3 — Backend: IVR Navigation
Step 4 — Backend: Human Detection
Step 5 — Backend: Call Bridging
Step 6 — Frontend: All Pages
Step 7 — Testing
Step 8 — Deployment

## Environment Variables Needed
- SIGNALWIRE_PROJECT_ID
- SIGNALWIRE_API_TOKEN
- SIGNALWIRE_SPACE_URL
- SIGNALWIRE_PHONE_NUMBER
- DEEPGRAM_API_KEY
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- UPSTASH_REDIS_URL
- UPSTASH_REDIS_TOKEN

## MVP Constraints
- No user accounts or login
- No payment (free beta)
- No mobile app (web only, mobile-first)
- No AI-generated IVR navigation (hardcoded sequences only)
- Max 1 active session per phone number
- English only

## Success Criteria
- Full flow completed in under 60 seconds setup time
- Successfully navigates to human agent for 3 of 5 companies
- Real-time status updates work reliably
- Callback connects user to agent without dropped call
