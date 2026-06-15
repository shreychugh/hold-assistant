'use client'

import { useState, useEffect, useRef } from 'react'

type Level = {
  index: number
  digit: string | null
  transcript: string
}

const DTMF_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

export default function MapperTestPage() {
  const [phone, setPhone] = useState('+18884813436')
  const [status, setStatus] = useState<'idle' | 'calling' | 'recording' | 'waiting' | 'done' | 'error'>('idle')
  const [callSid, setCallSid] = useState<string | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [customDigit, setCustomDigit] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current)
  }

  useEffect(() => () => stopPolling(), [])

  function pollForLevel(sid: string, index: number, digit: string | null) {
    stopPolling()
    setStatus('recording')
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/mapper/webhook?callSid=${sid}&index=${index}`)
        const d = await r.json()
        if (d.status === 'done') {
          stopPolling()
          setLevels(prev => [...prev, { index, digit, transcript: d.transcript }])
          setStatus('waiting')
        }
      } catch { /* keep polling */ }
    }, 3000)
    setTimeout(() => { stopPolling(); setStatus('done') }, 3 * 60 * 1000)
  }

  async function startCall() {
    setStatus('calling')
    setErrorMsg('')
    setLevels([])
    setCallSid(null)
    setCurrentIndex(0)

    try {
      const res = await fetch('/api/mapper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      })
      const data = await res.json()
      if (data.error) { setStatus('error'); setErrorMsg(data.error); return }

      setCallSid(data.callSid)
      pollForLevel(data.callSid, 0, null)
    } catch {
      setStatus('error')
      setErrorMsg('Failed to start call')
    }
  }

  async function pressDigit(digit: string) {
    if (!callSid || !digit.trim()) return
    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)
    setStatus('recording')

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
    try {
      const res = await fetch('/api/mapper/dtmf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callSid, digit, nextIndex, baseUrl }),
      })
      const d = await res.json()
      if (d.error) { setStatus('error'); setErrorMsg(d.error); return }
    } catch {
      setStatus('error'); setErrorMsg('Failed to send DTMF'); return
    }

    pollForLevel(callSid, nextIndex, digit)
  }

  async function hangUp() {
    if (!callSid) return
    stopPolling()
    await fetch('/api/mapper/hangup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callSid }),
    })
    setStatus('done')
  }

  const isActive = status === 'calling' || status === 'recording' || status === 'waiting'

  return (
    <div style={{ fontFamily: 'monospace', padding: 40, maxWidth: 680 }}>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>IVR Mapper</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 13 }}>
        Calls a number. After each menu, press the DTMF key to navigate deeper.
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          disabled={isActive}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', fontSize: 15, borderRadius: 6, border: '1px solid #cbd5e1' }}
        />
        <button
          onClick={startCall}
          disabled={isActive}
          style={{
            padding: '8px 20px', fontSize: 15,
            background: isActive ? '#94a3b8' : '#2563eb',
            color: '#fff', border: 'none', borderRadius: 8,
            cursor: isActive ? 'not-allowed' : 'pointer',
          }}
        >
          {isActive ? 'In Progress...' : 'Start Call'}
        </button>
        {callSid && status !== 'done' && (
          <button
            onClick={hangUp}
            style={{ padding: '8px 16px', fontSize: 15, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Hang Up
          </button>
        )}
      </div>

      {/* Status */}
      {status === 'calling' && <div style={{ color: '#64748b', marginBottom: 16 }}>📞 Connecting to {phone}...</div>}
      {status === 'recording' && <div style={{ color: '#dc2626', marginBottom: 16 }}>🔴 Recording menu level {currentIndex}...</div>}
      {status === 'done' && <div style={{ color: '#166534', marginBottom: 16 }}>✅ Call ended.</div>}
      {status === 'error' && <div style={{ color: '#991b1b', marginBottom: 16 }}>❌ {errorMsg}</div>}

      {/* Transcript levels */}
      {levels.map((level) => (
        <div key={level.index} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
            Level {level.index} — {level.digit ? `pressed "${level.digit}"` : 'initial greeting'}
          </div>
          <pre style={{
            padding: 16, background: '#0f172a', color: '#e2e8f0',
            borderRadius: 8, whiteSpace: 'pre-wrap', fontSize: 13,
            lineHeight: 1.6, margin: 0,
          }}>
            {level.transcript || '(empty — no speech detected)'}
          </pre>
        </div>
      ))}

      {/* DTMF keypad */}
      {status === 'waiting' && (
        <div style={{ marginTop: 8, padding: 20, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
            Press a key to navigate:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 220, marginBottom: 16 }}>
            {DTMF_KEYS.map(key => (
              <button
                key={key}
                onClick={() => pressDigit(key)}
                style={{
                  height: 52, fontSize: 20,
                  background: '#fff', border: '1px solid #cbd5e1',
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace',
                }}
              >
                {key}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={customDigit}
              onChange={e => setCustomDigit(e.target.value)}
              placeholder="multi-digit (e.g. 4165551234)"
              style={{ flex: 1, padding: '7px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
            <button
              onClick={() => { pressDigit(customDigit); setCustomDigit('') }}
              disabled={!customDigit.trim()}
              style={{
                padding: '7px 14px', background: '#2563eb', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13,
              }}
            >
              Send
            </button>
          </div>
          <button
            onClick={hangUp}
            style={{ marginTop: 12, fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Done mapping — hang up
          </button>
        </div>
      )}
    </div>
  )
}
