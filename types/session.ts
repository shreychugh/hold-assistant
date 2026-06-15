export type SessionStatus =
  | 'initiated'
  | 'calling'
  | 'navigating'
  | 'waiting'
  | 'agent_found'
  | 'connected'
  | 'failed'

export interface Session {
  sessionId: string
  company: string
  issueType: string
  userPhone: string
  status: SessionStatus
  createdAt: number
  updatedAt: number
  callSid?: string
  agentCallSid?: string
  ivrStep?: number
  errorMessage?: string
}
