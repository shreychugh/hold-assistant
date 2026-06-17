'use client'

import { useEffect, useState, useCallback } from 'react'
import { Session } from '@/types/session'

const STATUS_COLORS: Record<string, string> = {
  initiated:  '#94a3b8',
  calling:    '#3b82f6',
  navigating: '#8b5cf6',
  waiting:    '#f59e0b',
  agent_found:'#10b981',
  connected:  '#16a34a',
  failed:     '#ef4444',
  cancelled:  '#94a3b8',
}

const ACTIVE_STATUSES = ['initiated', 'calling', 'navigating', 'waiting', 'agent_found']

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchSessions = useCallback(async () => {
    const res = await fetch('/api/admin/sessions')
    const data = await res.json()
    setSessions(data.sessions || [])
    setLastRefresh(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 8000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  async function cancelSession(sessionId: string) {
    setCancelling(sessionId)
    const res = await fetch('/api/session/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    if (res.ok) setCancelled(sessionId)
    await fetchSessions()
    setCancelling(null)
    setTimeout(() => setCancelled(null), 3000)
  }

  const active = sessions.filter(s => ACTIVE_STATUSES.includes(s.status))
  const recent = sessions.filter(s => !ACTIVE_STATUSES.includes(s.status))

  function timeAgo(ts: number) {
    const diff = Math.floor((Date.now() - ts) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  function SessionRow({ s }: { s: Session }) {
    const isActive = ACTIVE_STATUSES.includes(s.status)
    const isStale = isActive && (Date.now() - s.createdAt) > 90 * 60 * 1000
    return (
      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
        <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b', fontFamily: 'monospace' }}>
          {s.sessionId.slice(0, 8)}…
          {isStale && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#f59e0b', background: '#fef3c7', padding: '2px 6px', borderRadius: 4 }}>STALE</span>}
        </td>
        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{s.company.toUpperCase()}</td>
        <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{s.userPhone}</td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: `${STATUS_COLORS[s.status]}20`,
            color: STATUS_COLORS[s.status],
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {s.status.replace('_', ' ')}
          </span>
        </td>
        <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8' }}>
          {timeAgo(s.createdAt)}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {isActive && (
            cancelled === s.sessionId
              ? <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>Cancelled ✓</span>
              : <button
                  onClick={() => cancelSession(s.sessionId)}
                  disabled={cancelling === s.sessionId}
                  style={{
                    fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 8,
                    background: cancelling === s.sessionId ? '#f1f5f9' : '#fef2f2',
                    color: cancelling === s.sessionId ? '#94a3b8' : '#dc2626',
                    border: `1px solid ${cancelling === s.sessionId ? '#e2e8f0' : '#fecaca'}`,
                    cursor: cancelling === s.sessionId ? 'not-allowed' : 'pointer',
                  }}
                >
                  {cancelling === s.sessionId ? 'Cancelling…' : 'Cancel'}
                </button>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f8fafc', padding: 32 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Admin Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
            Auto-refreshes every 8s · Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <a href="/" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>← Back to app</a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Active now', value: active.length, color: '#f59e0b' },
          { label: 'Total sessions', value: sessions.length, color: '#2563eb' },
          { label: 'Connected', value: sessions.filter(s => s.status === 'connected').length, color: '#16a34a' },
          { label: 'Failed', value: sessions.filter(s => s.status === 'failed').length, color: '#ef4444' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${stat.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Active Sessions ({active.length})</span>
        </div>
        {loading ? (
          <p style={{ padding: 24, color: '#94a3b8', fontSize: 14 }}>Loading…</p>
        ) : active.length === 0 ? (
          <p style={{ padding: 24, color: '#94a3b8', fontSize: 14 }}>No active sessions right now.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Session ID', 'Company', 'Phone', 'Status', 'Started', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{active.map(s => <SessionRow key={s.sessionId} s={s} />)}</tbody>
          </table>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Recent Sessions ({recent.length})</span>
        </div>
        {recent.length === 0 ? (
          <p style={{ padding: 24, color: '#94a3b8', fontSize: 14 }}>No completed sessions yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Session ID', 'Company', 'Phone', 'Status', 'Started', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{recent.map(s => <SessionRow key={s.sessionId} s={s} />)}</tbody>
          </table>
        )}
      </div>

    </div>
  )
}
