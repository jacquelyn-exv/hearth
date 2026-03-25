'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SYSTEM_LIFESPANS: Record<string, number> = {
  roof: 27, hvac: 17, water_heater: 11, windows: 22,
  deck: 17, electrical: 35, plumbing: 50, siding: 30, landscaping: 20
}

const SYSTEM_ICONS: Record<string, string> = {
  roof: '🏠', hvac: '🌡️', water_heater: '🔥', windows: '🪟',
  deck: '🪵', electrical: '⚡', plumbing: '💧', siding: '🏗️', landscaping: '🌿'
}

function getCondition(installYear: number, systemType: string) {
  const age = new Date().getFullYear() - installYear
  const lifespan = SYSTEM_LIFESPANS[systemType] || 20
  const pct = age / lifespan
  if (pct > 1) return { label: 'Inspect', color: '#9B2C2C', bg: '#FDECEA', textColor: '#9B2C2C' }
  if (pct > 0.8) return { label: 'Priority', color: '#7A4A10', bg: '#FBF0DC', textColor: '#7A4A10' }
  if (pct > 0.6) return { label: 'Watch', color: '#3A7CA8', bg: '#E6F2F8', textColor: '#3A7CA8' }
  return { label: 'Good', color: '#3D7A5A', bg: '#EAF2EC', textColor: '#3D7A5A' }
}

const SEASONAL_ITEMS = [
  { icon: '🌿', title: 'Check gutters and downspouts', sub: 'Spring maintenance · Roof & drainage', urgency: 'soon', color: '#di-g' },
  { icon: '🌡️', title: 'Schedule HVAC tune-up', sub: 'Before cooling season · HVAC system', urgency: 'urgent', color: '#di-r' },
  { icon: '🪟', title: 'Inspect window seals', sub: 'Spring checklist · Windows', urgency: 'ok', color: '#di-s' },
  { icon: '🪵', title: 'Seal and stain deck', sub: 'Spring maintenance · Deck', urgency: 'soon', color: '#di-a' },
]

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [home, setHome] = useState<any>(null)
  const [systems, setSystems] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [score, setScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)

      const { data: homes } = await supabase
        .from('homes').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1)

      if (homes && homes.length > 0) {
        setHome(homes[0])
        const [{ data: systemData }, { data: jobData }, { data: scoreData }] = await Promise.all([
          supabase.from('home_systems').select('*').eq('home_id', homes[0].id),
          supabase.from('contractor_jobs').select('*').eq('home_id', homes[0].id).order('job_date', { ascending: false }),
          supabase.from('health_scores').select('*').eq('home_id', homes[0].id).order('calculated_at', { ascending: false }).limit(1)
        ])
        setSystems(systemData || [])
        setJobs(jobData || [])
        if (scoreData && scoreData.length > 0) setScore(scoreData[0])
      } else {
        window.location.replace('/onboarding')
        return
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
  const tabs = ['overview', 'systems', 'log', 'report']
  const tabLabels: Record<string, string> = { overview: 'Overview', systems: 'Systems', log: 'Contractor Log', report: 'Report Card' }

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{
        background: '#1E3A2F', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 28px', height: '58px',
        position: 'sticky', top: 0, zIndex: 200
      }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '21px', color: '#F8F4EE', textDecoration: 'none' }}>
          Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
        </a>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <a href="/log" style={{ color: 'rgba(248,244,238,0.65)', fontSize: '13px', textDecoration: 'none', padding: '6px 11px' }}>Contractor Log</a>
          <a href="/neighbors" style={{ color: 'rgba(248,244,238,0.65)', fontSize: '13px', textDecoration: 'none', padding: '6px 11px' }}>Neighbors</a>
          <a href="/guides" style={{ color: 'rgba(248,244,238,0.65)', fontSize: '13px', textDecoration: 'none', padding: '6px 11px' }}>Guides</a>
          <a href="/report" style={{ color: 'rgba(248,244,238,0.65)', fontSize: '13px', textDecoration: 'none', padding: '6px 11px' }}>Report Card</a>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid rgba(248,244,238,0.2)',
            color: 'rgba(248,244,238,0.7)', fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
            marginLeft: '8px'
          }}>Sign out</button>
        </div>
      </nav>

      {/* Dashboard header */}
      <div style={{ background: '#1E3A2F', padding: '28px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', paddingBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '4px' }}>Welcome back</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#F8F4EE', fontWeight: 400 }}>
              {home?.address}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.5)', marginTop: '3px' }}>
              {home?.city}, {home?.state} · Built {home?.year_built} · {home?.sqft?.toLocaleString()} sq ft · Spring 2026
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'none', border: 'none',
              color: activeTab === tab ? '#F8F4EE' : 'rgba(248,244,238,0.5)',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
              padding: '9px 14px 13px', cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #C47B2B' : '2px solid transparent',
              fontWeight: activeTab === tab ? 500 : 400,
              position: 'relative', bottom: '-1px', transition: 'color 0.2s'
            }}>{tabLabels[tab]}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '24px 28px 48px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
            <div>
              {/* Score row */}
              <div style={{
                background: '#fff', border: '1px solid rgba(30,58,47,0.11)',
                borderRadius: '16px', padding: '20px 22px', display: 'flex',
                alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '20px'
              }}>
                <div style={{ width: '80px', height: '80px', flexShrink: 0, position: 'relative' }}>
                  <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#EDE8E0" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#3D7A5A" strokeWidth="8"
                      strokeDasharray="201" strokeDashoffset={201 - (201 * scoreValue / 100)} strokeLinecap="round" />
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
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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

              {/* Exterior systems grid */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(30,58,47,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 500 }}>Home Systems</h4>
                  <button onClick={() => setActiveTab('systems')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#3D7A5A', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>View all →</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(30,58,47,0.08)' }}>
                  {systems.slice(0, 6).map(sys => {
                    const condition = sys.install_year ? getCondition(sys.install_year, sys.system_type) : { label: 'Unknown', color: '#8A8A82', bg: '#F5F5F5', textColor: '#8A8A82' }
                    return (
                      <div key={sys.id} style={{ background: '#fff', padding: '16px 14px', cursor: 'pointer' }}>
                        <div style={{ fontSize: '20px', marginBottom: '6px' }}>{SYSTEM_ICONS[sys.system_type] || '🔧'}</div>
                        <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '3px', textTransform: 'capitalize' }}>{sys.system_type.replace('_', ' ')}</div>
                        <div style={{ fontSize: '11px', color: condition.textColor, fontWeight: 500 }}>{condition.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Seasonal digest */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ background: '#1E3A2F', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#F8F4EE', fontWeight: 400 }}>Spring 2026 Checklist</h4>
                  <span style={{ fontSize: '12px', color: 'rgba(248,244,238,0.55)' }}>4 items</span>
                </div>
                {SEASONAL_ITEMS.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '13px 20px', borderBottom: i < SEASONAL_ITEMS.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0,
                      background: item.urgency === 'urgent' ? '#FDECEA' : item.urgency === 'soon' ? '#FBF0DC' : '#EAF2EC'
                    }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 400, marginBottom: '2px' }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: '#8A8A82' }}>{item.sub}</div>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px', flexShrink: 0,
                      background: item.urgency === 'urgent' ? '#FDECEA' : item.urgency === 'soon' ? '#FBF0DC' : '#EAF2EC',
                      color: item.urgency === 'urgent' ? '#9B2C2C' : item.urgency === 'soon' ? '#7A4A10' : '#3D7A5A'
                    }}>{item.urgency === 'urgent' ? 'Do now' : item.urgency === 'soon' ? 'This season' : 'Ongoing'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              {/* Quick actions */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '14px', color: '#1A1A18' }}>Quick actions</h4>
                {[
                  { label: '+ Log a contractor job', href: '/log' },
                  { label: '👥 Browse neighbor reviews', href: '/neighbors' },
                  { label: '📄 View report card', href: '/report' },
                  { label: '📖 Browse guides', href: '/guides' },
                ].map(action => (
                  <a key={action.label} href={action.href} style={{
                    display: 'block', padding: '9px 0', fontSize: '13px',
                    color: '#1E3A2F', textDecoration: 'none', fontWeight: 400,
                    borderBottom: '1px solid rgba(30,58,47,0.07)'
                  }}>{action.label}</a>
                ))}
              </div>

              {/* Home stats */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '14px' }}>Home summary</h4>
                {[
                  { label: 'Year built', value: home?.year_built },
                  { label: 'Home type', value: home?.home_type?.replace('_', ' ') },
                  { label: 'Square footage', value: home?.sqft ? `${home.sqft.toLocaleString()} sq ft` : '—' },
                  { label: 'Jobs logged', value: jobs.length },
                  { label: 'Systems tracked', value: systems.length },
                ].map(stat => (
                  <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: '13px', borderBottom: '1px solid rgba(30,58,47,0.07)' }}>
                    <span style={{ color: '#8A8A82' }}>{stat.label}</span>
                    <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{stat.value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Sponsored card */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8A8A82', padding: '6px 14px', background: '#EDE8E0', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>Sponsored</div>
                <div style={{ padding: '14px 16px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Is your roof ready for summer?</h5>
                  <p style={{ fontSize: '12px', color: '#8A8A82', lineHeight: 1.5, marginBottom: '10px' }}>Free inspection from certified roofing professionals in your area.</p>
                  <button style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Learn more</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEMS TAB */}
        {activeTab === 'systems' && (
          <div style={{ display: 'grid', gap: '14px' }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>Your Home Systems</h2>
            {systems.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid rgba(30,58,47,0.11)' }}>
                <p style={{ color: '#8A8A82' }}>No systems tracked yet.</p>
              </div>
            ) : systems.map(sys => {
              const condition = sys.install_year ? getCondition(sys.install_year, sys.system_type) : { label: 'Unknown', color: '#8A8A82', bg: '#F5F5F5', textColor: '#8A8A82' }
              const age = sys.install_year ? new Date().getFullYear() - sys.install_year : null
              const lifespan = SYSTEM_LIFESPANS[sys.system_type] || 20
              const pct = age ? Math.min(100, Math.round((age / lifespan) * 100)) : 0
              return (
                <div key={sys.id} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '28px' }}>{SYSTEM_ICONS[sys.system_type] || '🔧'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 500, textTransform: 'capitalize' }}>{sys.system_type.replace('_', ' ')}</h4>
                        <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: condition.bg, color: condition.textColor }}>{condition.label}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '8px' }}>
                        {age ? `${age} years old · Installed ${sys.install_year}` : 'Install year unknown'} · Expected lifespan: {lifespan} years
                      </p>
                      {age && (
                        <div style={{ height: '6px', background: '#EDE8E0', borderRadius: '3px', maxWidth: '300px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: condition.color, borderRadius: '3px' }} />
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#1E3A2F' }}>{age ? `${pct}%` : '—'}</div>
                      <div style={{ fontSize: '11px', color: '#8A8A82' }}>of lifespan used</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* LOG TAB */}
        {activeTab === 'log' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F' }}>Contractor History</h2>
              <a href="/log" style={{ background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}>+ Log a job</a>
            </div>
            {jobs.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid rgba(30,58,47,0.11)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                <p style={{ color: '#8A8A82' }}>No jobs logged yet. <a href="/log" style={{ color: '#1E3A2F', fontWeight: 500 }}>Log your first job →</a></p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {jobs.map(job => (
                  <div key={job.id} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>{job.company_name}</h4>
                      <p style={{ fontSize: '13px', color: '#8A8A82' }}>{job.service_description} · {job.job_date}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F' }}>{job.final_price ? `$${Number(job.final_price).toLocaleString()}` : '—'}</div>
                      <div style={{ color: '#C47B2B', fontSize: '12px' }}>{'★'.repeat(job.quality_rating)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REPORT TAB */}
        {activeTab === 'report' && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📄</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>Your Home Report Card</h2>
            <p style={{ fontSize: '14px', color: '#8A8A82', marginBottom: '24px' }}>View your full report card with system conditions, contractor history, and buyer/seller guides.</p>
            <a href="/report" style={{ display: 'inline-block', background: '#1E3A2F', color: '#F8F4EE', textDecoration: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>View full report card</a>
          </div>
        )}
      </div>
    </main>
  )
}