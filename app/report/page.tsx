'use client'

import Nav from '@/components/Nav'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SYSTEM_LIFESPANS: Record<string, number> = {
  roof: 27, hvac: 17, water_heater: 11, windows: 22,
  deck: 17, electrical: 35, plumbing: 50, siding: 30,
  doors: 30, gutters: 20, driveway: 25, fencing: 20,
  chimney: 50, sump_pump: 10
}

const SYSTEM_ICONS: Record<string, string> = {
  roof: '🏠', hvac: '🌡️', water_heater: '🔥', windows: '🪟',
  deck: '🪵', electrical: '⚡', plumbing: '💧', siding: '🏗️',
  doors: '🚪', gutters: '🌧️', driveway: '🛣️', fencing: '🔒',
  chimney: '🔥', sump_pump: '💦', landscaping: '🌿'
}

function getCondition(system: any) {
  const flags = []
  if (system.storm_damage_unaddressed) flags.push('storm')
  if (system.known_issues) flags.push('issues')

  if (!system.install_year) return { label: 'Unknown', color: '#8A8A82', bg: '#F5F5F5' }
  const age = new Date().getFullYear() - system.install_year
  const lifespan = SYSTEM_LIFESPANS[system.system_type] || 20
  const pct = age / lifespan

  if (flags.length > 0 || pct > 1) return { label: 'Inspect', color: '#9B2C2C', bg: '#FDECEA' }
  if (pct > 0.8) return { label: 'Priority', color: '#7A4A10', bg: '#FBF0DC' }
  if (pct > 0.6) return { label: 'Watch', color: '#3A7CA8', bg: '#E6F2F8' }
  return { label: 'Good', color: '#3D7A5A', bg: '#EAF2EC' }
}

export default function ReportCard() {
  const [user, setUser] = useState<any>(null)
  const [home, setHome] = useState<any>(null)
  const [details, setDetails] = useState<any>(null)
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

      const [{ data: detailData }, { data: systemData }, { data: jobData }, { data: scoreData }] = await Promise.all([
        supabase.from('home_details').select('*').eq('home_id', homes[0].id).single(),
        supabase.from('home_systems').select('*').eq('home_id', homes[0].id),
        supabase.from('contractor_jobs').select('*').eq('home_id', homes[0].id).order('job_date', { ascending: false }),
        supabase.from('health_scores').select('*').eq('home_id', homes[0].id).order('calculated_at', { ascending: false }).limit(1)
      ])

      setDetails(detailData)
      setSystems(systemData || [])
      setJobs(jobData || [])
      if (scoreData && scoreData.length > 0) setScore(scoreData[0])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#8A8A82' }}>Generating your report card...</p>
    </div>
  )

  if (!home) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#F8F4EE' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#8A8A82', marginBottom: '16px' }}>No home profile found.</p>
        <a href="/onboarding" style={{ color: '#1E3A2F', fontWeight: 500 }}>Set up your home</a>
      </div>
    </div>
  )

  const scoreValue = score?.total_score || 0
  const age = home.year_built ? new Date().getFullYear() - home.year_built : null
  const inspectSystems = systems.filter(s => getCondition(s).label === 'Inspect')
  const prioritySystems = systems.filter(s => getCondition(s).label === 'Priority')
  const watchSystems = systems.filter(s => getCondition(s).label === 'Watch')

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

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 28px 64px' }}>

        {/* Cover */}
        <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '36px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '10px' }}>Home Report Card</div>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', color: '#F8F4EE', fontWeight: 400, marginBottom: '6px' }}>{home.address}</h1>
              <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.55)', marginBottom: '20px' }}>
                {home.city}, {home.state} {home.zip} · Built {home.year_built} · {home.sqft?.toLocaleString()} sq ft
              </p>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Age', value: age ? `${age} years` : '—' },
                  { label: 'Bedrooms', value: details?.bedrooms || '—' },
                  { label: 'Bathrooms', value: details?.bathrooms || '—' },
                  { label: 'Garage', value: details?.garage || '—' },
                  { label: 'Jobs logged', value: jobs.length },
                  { label: 'Systems tracked', value: systems.length },
                ].map(stat => (
                  <div key={stat.label}>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE', textTransform: 'capitalize' }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.45)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
              <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <circle cx="55" cy="55" r="46" fill="none" stroke="#6AAF8A" strokeWidth="10"
                  strokeDasharray="289" strokeDashoffset={289 - (289 * scoreValue / 100)} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '30px', color: '#F8F4EE', fontWeight: 600 }}>{scoreValue}</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(inspectSystems.length > 0 || prioritySystems.length > 0) && (
          <div style={{ background: '#FDECEA', border: '1px solid rgba(139,58,42,0.2)', borderRadius: '16px', padding: '20px 22px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#9B2C2C', marginBottom: '10px' }}>⚠️ Items requiring attention</h3>
            {[...inspectSystems, ...prioritySystems].map(sys => (
              <div key={sys.id} style={{ fontSize: '13px', color: '#7A3A2A', marginBottom: '4px' }}>
                · {sys.system_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                {sys.storm_damage_unaddressed ? ' — Storm damage unaddressed' : ''}
                {sys.known_issues ? ` — ${sys.known_issues}` : ''}
                {sys.install_year ? ` — Installed ${sys.install_year}` : ''}
              </div>
            ))}
          </div>
        )}

        {/* Health score breakdown */}
        <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '22px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F', marginBottom: '16px' }}>Health Score Breakdown</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {[
              { label: 'System Risk', value: score?.system_risk_score, weight: '35%' },
              { label: 'Maintenance', value: score?.maintenance_score, weight: '30%' },
              { label: 'Value Protection', value: score?.value_protection_score, weight: '20%' },
              { label: 'Seasonal Readiness', value: score?.seasonal_readiness_score, weight: '15%' },
            ].map(dim => (
              <div key={dim.label} style={{ background: '#F8F4EE', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', color: '#1E3A2F', marginBottom: '4px' }}>{dim.value}</div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '2px' }}>{dim.label}</div>
                <div style={{ fontSize: '11px', color: '#8A8A82' }}>{dim.weight} of score</div>
              </div>
            ))}
          </div>
        </div>

        {/* Home facts */}
        {details && (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>Home Facts</h2>
            </div>
            <div style={{ padding: '8px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                {[
                  { label: 'Home type', value: home.home_type?.replace('_', ' ') },
                  { label: 'Year built', value: home.year_built },
                  { label: 'Square footage', value: home.sqft ? `${home.sqft.toLocaleString()} sq ft` : '—' },
                  { label: 'Bedrooms', value: details.bedrooms },
                  { label: 'Bathrooms', value: details.bathrooms },
                  { label: 'Basement', value: details.basement },
                  { label: 'Garage', value: details.garage },
                  { label: 'Driveway', value: details.driveway_type },
                  { label: 'Pool', value: details.pool ? 'Yes' : 'No' },
                  { label: 'HOA', value: details.hoa ? 'Yes' : 'No' },
                  { label: 'Fireplace', value: details.has_fireplace ? 'Yes' : 'No' },
                  { label: 'Sump pump', value: details.has_sump_pump ? 'Yes' : 'No' },
                  { label: 'Irrigation', value: details.has_irrigation ? 'Yes' : 'No' },
                  { label: 'Generator', value: details.has_generator ? 'Yes' : 'No' },
                ].map(fact => (
                  <div key={fact.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 22px', borderBottom: '1px solid rgba(30,58,47,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#8A8A82' }}>{fact.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>{fact.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System condition summary */}
        {systems.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>System & Product Condition</h2>
            </div>
            <div style={{ padding: '8px 0' }}>
              {systems.map(sys => {
                const condition = getCondition(sys)
                const age = sys.install_year ? new Date().getFullYear() - sys.install_year : null
                const lifespan = SYSTEM_LIFESPANS[sys.system_type] || 20
                const pct = age ? Math.min(100, Math.round((age / lifespan) * 100)) : 0
                return (
                  <div key={sys.id} style={{ padding: '14px 22px', borderBottom: '1px solid rgba(30,58,47,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <span style={{ fontSize: '20px' }}>{SYSTEM_ICONS[sys.system_type] || '🔧'}</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize', marginBottom: '2px' }}>
                            {sys.system_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()).replace('Hvac', 'HVAC')}
                          </div>
                          <div style={{ fontSize: '12px', color: '#8A8A82' }}>
                            {sys.material || sys.product_type ? `${sys.material || sys.product_type} · ` : ''}
                            {age ? `${age} years old · Installed ${sys.install_year}` : 'Install year unknown'}
                            {sys.ever_replaced ? ' · Previously replaced' : ''}
                            {sys.storm_damage_unaddressed ? ' · ⚠️ Storm damage unaddressed' : ''}
                          </div>
                          {sys.known_issues && (
                            <div style={{ fontSize: '12px', color: '#8B3A2A', marginTop: '2px' }}>Issues noted: {sys.known_issues}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        {age && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{pct}% of lifespan</div>
                            <div style={{ width: '80px', height: '4px', background: '#EDE8E0', borderRadius: '2px', marginTop: '4px' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: condition.color, borderRadius: '2px' }} />
                            </div>
                          </div>
                        )}
                        <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: condition.bg, color: condition.color }}>
                          {condition.label}
                        </span>
                      </div>
                    </div>
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
                    <div style={{ fontSize: '12px', color: '#8A8A82' }}>
                      {job.service_description} · {job.system_type?.replace(/_/g, ' ')} · {job.job_date}
                    </div>
                    {job.tags && job.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {job.tags.map((tag: string) => (
                          <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>
                      {job.final_price ? `$${Number(job.final_price).toLocaleString()}` : '—'}
                    </div>
                    <div style={{ color: '#C47B2B', fontSize: '12px' }}>{'★'.repeat(job.quality_rating)}</div>
                    <div style={{ fontSize: '11px', color: job.would_refer === 'yes' ? '#3D7A5A' : job.would_refer === 'no' ? '#9B2C2C' : '#7A4A10' }}>
                      {job.would_refer === 'yes' ? '✓ Would refer' : job.would_refer === 'no' ? '✕ Would not refer' : '~ With reservations'}
                    </div>
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
                'Get independent inspection of flagged systems',
                'Check for storm damage history on roof and siding'
              ]
            },
            {
              title: 'For Sellers',
              icon: '🔑',
              points: [
                'Address Inspect and Priority items before listing',
                'Document all recent contractor work with receipts',
                'Share this report card with serious buyers',
                'Systems in Good condition are a selling advantage',
                'Recent maintenance history increases buyer confidence',
                'Get roof and HVAC inspected if over 10 years old'
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