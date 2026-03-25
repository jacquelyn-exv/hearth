'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [home, setHome] = useState<any>(null)
  const [score, setScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)

      const { data: homes } = await supabase
        .from('homes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (homes && homes.length > 0) {
        setHome(homes[0])
        const { data: scores } = await supabase
          .from('health_scores')
          .select('*')
          .eq('home_id', homes[0].id)
          .order('calculated_at', { ascending: false })
          .limit(1)
        if (scores && scores.length > 0) setScore(scores[0])
      }

      setLoading(false)
    }
    loadData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return (
    <div style={{ background: '#F8F4EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#8A8A82' }}>Loading your home...</p>
    </div>
  )

  const scoreValue = score?.total_score || 0

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{
        background: '#1E3A2F', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 28px', height: '58px',
        position: 'sticky', top: 0, zIndex: 200
      }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '21px', color: '#F8F4EE' }}>
          Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'rgba(248,244,238,0.5)' }}>{user?.email}</span>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid rgba(248,244,238,0.2)',
            color: 'rgba(248,244,238,0.7)', fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer'
          }}>Sign out</button>
        </div>
      </nav>

      {/* Dashboard header */}
      <div style={{ background: '#1E3A2F', padding: '28px 28px 0' }}>
        <div style={{ paddingBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '4px' }}>Welcome back</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#F8F4EE', fontWeight: 400 }}>
            {home ? home.address : 'My Home'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.5)', marginTop: '3px' }}>
            {home ? `${home.city}, ${home.state} · Built ${home.year_built} · ${home.sqft?.toLocaleString()} sq ft` : user?.email}
          </div>
        </div>
      </div>

      {/* Dashboard body */}
      <div style={{ padding: '24px 28px 48px', maxWidth: '1100px', margin: '0 auto' }}>

        {!home && (
          <div style={{
            background: '#fff', border: '1px solid rgba(30,58,47,0.11)',
            borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '24px'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏠</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>
              Set up your home profile
            </h2>
            <p style={{ fontSize: '14px', color: '#8A8A82', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 24px' }}>
              Tell us about your home to get your health score, seasonal checklist, and personalized recommendations.
            </p>
            <button onClick={() => window.location.href = '/onboarding'} style={{
              background: '#C47B2B', color: '#fff', border: 'none',
              padding: '12px 28px', borderRadius: '10px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
              fontWeight: 500, cursor: 'pointer'
            }}>Set up my home</button>
          </div>
        )}

        {/* Health score */}
        {home && (
          <div style={{
            background: '#fff', border: '1px solid rgba(30,58,47,0.11)',
            borderRadius: '16px', padding: '20px 22px', display: 'flex',
            alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '22px'
          }}>
            <div style={{ width: '80px', height: '80px', flexShrink: 0, position: 'relative' }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="#EDE8E0" strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="#3D7A5A" strokeWidth="8"
                  strokeDasharray="201"
                  strokeDashoffset={201 - (201 * scoreValue / 100)}
                  strokeLinecap="round" />
              </svg>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '20px', color: '#1E3A2F', fontWeight: 600
              }}>{scoreValue}</div>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, marginBottom: '4px' }}>
                {scoreValue >= 80 ? 'Your home is in great shape' : scoreValue >= 60 ? 'Your home is doing well' : 'Your home needs attention'}
              </h3>
              <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '10px' }}>Home health score · Updated today</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'System Risk', value: score?.system_risk_score },
                  { label: 'Maintenance', value: score?.maintenance_score },
                  { label: 'Value Protection', value: score?.value_protection_score },
                  { label: 'Seasonal', value: score?.seasonal_readiness_score },
                ].map(pill => (
                  <div key={pill.label} style={{
                    fontSize: '11px', padding: '3px 9px', borderRadius: '20px',
                    background: '#EAF2EC', color: '#3D7A5A', border: '1px solid rgba(30,58,47,0.14)'
                  }}>{pill.label}: {pill.value}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { icon: '📋', title: 'Contractor Log', desc: 'Record jobs and pricing', href: '/log' },
            { icon: '👥', title: 'Neighbor Network', desc: 'Find trusted contractors', href: '/neighbors' },
            { icon: '📖', title: 'Guides', desc: 'Expert home advice', href: '/guides' },
            { icon: '📄', title: 'Report Card', desc: 'Share your home history', href: '/report' },
          ].map(item => (
            <a key={item.title} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#fff', border: '1px solid rgba(30,58,47,0.11)',
                borderRadius: '16px', padding: '20px', cursor: 'pointer'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>{item.icon}</div>
                <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A18', marginBottom: '4px' }}>{item.title}</h4>
                <p style={{ fontSize: '12px', color: '#8A8A82' }}>{item.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}