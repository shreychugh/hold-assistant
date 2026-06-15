'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Session, SessionStatus } from '@/types/session'

const STATUS_STEPS: { status: SessionStatus; label: string; desc: string }[] = [
  { status: 'initiated', label: 'Starting', desc: 'Setting up your call...' },
  { status: 'calling', label: 'Dialing', desc: 'Calling the company...' },
  { status: 'navigating', label: 'Navigating', desc: 'Going through the phone menu...' },
  { status: 'waiting', label: 'On Hold', desc: 'Waiting for an agent. We\'ll call you the moment one picks up.' },
  { status: 'agent_found', label: 'Agent Found!', desc: 'An agent answered! Calling your phone now...' },
  { status: 'connected', label: 'Connected', desc: 'You\'re now connected to the agent.' },
]

const COMPANY_WAIT_TIMES: Record<string, string> = {
  cibc: '10–30 min',
  td: '15–35 min',
  rbc: '10–25 min',
  rogers: '20–45 min',
  bell: '20–45 min',
}

export default function StatusPage({ params }: { params: { sessionId: string } }) {
  const [session, setSession] = useState<Session | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [waitStart, setWaitStart] = useState<number | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'sessions', params.sessionId), snap => {
      if (snap.exists()) {
        const data = snap.data() as Session
        setSession(data)
        if (data.status === 'waiting' && !waitStart) setWaitStart(Date.now())
      }
    })
    return unsub
  }, [params.sessionId, waitStart])

  useEffect(() => {
    if (!waitStart) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - waitStart) / 1000)), 1000)
    return () => clearInterval(t)
  }, [waitStart])

  if (!session) {
    return (
      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading...</p>
      </div>
    )
  }

  const currentStep = STATUS_STEPS.findIndex(s => s.status === session.status)
  const isFailed = session.status === 'failed'
  const isDone = session.status === 'connected'

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const elapsedStr = `${mins}:${secs.toString().padStart(2, '0')}`

  const companyLabel = session.company.toUpperCase()
  const avgWait = COMPANY_WAIT_TIMES[session.company] || '15–35 min'

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>
            {isDone ? '✅' : isFailed ? '❌' : '⏳'}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>
            {isDone ? 'Connected!' : isFailed ? 'Call Failed' : `Calling ${companyLabel} for you`}
          </h1>
          {session.status === 'waiting' && (
            <p style={{ color: '#64748b', marginTop: 6, fontSize: 14 }}>
              We&apos;ll call <strong>{session.userPhone}</strong> the moment an agent picks up.
            </p>
          )}
        </div>

        {/* Progress steps */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          {STATUS_STEPS.filter(s => s.status !== 'failed').map((step, i) => {
            const done = currentStep > i
            const active = currentStep === i
            return (
              <div key={step.status} style={{ display: 'flex', gap: 14, marginBottom: i < STATUS_STEPS.length - 1 ? 20 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? '#2563eb' : active ? '#dbeafe' : '#f1f5f9',
                    border: active ? '2px solid #2563eb' : 'none',
                    fontSize: 13, fontWeight: 700,
                    color: done ? '#fff' : active ? '#2563eb' : '#94a3b8',
                    flexShrink: 0,
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: done ? '#2563eb' : '#e2e8f0', marginTop: 4 }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < STATUS_STEPS.length - 1 ? 20 : 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: active ? '#0f172a' : done ? '#0f172a' : '#94a3b8' }}>
                    {step.label}
                  </div>
                  {active && (
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{step.desc}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Wait time info */}
        {session.status === 'waiting' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time on hold</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{elapsedStr}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg wait</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>{avgWait}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#2563eb', borderRadius: 2, width: `${Math.min(100, (elapsed / (15 * 60)) * 100)}%`, transition: 'width 1s linear' }} />
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
              You can close this page — we&apos;ll still call you back.
            </p>
          </div>
        )}

        {isFailed && (
          <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16, color: '#991b1b', fontSize: 14 }}>
            {session.errorMessage || 'The call ended unexpectedly.'}
            <br />
            <a href="/" style={{ color: '#2563eb', fontWeight: 600, marginTop: 8, display: 'inline-block' }}>Try again →</a>
          </div>
        )}
      </div>
    </div>
  )
}
