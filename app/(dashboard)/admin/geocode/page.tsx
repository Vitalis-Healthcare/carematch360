"use client"
import { useState, useEffect } from 'react'

export default function GeocodePage() {
  const [stats, setStats] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [type, setType] = useState<'all' | 'providers' | 'clients'>('all')
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    fetch('/api/admin/geocode').then(r => r.json()).then(setStats)
  }, [])

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  async function runGeocode() {
    setRunning(true); setResults(null); setError(''); setElapsed(0)
    try {
      const res = await fetch('/api/admin/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (data.success) {
        setResults(data.results)
        // Refresh stats
        const s = await fetch('/api/admin/geocode').then(r => r.json())
        setStats(s)
      } else {
        setError(data.error)
      }
    } catch (e: any) {
      setError(e.message)
    }
    setRunning(false)
  }

  const S: any = {
    wrap: { minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Segoe UI', sans-serif", padding: '28px 32px' },
    card: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '24px 28px', marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    title: { fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 },
    sub: { fontSize: 14, color: '#64748B', marginBottom: 24 },
    statGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 },
    stat: (color: string) => ({ background: '#fff', border: '1px solid #E2E8F0', borderTop: `3px solid ${color}`, borderRadius: 11, padding: '16px 18px', textAlign: 'center' as const }),
    statNum: { fontSize: 28, fontWeight: 700, color: '#0F172A', fontVariantNumeric: 'tabular-nums' },
    statLabel: { fontSize: 12, color: '#64748B', marginTop: 3 },
    label: { fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: 6 },
    select: { padding: '9px 14px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 14, outline: 'none', background: '#fff', marginRight: 12, fontFamily: 'inherit' },
    btn: (disabled: boolean) => ({ padding: '10px 28px', background: disabled ? '#94A3B8' : 'linear-gradient(135deg,#0B3D5C,#0E9FA3)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }),
    resultCard: (success: boolean) => ({ background: success ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${success ? '#A7F3D0' : '#FECACA'}`, borderRadius: 10, padding: '16px 20px', marginTop: 16 }),
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`

  return (
    <div style={S.wrap}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <a href="/admin/users" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 500 }}>← Admin</a>
          <div style={{ ...S.title, marginTop: 8 }}>📍 Geocode Addresses</div>
          <div style={S.sub}>Convert provider and client addresses into precise map coordinates using the Mapbox Geocoding API. Run this after importing from AxisCare or adding new records.</div>
        </div>

        {/* Current stats */}
        {stats && (
          <div style={S.card}>
            <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 16, fontSize: 15 }}>Current Geocoding Status</div>
            <div style={S.statGrid}>
              <div style={S.stat('#10B981')}>
                <div style={S.statNum}>{stats.providers.with_coords}</div>
                <div style={S.statLabel}>Providers geocoded</div>
              </div>
              <div style={S.stat('#F59E0B')}>
                <div style={S.statNum}>{stats.providers.missing}</div>
                <div style={S.statLabel}>Providers missing coords</div>
              </div>
              <div style={S.stat('#3B82F6')}>
                <div style={S.statNum}>{stats.clients.with_coords}</div>
                <div style={S.statLabel}>Clients geocoded</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#64748B', background: '#F8FAFC', borderRadius: 8, padding: '10px 14px' }}>
              <strong>{stats.providers.total}</strong> total providers · <strong>{stats.clients.total}</strong> total clients
              · <strong>{stats.providers.missing + stats.clients.missing}</strong> records need geocoding
            </div>
          </div>
        )}

        {/* Run geocoder */}
        <div style={S.card}>
          <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 6, fontSize: 15 }}>Run Geocoder</div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
            This will geocode <strong>all records</strong> (not just missing ones), so coordinates get refreshed with the most accurate data. 
            Estimate: ~{Math.ceil(((stats?.providers.total ?? 0) + (stats?.clients.total ?? 0)) * 0.12 / 60)} minutes for all records.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <label style={S.label}>Geocode:</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <select value={type} onChange={e => setType(e.target.value as any)} disabled={running} style={S.select}>
              <option value="all">All (Providers + Clients)</option>
              <option value="providers">Providers only</option>
              <option value="clients">Clients only</option>
            </select>
            <button onClick={runGeocode} disabled={running} style={S.btn(running)}>
              {running ? `⏳ Running… ${fmt(elapsed)}` : '▶ Run Geocoder'}
            </button>
          </div>

          {running && (
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 9, padding: '14px 18px' }}>
              <div style={{ fontSize: 13.5, color: '#0369A1', fontWeight: 500, marginBottom: 4 }}>⏳ Geocoding in progress…</div>
              <div style={{ fontSize: 13, color: '#0369A1' }}>
                Processing records at ~8/sec. Do not close this tab. This may take several minutes for large datasets.
              </div>
              <div style={{ marginTop: 10, height: 4, background: '#BAE6FD', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#0EA5E9', borderRadius: 2, animation: 'progress 2s ease infinite', width: '60%' }}/>
              </div>
            </div>
          )}

          {error && (
            <div style={S.resultCard(false)}>
              <div style={{ fontWeight: 600, color: '#DC2626', marginBottom: 4 }}>Error</div>
              <div style={{ fontSize: 13, color: '#DC2626' }}>{error}</div>
            </div>
          )}

          {results && (
            <div style={S.resultCard(true)}>
              <div style={{ fontWeight: 700, color: '#065F46', fontSize: 15, marginBottom: 12 }}>✅ Geocoding Complete!</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {['providers', 'clients'].map(k => (
                  <div key={k} style={{ background: '#fff', border: '1px solid #A7F3D0', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 6, fontSize: 13, textTransform: 'capitalize' as const }}>{k}</div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                      <div>✅ Updated: <strong>{results[k].updated}</strong></div>
                      <div>⏭️ Skipped: <strong>{results[k].skipped}</strong></div>
                      {results[k].failed > 0 && <div style={{ color: '#DC2626' }}>❌ Failed: <strong>{results[k].failed}</strong></div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, fontSize: 13, color: '#065F46' }}>
                The Network Map will now show accurate locations. <a href="/map2" style={{ color: '#059669', fontWeight: 600 }}>View Map →</a>
              </div>
            </div>
          )}
        </div>

        {/* How it works */}
        <div style={{ ...S.card, background: '#FAFAFA' }}>
          <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 10, fontSize: 14 }}>How it works</div>
          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.8 }}>
            <div>1. Reads each provider/client's street address, city and state from the database</div>
            <div>2. Sends it to the Mapbox Geocoding API (free with your token, up to 100k/month)</div>
            <div>3. If a full address match is found, uses that — otherwise falls back to city-level coordinates</div>
            <div>4. Saves the precise lat/lng back to the database</div>
            <div style={{ marginTop: 8, color: '#94A3B8' }}>Run this any time you import new records from AxisCare or add providers manually.</div>
          </div>
        </div>

      </div>
      <style>{`@keyframes progress { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}</style>
    </div>
  )
}
