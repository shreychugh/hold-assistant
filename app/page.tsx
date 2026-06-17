'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const COMPANIES = [
  {
    id: 'cibc',
    label: 'CIBC (CA)',
    flag: '🇨🇦',
    issues: [{ id: 'lost_stolen_card', label: 'Lost or Stolen Card' }],
    tip: 'Tue–Thu, 8–10am ET. Avoid Mondays.',
    avg: '17 min',
    color: '#dc2626',
  },
  {
    id: 'td',
    label: 'TD Bank (CA)',
    flag: '🇨🇦',
    issues: [{ id: 'lost_stolen_card', label: 'Lost or Stolen Card' }],
    tip: 'Weekdays 8–9am ET. Avoid Monday mornings.',
    avg: '20 min',
    color: '#16a34a',
  },
  {
    id: 'scotiabank',
    label: 'Scotiabank (CA)',
    flag: '🇨🇦',
    issues: [{ id: 'lost_stolen_card', label: 'Lost or Stolen Card' }],
    tip: 'Tue–Thu, 8–10am ET. Fridays get busy after lunch.',
    avg: '18 min',
    color: '#dc2626',
  },
  {
    id: 'rbc',
    label: 'RBC (CA)',
    flag: '🇨🇦',
    issues: [{ id: 'lost_stolen_card', label: 'Lost or Stolen Card' }],
    tip: 'Early weekday mornings before 9am ET.',
    avg: '15 min',
    color: '#2563eb',
  },
  {
    id: 'cra',
    label: 'CRA (CA)',
    flag: '🇨🇦',
    issues: [{ id: 'personal_tax', label: 'Personal Tax Enquiry' }],
    tip: 'Sat mornings or weekdays 2–3pm ET.',
    avg: '31 min',
    color: '#7c3aed',
  },
  {
    id: 'chase',
    label: 'Chase (US)',
    flag: '🇺🇸',
    issues: [{ id: 'lost_stolen_card', label: 'Lost or Stolen Card' }],
    tip: 'Weekdays 7–9am ET or after 6pm ET.',
    avg: '12 min',
    color: '#1d4ed8',
  },
  {
    id: 'bofa',
    label: 'Bank of America (US)',
    flag: '🇺🇸',
    issues: [{ id: 'lost_stolen_card', label: 'Lost or Stolen Card' }],
    tip: 'Early weekday mornings at open (8am ET) or Sundays.',
    avg: '14 min',
    color: '#dc2626',
  },
  {
    id: 'wellsfargo',
    label: 'Wells Fargo (US)',
    flag: '🇺🇸',
    issues: [{ id: 'lost_stolen_card', label: 'Lost or Stolen Card' }],
    tip: 'Weekdays before 9am ET. Mondays are the worst.',
    avg: '16 min',
    color: '#d97706',
  },
  {
    id: 'pnc',
    label: 'PNC Bank (US)',
    flag: '🇺🇸',
    issues: [{ id: 'lost_stolen_card', label: 'Lost or Stolen Card' }],
    tip: 'Wed–Thu, call at 8am ET. Avoid Mondays and lunch hours.',
    avg: '13 min',
    color: '#f97316',
  },
]

const STEPS = [
  { icon: '📋', title: 'Pick your company & issue', desc: 'Choose who you need to call and what it\'s about.' },
  { icon: '📞', title: 'We call and hold for you', desc: 'We dial in, navigate the IVR menu, and sit on hold so you don\'t have to.' },
  { icon: '🔔', title: 'Your phone rings', desc: 'The moment a customer rep picks up, we call you and connect you instantly.' },
]

export default function Home() {
  const router = useRouter()
  const [company, setCompany] = useState('cibc')
  const [issueType, setIssueType] = useState('lost_stolen_card')
  const [userPhone, setUserPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  const selectedCompany = COMPANIES.find(c => c.id === company)

  function normalizePhone(input: string): string {
    const digits = input.replace(/\D/g, '')
    if (digits.length === 10) return `+1${digits}`
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
    return input
  }

  function isValidPhone(input: string): boolean {
    return /^\+1[2-9]\d{9}$/.test(normalizePhone(input))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPhone(userPhone)) {
      setStatus('error')
      setError('Please enter a valid phone number (e.g. 416-555-1234)')
      return
    }
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, issueType, userPhone: normalizePhone(userPhone) }),
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
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21 }}>📞</div>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Hold Assistant</span>
        </div>
        <nav style={{ display: 'flex', gap: 28 }}>
          <a href="#how-it-works" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>How it works</a>
          <a href="#best-times" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>Best times</a>
          <a href="#" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>About</a>
        </nav>
      </header>

      {/* Hero + Form */}
      <section style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #7c3aed 100%)', padding: '72px 24px 80px', color: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>

          {/* Left: copy */}
          <div>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
              Stop wasting your life<br />on hold.
            </h1>
            <p style={{ fontSize: 18, opacity: 0.85, lineHeight: 1.65, marginBottom: 32, maxWidth: 440 }}>
              We dial, navigate the menu, and wait on hold. The moment a customer rep picks up — <strong>we call you</strong>.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {['No account needed', 'Completely free'].map(t => (
                <span key={t} style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, backdropFilter: 'blur(4px)' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div>
            <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 64px rgba(0,0,0,0.28)', color: '#0f172a' }}>
              <h2 style={{ margin: '0 0 28px', fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Who do you need to call?</h2>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Company</label>
                <select
                  value={company}
                  onChange={e => {
                    const c = COMPANIES.find(x => x.id === e.target.value)!
                    setCompany(c.id)
                    setIssueType(c.issues[0].id)
                  }}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 500 }}
                >
                  {COMPANIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                {selectedCompany && (
                  <div style={{ fontSize: 12, color: '#2563eb', marginTop: 7, fontWeight: 600, background: '#eff6ff', padding: '6px 10px', borderRadius: 8 }}>
                    💡 Best time: {selectedCompany.tip}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Issue</label>
                <select
                  value={issueType}
                  onChange={e => setIssueType(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 500 }}
                >
                  {selectedCompany?.issues.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your phone number</label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={e => { setUserPhone(e.target.value); setError(''); setStatus('idle') }}
                  placeholder="416-555-1234"
                  required
                  style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 12, border: `1.5px solid ${error.includes('phone') ? '#ef4444' : '#e2e8f0'}`, boxSizing: 'border-box', background: '#f8fafc', fontWeight: 500 }}
                />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>We&apos;ll call you the moment a rep picks up.</p>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                  {error}
                  {error.includes('active session') && (
                    <button
                      onClick={async () => {
                        await fetch('/api/session/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userPhone: normalizePhone(userPhone) }) })
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
                  width: '100%', padding: '15px', fontSize: 16, fontWeight: 800,
                  background: status === 'loading' ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#fff', border: 'none', borderRadius: 14,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  letterSpacing: '-0.01em', boxShadow: status === 'loading' ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
                }}
              >
                {status === 'loading' ? '⏳ Connecting...' : '📞 Call for Me — It\'s Free'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>
                No account · No credit card · Cancel call anytime
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Best time to call */}
      <section id="best-times" style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Save your time</span>
            <h2 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Best times to call</h2>
            <p style={{ color: '#64748b', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>Even we can&apos;t fight a Monday morning rush. Here&apos;s when hold times are shortest — use this before you dial.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {COMPANIES.map(c => (
              <div key={c.id} style={{ borderRadius: 16, padding: '20px 22px', background: '#f8fafc', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: c.color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{c.label.replace(/ \((CA|US)\)/, '')}</span>
                    <span style={{ marginLeft: 7, fontSize: 10, fontWeight: 700, color: c.color, background: `${c.color}18`, padding: '2px 7px', borderRadius: 6 }}>{c.flag === '🇨🇦' ? 'CA' : 'US'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>avg hold time</div>
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 700, background: c.color, padding: '3px 8px', borderRadius: 8, whiteSpace: 'nowrap' }}>{c.avg}</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.55 }}>💡 {c.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '72px 24px', background: 'linear-gradient(135deg, #f0f9ff, #f8fafc)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Simple as 1-2-3</span>
            <h2 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>How it works</h2>
            <p style={{ color: '#64748b', fontSize: 15 }}>Three steps. Zero hold music in your ear.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 20, padding: '32px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800 }}>{i + 1}</div>
                <div style={{ fontSize: 42, marginBottom: 16 }}>{step.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '48px 32px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📞</div>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#f1f5f9' }}>Hold Assistant</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 260, margin: 0 }}>We wait on hold so you don&apos;t have to. Built for people who have better things to do.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 40px' }}>
              <div>
                <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</div>
                {['About Us', 'The Idea', 'Contact Us'].map(l => (
                  <a key={l} href="#" style={{ display: 'block', color: '#94a3b8', fontSize: 13, textDecoration: 'none', marginBottom: 8 }}>{l}</a>
                ))}
              </div>
              <div>
                <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legal</div>
                {['Privacy Policy', 'Terms & DNC', 'CASL Compliance'].map(l => (
                  <a key={l} href="#" style={{ display: 'block', color: '#94a3b8', fontSize: 13, textDecoration: 'none', marginBottom: 8 }}>{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24 }}>
            <p style={{ fontSize: 12, margin: 0 }}>© {new Date().getFullYear()} Hold Assistant</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
