# Tech Stack

| Layer              | Technology         | Cost              |
|--------------------|--------------------|-------------------|
| Frontend           | Next.js 14         | Free              |
| Frontend Hosting   | Vercel             | Free              |
| Backend            | Next.js API Routes | Free              |
| Database           | Firebase Firestore | Free tier         |
| Telephony          | SignalWire         | ~$0.006/min       |
| Speech Detection   | Deepgram           | $200 free credit  |
| Queue              | Upstash Redis      | Free tier         |

## Why These Choices
- **Firebase Firestore** — real-time listeners built-in, no websocket setup needed for live status updates
- **SignalWire** — ~50% cheaper than Twilio, Twilio-compatible API
- **Deepgram** — fast streaming transcription, accurate human speech detection
- **Next.js API Routes** — no separate backend service needed for MVP
