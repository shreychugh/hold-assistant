# Hold Assistant — Task Breakdown

| # | Step | Feature | Folders Touched | Task |
|---|------|---------|-----------------|------|
| 1 | Setup | Project Scaffold | `backend/`, `backend/routes/`, `backend/lib/`, `backend/workers/`, `backend/ivr/` | Initialize Node.js + Express project — folder structure, install dependencies, configure `.env` |
| 2 | Setup | Data Layer | `backend/lib/` | Set up Firebase Admin SDK — service account auth, Firestore client, sessions collection |
| 3 | Setup | Job Queue | `backend/lib/`, `backend/workers/` | Connect Upstash Redis + Bull — queue client, define call job processor skeleton |
| 4 | Session API | Session Management | `backend/routes/session.js` | Build `POST /session` — validate input, write Firestore doc, enqueue call job, return sessionId |
| 5 | Session API | Session Management | `backend/routes/session.js` | Build `GET /session/:id` — read Firestore session and return status to caller |
| 6 | Call Trigger | Telephony | `backend/workers/callWorker.js`, `backend/lib/signalwire.js` | Integrate SignalWire — configure client, place outbound call to company number on job dequeue, update session to `calling` |
| 7 | IVR Navigation | IVR Navigation | `backend/routes/signalwire.js`, `backend/ivr/` | Build `POST /signalwire/webhook` — serve LAML/XML per company IVR script (CIBC, TD, RBC, Rogers, Bell), update session to `navigating` |
| 8 | Human Detection | Human Detection | `backend/lib/deepgram.js`, `backend/workers/callWorker.js` | Integrate Deepgram — stream call audio, detect human agent voice, fire human-detected event, update session to `waiting` |
| 9 | Callback Flow | Callback Flow | `backend/routes/signalwire.js` | Build `POST /signalwire/human-detected` — update session to `agent_found`, trigger outbound callback call to user's phone |
| 10 | Call Bridging | Call Bridging | `backend/lib/bridge.js`, `backend/routes/signalwire.js` | Bridge user's inbound answer to the company agent call leg via SignalWire, update session to `connected` |
| 11 | Frontend | UI — Home | `app/page.tsx`, `app/components/` | Build home page — company + issue type selector, callback number input, submit to `/api/session` |
| 12 | Frontend | UI — Status | `app/status/[id]/page.tsx` | Build status page — poll `GET /session/:id` every 2 s, display live status messages through all states |
| 13 | Frontend | API Gateway | `app/api/session/route.ts` | Add Next.js API route that proxies `POST /session` to the Express backend |
| 14 | Testing | QA | `tests/` | End-to-end test the full flow for at least 3 of 5 companies; verify status transitions and callback connection |
| 15 | Deploy | DevOps | `render.yaml`, `vercel.json`, `.env.production` | Deploy backend to Render, frontend to Vercel; set all environment variables in both dashboards |
