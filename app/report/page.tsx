'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SYSTEM_LIFESPANS: Record<string, number> = {
  roof: 27, hvac: 17, water_heater: 11, windows: 22,
  deck: 17, electrical: 35, plumbing: 50, siding: 30, landscaping: 20
}

function getCondition(installYear: number, systemType: string) {
  const age = new Date().getFullYear() - installYear
  const lifespan = SYSTEM_LIFESPANS[systemType] || 20
  const pct = age / lifespan
  if (pct > 1) return { label: 'Inspect', color: '#8B3A2A', bg: '#FDECEA' }
  if (pct > 0.8) return { label: 'Priority', color: '#7A4A10', bg: '#FBF0DC' }
  if (pct > 0.6) return { label: 'Watch', color: '#3A7CA8', bg: '#E6F2F8' }
  return { label: 'Good', color: '#3D7A5A', bg: '#EAF2EC' }
}

export default function ReportCard() {
  const [user, setUser] = useState<any>(null)
  const [home, setHome] = useState<any>(null)
  const [systems, setSystems] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [score, setScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)

      const { data: homes } = await supabase.from('homes').select('*').eq('user_id', user.id).limit(1)
      if (!homes || homes.length === 0) { setLoading(false); return }
      setHome(homes[0])

      const [{ data: systemData }, { data: jobData }, { data: scoreData }] = await Promise.all([
        supabase.from('home_systems').select('*').eq('home_id', homes[0].id),
        supabase.from('contractor_jobs').select('*').eq('home_id', homes[0].id).order('job_date', { ascending: false }),
        supabase.from('health_scores').select('*').eq('home_id', homes[0].id).order('calculated_at', { ascending: false }).limit(1)
      ])

      setSystems(systemData || [])
      setJobs(jobData || [])
      if (scoreData && scoreData.length > 0) setScore(scoreData[0])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}><p style={{ color: '#8A8A82' }}>Generating your report card...</p></div>

  if (!home) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#F8F4EE' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#8A8A82', marginBottom: '16px' }}>No home profile found.</p>
        <a href="/onboarding" style={{ color: '#1E3A2F', fontWeight: 500 }}>Set up your home</a>
      </div>
    </div>
  )

  const scoreValue = score?.total_score || 0
  const yearsOwned = home.year_built ? new Date().getFullYear() - home.year_built : null

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: '#1E3A2F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: '58px', position: 'sticky', top: 0, zIndex: 200 }}>
        <a href="/dashboard" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '21px', color: '#F8F4EE', textDecoration: 'none' }}>
          Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
        </a>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => window.print()} style={{
            background: 'none', border: '1px solid rgba(248,244,238,0.25)',
            color: 'rgba(248,244,238,0.8)', padding: '6px 14px', borderRadius: '6px',
            fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
          }}>Print / Save PDF</button>
          <a href="/dashboard" style={{ color: 'rgba(248,244,238,0.65)', fontSize: '13px', textDecoration: 'none' }}>Dashboard</a>
        </div>
      </nav>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 28px 64px' }}>

        {/* Cover */}
        <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '36px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '8px' }}>Home Report Card</div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', color: '#F8F4EE', fontWeight: 400, marginBottom: '6px' }}>{home.address}</h1>
            <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.55)' }}>
              {home.city}, {home.state} {home.zip} · Built {home.year_built} · {home.sqft?.toLocaleString()} sq ft
            </p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
              {[
                { label: 'Years old', value: yearsOwned || '—' },
                { label: 'Jobs logged', value: jobs.length },
                { label: 'Systems tracked', value: systems.length },
              ].map(stat => (
                <div key={stat.label}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#F8F4EE' }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.45)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
            <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#6AAF8A" strokeWidth="10"
                strokeDasharray="264" strokeDashoffset={264 - (264 * scoreValue / 100)} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#F8F4EE', fontWeight: 600 }}>{scoreValue}</div>
          </div>
        </div>

        {/* System condition summary */}
        {systems.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>System Condition Summary</h2>
            </div>
            <div style={{ padding: '8px 0' }}>
              {systems.map(sys => {
                const condition = sys.install_year ? getCondition(sys.install_year, sys.system_type) : { label: 'Unknown', color: '#8A8A82', bg: '#F5F5F5' }
                const age = sys.install_year ? new Date().getFullYear() - sys.install_year : null
                const lifespan = SYSTEM_LIFESPANS[sys.system_type] || 20
                const pct = age ? Math.min(100, Math.round((age / lifespan) * 100)) : 0
                return (
                  <div key={sys.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 22px', borderBottom: '1px solid rgba(30,58,47,0.05)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize', marginBottom: '4px' }}>{sys.system_type.replace('_', ' ')}</div>
                      <div style={{ fontSize: '12px', color: '#8A8A82' }}>
                        {age ? `${age} years old · Installed ${sys.install_year}` : 'Install year unknown'}
                      </div>
                      {age && (
                        <div style={{ marginTop: '6px', height: '4px', background: '#EDE8E0', borderRadius: '2px', maxWidth: '200px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: condition.color, borderRadius: '2px' }} />
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: condition.bg, color: condition.color, flexShrink: 0 }}>
                      {condition.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Contractor history */}
        {jobs.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>Contractor Work History</h2>
            </div>
            <div style={{ padding: '8px 0' }}>
              {jobs.map(job => (
                <div key={job.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 22px', borderBottom: '1px solid rgba(30,58,47,0.05)', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>{job.company_name}</div>
                    <div style={{ fontSize: '12px', color: '#8A8A82' }}>{job.service_description} · {job.job_date}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>
                      {job.final_price ? `$${Number(job.final_price).toLocaleString()}` : '—'}
                    </div>
                    <div style={{ color: '#C47B2B', fontSize: '12px' }}>{'★'.repeat(job.quality_rating)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buyer / Seller guides */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {[
            {
              title: 'For Buyers',
              icon: '🏠',
              points: [
                'Request maintenance records before closing',
                'Flag any systems past 80% of expected lifespan',
                'Use deferred maintenance as negotiation leverage',
                'Ask for contractor warranties on recent work',
                'Get independent inspection of flagged systems'
              ]
            },
            {
              title: 'For Sellers',
              icon: '🔑',
              points: [
                'Address Priority and Inspect items before listing',
                'Document all recent contractor work with receipts',
                'Share this report card with serious buyers',
                'Systems in Good condition are a selling advantage',
                'Recent maintenance history increases buyer confidence'
              ]
            }
          ].map(guide => (
            <div key={guide.title} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '22px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>{guide.icon}</div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1E3A2F', marginBottom: '14px' }}>{guide.title}</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {guide.points.map(point => (
                  <li key={point} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#4A4A44', lineHeight: 1.6, marginBottom: '8px' }}>
                    <span style={{ color: '#6AAF8A', flexShrink: 0 }}>✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid rgba(30,58,47,0.1)' }}>
          <p style={{ fontSize: '12px', color: '#8A8A82' }}>
            Generated by Hearth · hearth-navy.vercel.app · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </main>
  )
}