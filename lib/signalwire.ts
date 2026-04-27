// SignalWire Client Initialization
// Placeholder for SignalWire SDK setup.
// Used in backend/API routes to:
//   - Make outbound calls to companies
//   - Execute DTMF sequences to navigate IVR menus
//   - Bridge company call + user call when human agent is detected
//   - Stream call audio to Deepgram for human detection
//
// Note: SignalWire credentials must be kept server-side only (never exposed to client).

export const signalwireConfig = {
  projectId: process.env.SIGNALWIRE_PROJECT_ID!,
  apiToken: process.env.SIGNALWIRE_API_TOKEN!,
  spaceUrl: process.env.SIGNALWIRE_SPACE_URL!,
  phoneNumber: process.env.SIGNALWIRE_PHONE_NUMBER!,
};

// TODO: Initialize SignalWire REST client here
// TODO: Export helper functions: makeCall(), playDTMF(), bridgeCalls()
