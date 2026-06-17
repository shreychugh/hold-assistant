# Hold Assistant — Launch TODO

Goal: Get a working link in front of real users to see end-to-end signal. Ship fast.

---

## 🔴 Phase 1 — MVP Soft Launch

### App Polish & Reliability

- [ ] **Phone number format validation** — normalize whatever user types (416-555-1234, 4165551234, etc.) to E.164 format (+14165551234) on the form before submitting. Show inline error if invalid.

- [ ] **Cancel button on status page** — let users cancel an in-progress session. Button should call a `/api/session/cancel` endpoint, update Firestore status to `cancelled`, hang up the SignalWire call, and redirect back to home.

- [ ] **Handle call drop / stuck on hold** — if call ends unexpectedly (company hangs up, network drops), user is currently stuck on status page forever. Fix: set a max wait timeout (e.g. 60 min), and show a clear failure message with a "Try again" button if session goes stale.

- [ ] **Verify Vercel serverless timeout** — Vercel functions time out at 60s. The webhook pattern (SignalWire calls back repeatedly) should handle long holds fine, but confirm this works for a 30+ min hold. If needed, upgrade to Vercel Pro (60s → 300s limit) or verify the LaML redirect loop keeps the call alive independently.

- [ ] **Tighten the 3-call cap per phone number** — confirm `/api/session` enforces this so one person can't run up your SignalWire bill.

- [ ] **Test on mobile** — open the app on your phone and submit a real request. Make sure the form, status page, and callback flow work on mobile (most users will be on phone).

### Companies to Add (lost/stolen card for all)

- [ ] **TD Bank** — map IVR for lost/stolen card: call +18009838472, record steps, fill in `lib/ivr-scripts.ts`.

- [ ] **Scotiabank** — map IVR for lost/stolen card: call +18882618586, record steps, fill in `lib/ivr-scripts.ts`.

- [ ] **RBC** — map IVR for lost/stolen card: call +18007692512, record steps, fill in `lib/ivr-scripts.ts`.

- [ ] **CRA (Canada Revenue Agency)** — map IVR for general/personal tax enquiries: call 1-800-959-8281, record steps, fill in `lib/ivr-scripts.ts`. Big differentiator — nobody else does this.

- [ ] **Add all new companies to the home page dropdown**

### Useful Info for Users

- [ ] **Research best times to call** — find lowest wait times for CIBC, TD, Scotiabank, RBC, CRA, Air Canada (Reddit, community forums, known patterns). Document findings.

- [ ] **Add static "best time to call" to home page** — show a small tip under each company in the dropdown (e.g. "💡 Best time: Tue–Thu 8–10am"). Hardcoded for now, no backend needed.

### Branding & Trust

- [ ] **Buy domain** — holdassistant.ca or holdassistant.com (~$12/yr on Namecheap). Point to Vercel: Vercel dashboard → Settings → Domains → add domain.

- [ ] **Logo** — simple icon + wordmark. Use Canva or generate as SVG in code. Add to home page and status page header.

- [ ] **Footer** — add to all pages with: About, Privacy Policy, DNC notice (required for CASL compliance — you're making automated calls in Canada).

- [ ] **Privacy Policy page** — covers: what data you collect (phone number, call logs), how it's used, how to delete it.

- [ ] **DNC / Terms page** — users consent to receive one automated callback from your system when an agent is found.

### Launch

- [ ] **Add feedback link on status page** — after connected or failed, show "How did it work? →" link to a Google Form. This is your only user signal early on.

- [ ] **Set up a way to see sessions happening** — Firebase console → Firestore → sessions collection. Watch live when someone uses it.

- [ ] **Demo video** — screen record the full flow (form → call → status page → phone rings → connected). Under 60 seconds. Use for Reddit post and landing page.

- [ ] **Share with 3–5 friends** — people who've recently been on hold with a Canadian bank or telecom. Ask for honest feedback.

- [ ] **Post in r/PersonalFinanceCanada** — "I built a free tool that waits on hold with CIBC for you. Looking for beta testers." Honest, no hype. Only after mobile test passes.

---

## 🟡 Phase 2 — Growth & Trust

- [ ] **Sign up / Sign in (auth)** — add Google or phone auth via Firebase. Gate the "Call for Me" feature behind login. Keep landing page public.

- [ ] **Landing page with useful info** — best times to call each provider, average hold times, how it works. Builds trust before users submit their phone number.

- [ ] **Add billing / general support issue types per company**

- [ ] **Air Canada** — map IVR for flight changes/cancellations: call 1-888-247-2262, record steps, fill in `lib/ivr-scripts.ts`. Complex tree, may need multiple issue types.

- [ ] **Rogers, Bell, Fido** — IVR asks for account number (voice-detect). Needs extra handling before these work reliably.

- [ ] **Dynamic best time to call** — replace hardcoded tips with live data crowdsourced from your own users ("how long did you wait?") + Reddit/API sources.

- [ ] **Simple analytics** — count of sessions, success rate, average hold time saved.

---

## 🔵 Phase 3 — Monetization & Scale

- [ ] **Monetization** — $3.99/mo subscription or pay-per-use after auth is in place.

- [ ] **AI-driven IVR navigation** — replace hardcoded scripts with live speech detection so any new company works automatically.

- [ ] **More companies** — insurance, airlines, government lines beyond CRA.
