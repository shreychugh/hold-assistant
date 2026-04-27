# Hold Assistant

> We wait on hold. You don't.

Hold Assistant calls companies on your behalf, navigates their phone menus automatically, and calls you back the moment a real human agent answers — so you never wait on hold again.

## MVP Companies Supported
- CIBC — Lost/Stolen Credit Card
- TD Bank — Lost/Stolen Credit Card
- RBC — Lost/Stolen Credit Card
- Rogers — Billing Issues
- Bell — Billing Issues

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Database:** Firebase Firestore (real-time session tracking)
- **Telephony:** SignalWire (calls, IVR navigation, call bridging)
- **Speech Detection:** Deepgram (human agent detection)
- **Queue:** Upstash Redis + Bull

## Getting Started

1. Copy `.env.local` and fill in your credentials
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure
```
/app              → Next.js pages and API routes
/components       → Reusable UI components
/lib              → Firebase, SignalWire, queue setup
/docs             → Architecture and planning docs
```

## Status
MVP — in active development.
