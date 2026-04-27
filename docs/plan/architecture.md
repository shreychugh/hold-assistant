# Architecture

## Overview
Hold Assistant is a web app that calls companies on behalf of users, navigates IVR phone trees,
detects human agents via speech recognition, and bridges the call back to the user.

## Components
- **Frontend** — Next.js 14 (App Router), hosted on Vercel
- **Backend** — Next.js API Routes, hosted on Render (or Vercel serverless)
- **Database** — Firebase Firestore (real-time session tracking)
- **Telephony** — SignalWire (outbound calls, DTMF, call bridging)
- **Speech Detection** — Deepgram (streaming transcription to detect human agents)
- **Queue** — Upstash Redis + Bull (concurrent session management)

## Call Flow
1. User submits form → POST /api/session → Firestore doc created → SignalWire call to company
2. SignalWire webhook → DTMF sequence executed for company IVR
3. Call audio streamed to Deepgram → human speech detected
4. POST /api/callback triggered → SignalWire calls user back
5. Calls bridged → user connected to agent
6. Firestore status updated to "connected"

<!-- TODO: Add architecture diagram -->
