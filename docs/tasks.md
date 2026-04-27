# Hold Assistant — Task Breakdown

## Branch Naming Convention

| Step | Branch Name |
|------|-------------|
| 1 | `feature/project-scaffold` |
| 2 | `feature/data-layer` |
| 3 | `feature/job-queue` |
| 4 & 5 | `feature/session-api` |
| 6 & 7 | `feature/ivr-navigation` |
| 8 & 9 | `feature/human-detection` |
| 10 | `feature/call-bridging` |
| 11, 12 & 13 | `feature/frontend-pages` |
| 14 | `feature/testing` |
| 15 | `feature/deploy` |

---

## Tasks

| # | Branch | Step | Feature | Folders Touched | Task |
|---|--------|------|---------|-----------------|------|
| 1 | `feature/project-scaffold` | Setup | Project Scaffold | `backend/`, `backend/routes/`, `backend/lib/`, `backend/workers/`, `backend/ivr/` | Initialize Node.js + Express project — folder structure, install dependencies, configure `.env` |
| 2 | `feature/data-layer` | Setup | Data Layer | `backend/lib/` | Set up Firebase Admin SDK — service account auth, Firestore client, sessions collection |
| 3 | `feature/job-queue` | Setup | Job Queue | `backend/lib/`, `backend/workers/` | Connect Upstash Redis + Bull — queue client, define call job processor skeleton |
| 4 | `feature/session-api` | Session API | Session Management | `backend/routes/session.js` | Build `POST /session` — validate input, write Firestore doc, enqueue call job, return sessionId |
| 5 | `feature/session-api` | Session API | Session Management | `backend/routes/session.js` | Build `GET /session/:id` — read Firestore session and return status to caller |
| 6 | `feature/ivr-navigation` | Call Trigger | Telephony | `backend/workers/callWorker.js`, `backend/lib/signalwire.js` | Integrate SignalWire — configure client, place outbound call to company number on job dequeue, update session to `calling` |
| 7 | `feature/ivr-navigation` | IVR Navigation | IVR Navigation | `backend/routes/signalwire.js`, `backend/ivr/` | Build `POST /signalwire/webhook` — serve LAML/XML per company IVR script (CIBC, TD, RBC, Rogers, Bell), update session to `navigating` |
| 8 | `feature/human-detection` | Human Detection | Human Detection | `backend/lib/deepgram.js`, `backend/workers/callWorker.js` | Integrate Deepgram — stream call audio, detect human agent voice, fire human-detected event, update session to `waiting` |
| 9 | `feature/human-detection` | Callback Flow | Callback Flow | `backend/routes/signalwire.js` | Build `POST /signalwire/human-detected` — update session to `agent_found`, trigger outbound callback call to user's phone |
| 10 | `feature/call-bridging` | Call Bridging | Call Bridging | `backend/lib/bridge.js`, `backend/routes/signalwire.js` | Bridge user's inbound answer to the company agent call leg via SignalWire, update session to `connected` |
| 11 | `feature/frontend-pages` | Frontend | UI — Home | `app/page.tsx`, `app/components/` | Build home page — company + issue type selector, callback number input, submit to `/api/session` |
| 12 | `feature/frontend-pages` | Frontend | UI — Status | `app/status/[id]/page.tsx` | Build status page — poll `GET /session/:id` every 2 s, display live status messages through all states |
| 13 | `feature/frontend-pages` | Frontend | API Gateway | `app/api/session/route.ts` | Add Next.js API route that proxies `POST /session` to the Express backend |
| 14 | `feature/testing` | Testing | QA | `tests/` | End-to-end test the full flow for at least 3 of 5 companies; verify status transitions and callback connection |
| 15 | `feature/deploy` | Deploy | DevOps | `render.yaml`, `vercel.json`, `.env.production` | Deploy backend to Render, frontend to Vercel; set all environment variables in both dashboards |
