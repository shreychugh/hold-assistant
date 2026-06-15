'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const COMPANIES = [
  { id: 'cibc', label: 'CIBC', issues: [{ id: 'lost_stolen_card', label: 'Lost or Stolen Card' }] },
]

export default function Home() {
  const router = useRouter()
  const [company, setCompany] = useState('cibc')
  const [issueType, setIssueType] = useState('lost_stolen_card')
  const [userPhone, setUserPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  const selectedCompany = COMPANIES.find(c => c.id === company)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, issueType, userPhone }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setError(data.error || 'Something went wrong')
        return
      }

      router.push(`/status/${data.sessionId}`)
    } catch {
      setStatus('error')
      setError('Failed to connect. Try again.')
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📞</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#0f172a' }}>Hold Assistant</h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>We wait on hold. You don&apos;t.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Company</label>
            <select
              value={company}
              onChange={e => { setCompany(e.target.value); setIssueType(COMPANIES.find(c => c.id === e.target.value)?.issues[0].id || '') }}
              style={{ width: '100%', padding: '10px 12px', fontSize: 15, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
            >
              {COMPANIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Issue</label>
            <select
              value={issueType}
              onChange={e => setIssueType(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: 15, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
            >
              {selectedCompany?.issues.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your phone number</label>
            <input
              type="tel"
              value={userPhone}
              onChange={e => setUserPhone(e.target.value)}
              placeholder="+14165551234"
              required
              style={{ width: '100%', padding: '10px 12px', fontSize: 15, borderRadius: 8, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>We&apos;ll call this number when an agent picks up.</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
              {error.includes('active session') && (
                <button
                  onClick={async () => {
                    await fetch('/api/session/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userPhone }) })
                    setError('')
                    setStatus('idle')
                  }}
                  style={{ display: 'block', marginTop: 8, color: '#991b1b', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 13 }}
                >
                  Reset and try again →
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              width: '100%', padding: '13px', fontSize: 16, fontWeight: 600,
              background: status === 'loading' ? '#94a3b8' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: 10,
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'loading' ? 'Connecting...' : 'Call for Me'}
          </button>
        </form>
      </div>
    </div>
  )
}
