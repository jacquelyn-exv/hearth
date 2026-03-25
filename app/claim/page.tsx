'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

export default function ClaimHome() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [homes, setHomes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [requesting, setRequesting] = useState<string | null>(null)
  const [requested, setRequested] = useState<string[]>([])
  const [message, setMessage] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      await loadHomes()
      setLoading(false)
    }
    load()
  }, [])

  const loadHomes = async () => {
    const { data } = await supabase
      .from('homes')
      .select('*, home_systems(count), health_scores(total_score)')
      .eq('status', 'for_transfer')
      .order('created_at', { ascending: false })
    setHomes(data || [])
  }

  const handleSearch = async () => {
    if (!search.trim()) { loadHomes(); return }
    const { data } = await supabase
      .from('homes')
      .select('*, home_systems(count), health_scores(total_score)')
      .eq('status', 'for_transfer')
      .or(`address.ilike.%${search}%,city.ilike.%${search}%,zip.ilike.%${search}%`)
    setHomes(data || [])
  }

  const handleRequest = async (home: any) => {
    setRequesting(home.id)
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return

    const { error } = await supabase.rpc('request_ownership_transfer', {
      p_home_id: home.id,
      p_to_email: u.email,
      p_initiated_by: 'buyer',
      p_message: message[home.id] || null
    })

    if (!error) {
      setRequested(prev => [...prev, home.id])
    }
    setRequesting(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#8A8A82' }}>Loading...</p>
    </div>
  )

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      <div style={{ background: '#1E3A2F', padding: '48px 32px 56px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '12px' }}>Property Transfer</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, color: '#F8F4EE', marginBottom: '12px' }}>Claim a home</h1>
          <p style={{ fontSize: '14px', color: 'rgba(248,244,238,0.6)', lineHeight: 1.7, maxWidth: '520px' }}>
            These homes have been made available for transfer by their previous owners. Claim one to inherit its full maintenance history, system records, and contractor log.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 28px 64px' }}>

        {/* Search */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by address, city, or ZIP..."
            style={{
              flex: 1, padding: '11px 16px',
              border: '1px solid rgba(30,58,47,0.2)', borderRadius: '10px',
              fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
              outline: 'none', background: '#fff', color: '#1A1A18'
            }}
          />
          <button onClick={handleSearch} style={{
            background: '#1E3A2F', color: '#F8F4EE', border: 'none',
            padding: '11px 20px', borderRadius: '10px', fontSize: '14px',
            fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
          }}>Search</button>
        </div>

        {/* Results */}
        {homes.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏠</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>
              {search ? 'No homes found matching your search' : 'No homes available for transfer right now'}
            </h3>
            <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.7 }}>
              Homes appear here when their owners mark them as available for transfer. If you recently purchased a home, you can also request transfer from your onboarding screen.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#8A8A82' }}>{homes.length} home{homes.length !== 1 ? 's' : ''} available for transfer</p>
            {homes.map(home => {
              const score = home.health_scores?.[0]?.total_score || null
              const systemCount = home.home_systems?.[0]?.count || 0
              const isRequested = requested.includes(home.id)

              return (
                <div key={home.id} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>{home.address}</h3>
                      <p style={{ fontSize: '13px', color: '#8A8A82' }}>
                        {home.city}{home.state ? `, ${home.state}` : ''}{home.zip ? ` ${home.zip}` : ''}
                      </p>
                    </div>
                    {score && (
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                          <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="28" cy="28" r="22" fill="none" stroke="#EDE8E0" strokeWidth="6" />
                            <circle cx="28" cy="28" r="22" fill="none" stroke="#3D7A5A" strokeWidth="6"
                              strokeDasharray="138" strokeDashoffset={138 - (138 * score / 100)} strokeLinecap="round" />
                          </svg>
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '14px', color: '#1E3A2F', fontWeight: 600 }}>{score}</div>
                        </div>
                        <div style={{ fontSize: '10px', color: '#8A8A82', marginTop: '4px' }}>Health score</div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    {[
                      { label: 'Year built', value: home.year_built || '—' },
                      { label: 'Home type', value: home.home_type?.replace('_', ' ') || '—' },
                      { label: 'Systems tracked', value: systemCount },
                      { label: 'Square footage', value: home.sqft ? `${home.sqft.toLocaleString()} sq ft` : '—' },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: '#F8F4EE', borderRadius: '8px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>{stat.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', textTransform: 'capitalize' }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#EAF2EC', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#3D7A5A', lineHeight: 1.6 }}>
                      ✓ Claiming this home gives you full access to its maintenance history, system records, contractor log, and health score. The previous owner will retain view-only access.
                    </div>
                  </div>

                  {!isRequested ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <textarea
                        value={message[home.id] || ''}
                        onChange={e => setMessage(prev => ({ ...prev, [home.id]: e.target.value }))}
                        placeholder="Optional: add a note to the current owner (e.g. closing date, realtor name)"
                        style={{
                          width: '100%', padding: '10px 14px', minHeight: '70px',
                          border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px',
                          fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
                          outline: 'none', background: '#fff', color: '#1A1A18',
                          resize: 'vertical', boxSizing: 'border-box' as const
                        }}
                      />
                      <button
                        onClick={() => handleRequest(home)}
                        disabled={requesting === home.id}
                        style={{
                          width: '100%', background: '#C47B2B', color: '#fff',
                          border: 'none', padding: '12px', borderRadius: '10px',
                          fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif"
                        }}
                      >{requesting === home.id ? 'Requesting...' : 'Request ownership transfer'}</button>
                    </div>
                  ) : (
                    <div style={{ background: '#EAF2EC', borderRadius: '10px', padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#3D7A5A', marginBottom: '4px' }}>🔑 Transfer requested</div>
                      <div style={{ fontSize: '12px', color: '#8A8A82' }}>The current owner has been notified. Ownership transfers automatically after 30 days if no response.</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <footer style={{ background: '#1E3A2F', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#F8F4EE', marginBottom: '8px' }}>
          H<em style={{ color: '#C47B2B', fontStyle: 'italic' }}>e</em>arth
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(248,244,238,0.4)' }}>Know your home. Own your home.</p>
      </footer>
    </main>
  )
}
