'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

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
  chimney: '🔥', sump_pump: '💦'
}

function getCondition(sys: any) {
  if (sys.storm_damage_unaddressed || sys.known_issues) {
    return { label: 'Inspect', color: '#9B2C2C', bg: '#FDECEA', textColor: '#9B2C2C' }
  }
  const effectiveYear = sys.replacement_year || sys.install_year
  if (!effectiveYear) return { label: 'Unknown', color: '#8A8A82', bg: '#F5F5F5', textColor: '#8A8A82' }
  const age = new Date().getFullYear() - effectiveYear
  const lifespan = SYSTEM_LIFESPANS[sys.system_type] || 20
  const pct = age / lifespan
  if (pct > 1) return { label: 'Inspect', color: '#9B2C2C', bg: '#FDECEA', textColor: '#9B2C2C' }
  if (pct > 0.8) return { label: 'Priority', color: '#7A4A10', bg: '#FBF0DC', textColor: '#7A4A10' }
  if (pct > 0.6) return { label: 'Watch', color: '#3A7CA8', bg: '#E6F2F8', textColor: '#3A7CA8' }
  return { label: 'Good', color: '#3D7A5A', bg: '#EAF2EC', textColor: '#3D7A5A' }
}

export default function ReportCard() {
  const [home, setHome] = useState<any>(null)
  const [details, setDetails] = useState<any>(null)
  const [systems, setSystems] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [score, setScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: homes } = await supabase
        .from('homes').select('*').eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false }).limit(1)

      if (!homes || homes.length === 0) { window.location.href = '/onboarding'; return }

      setHome(homes[0])
      const [{ data: d }, { data: s }, { data: j }, { data: sc }] = await Promise.all([
        supabase.from('home_details').select('*').eq('home_id', homes[0].id).single(),
        supabase.from('home_systems').select('*').eq('home_id', homes[0].id),
        supabase.from('contractor_jobs').select('*').eq('home_id', homes[0].id).order('job_date', { ascending: false }),
        supabase.from('health_scores').select('*').eq('home_id', homes[0].id).order('calculated_at', { ascending: false }).limit(1)
      ])
      setDetails(d)
      setSystems(s || [])
      setJobs(j || [])
      if (sc && sc.length > 0) setScore(sc[0])
      setLoading(false)
    }
    load()
  }, [])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEmail = () => {
    const subject = encodeURIComponent(`Home Report Card — ${home?.address}`)
    const body = encodeURIComponent(`Here is my home report card for ${home?.address}, ${home?.city}, ${home?.state}.\n\nHealth Score: ${score?.total_score || 'N/A'}\nYear Built: ${home?.year_built}\nSystems Tracked: ${systems.length}\n\nView full report: ${window.location.href}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handlePrint = () => window.print()

  if (loading) return (
    <div suppressHydrationWarning style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <p suppressHydrationWarning style={{ color: '#8A8A82' }}>Loading report card...</p>
    </div>
  )

  const scoreValue = score?.total_score || 0
  const age = home?.year_built ? new Date().getFullYear() - home.year_built : null
  const alertSystems = systems.filter(s => ['Inspect', 'Priority'].includes(getCondition(s).label))

  const scoreDetails = [
    { label: 'System Risk', icon: '🏠', value: score?.system_risk_score || 0, weight: '35%', insight: score?.system_risk_score >= 80 ? 'All systems in good shape' : score?.system_risk_score >= 60 ? 'A few systems to watch' : 'Systems need attention' },
    { label: 'Maintenance', icon: '🔧', value: score?.maintenance_score || 0, weight: '30%', insight: score?.maintenance_score >= 70 ? 'Strong maintenance history' : score?.maintenance_score >= 50 ? 'Log more jobs to improve' : 'Start logging contractor work' },
    { label: 'Value Protection', icon: '💰', value: score?.value_protection_score || 0, weight: '20%', insight: score?.value_protection_score >= 70 ? 'Home value well protected' : 'Address flagged systems before selling' },
    { label: 'Seasonal Readiness', icon: '🌿', value: score?.seasonal_readiness_score || 0, weight: '15%', insight: score?.seasonal_readiness_score >= 70 ? 'Ready for the season' : 'Review seasonal checklist' },
  ]

  return (
    <main suppressHydrationWarning style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      {/* Share bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(30,58,47,0.08)', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '13px', color: '#8A8A82' }}>
          Home Report Card · {home?.address} · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: copied ? '✓ Copied!' : '🔗 Copy link', onClick: handleCopyLink },
            { label: '✉️ Email', onClick: handleEmail },
            { label: '🖨️ Print', onClick: handlePrint },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick} style={{
              background: 'none', border: '1px solid rgba(30,58,47,0.2)',
              color: '#1E3A2F', padding: '7px 14px', borderRadius: '8px',
              fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500
            }}>{btn.label}</button>
          ))}
        </div>
      </div>

      <div ref={reportRef} style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 28px 64px' }}>

        {/* Hero */}
        <div style={{ background: '#1E3A2F', borderRadius: '20px', padding: '36px 40px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(196,123,43,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '8px' }}>Home Report Card</div>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px, 4vw, 34px)', color: '#F8F4EE', fontWeight: 400, marginBottom: '6px', lineHeight: 1.2 }}>{home?.address}</h1>
              <p style={{ fontSize: '14px', color: 'rgba(248,244,238,0.6)', marginBottom: '20px' }}>
                {home?.city}{home?.state ? `, ${home.state}` : ''}{home?.zip ? ` ${home.zip}` : ''} · Built {home?.year_built} · {home?.sqft ? `${home.sqft.toLocaleString()} sq ft` : ''}
              </p>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Age', value: age ? `${age} Years` : '—' },
                  { label: 'Bedrooms', value: details?.bedrooms || '—' },
                  { label: 'Bathrooms', value: details?.bathrooms || '—' },
                  { label: 'Garage', value: details?.garage || '—' },
                  { label: 'Jobs logged', value: jobs.length },
                  { label: 'Systems tracked', value: systems.length },
                ].map(stat => (
                  <div key={stat.label}>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE', fontWeight: 600, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.5)', marginTop: '3px', textTransform: 'capitalize' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
              <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                <circle cx="55" cy="55" r="45" fill="none"
                  stroke={scoreValue >= 80 ? '#6AAF8A' : scoreValue >= 60 ? '#C47B2B' : '#E57373'}
                  strokeWidth="12"
                  strokeDasharray="283" strokeDashoffset={283 - (283 * scoreValue / 100)} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '32px', color: '#F8F4EE', fontWeight: 600, lineHeight: 1 }}>{scoreValue}</div>
                <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.5)', marginTop: '3px', letterSpacing: '1px', textTransform: 'uppercase' }}>Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert banner */}
        {alertSystems.length > 0 && (
          <div style={{ background: '#FDECEA', border: '1px solid rgba(139,58,42,0.2)', borderRadius: '12px', padding: '14px 20px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#9B2C2C', marginBottom: '4px' }}>⚠️ {alertSystems.length} system{alertSystems.length > 1 ? 's' : ''} need attention</div>
            <div style={{ fontSize: '12px', color: '#7A3A2A' }}>{alertSystems.map(s => s.system_type.replace(/_/g, ' ')).join(', ')} — address before listing or selling</div>
          </div>
        )}

        {/* Health Score Breakdown */}
        <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F' }}>Health Score Breakdown</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginTop: '4px' }}>What&apos;s driving your {scoreValue} score — and what you can do about it</p>
          </div>
          {scoreDetails.map((dim, i) => (
            <div key={dim.label} style={{ padding: '16px 24px', borderBottom: i < scoreDetails.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '24px', width: '32px', flexShrink: 0 }}>{dim.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>{dim.label}</span>
                    <span style={{ fontSize: '11px', color: '#8A8A82', marginLeft: '8px' }}>{dim.weight} of score</span>
                  </div>
                  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 600, color: dim.value >= 80 ? '#3D7A5A' : dim.value >= 60 ? '#C47B2B' : '#9B2C2C' }}>{dim.value}</span>
                </div>
                <div style={{ height: '8px', background: '#EDE8E0', borderRadius: '4px', marginBottom: '6px' }}>
                  <div style={{ width: `${dim.value}%`, height: '100%', background: dim.value >= 80 ? '#3D7A5A' : dim.value >= 60 ? '#C47B2B' : '#9B2C2C', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ fontSize: '12px', color: '#8A8A82' }}>{dim.insight}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Home Facts */}
        <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F' }}>Home Facts</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
            {[
              { label: 'Home type', value: home?.home_type?.replace('_', ' ') },
              { label: 'Year built', value: home?.year_built },
              { label: 'Square footage', value: home?.sqft ? `${home.sqft.toLocaleString()} sq ft` : null },
              { label: 'Bedrooms', value: details?.bedrooms },
              { label: 'Bathrooms', value: details?.bathrooms },
              { label: 'Basement', value: details?.basement },
              { label: 'Garage', value: details?.garage },
              { label: 'Pool', value: details?.pool ? 'Yes' : 'No' },
              { label: 'HOA', value: details?.hoa ? 'Yes' : 'No' },
              { label: 'Fireplace', value: details?.has_fireplace ? 'Yes' : 'No' },
              { label: 'Sump pump', value: details?.has_sump_pump ? 'Yes' : 'No' },
              { label: 'Irrigation', value: details?.has_irrigation ? 'Yes' : 'No' },
            ].filter(s => s.value !== null && s.value !== undefined && s.value !== '').map((stat, i) => (
              <div key={stat.label} style={{ padding: '12px 24px', borderBottom: '1px solid rgba(30,58,47,0.06)', borderRight: i % 2 === 0 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#8A8A82' }}>{stat.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', textTransform: 'capitalize' }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Condition */}
        <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F' }}>System & Product Condition</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginTop: '4px' }}>{systems.length} systems tracked</p>
          </div>
          {systems.map((sys, i) => {
            const condition = getCondition(sys)
            const effectiveYear = sys.replacement_year || sys.install_year
            const age = effectiveYear ? new Date().getFullYear() - effectiveYear : null
            const lifespan = SYSTEM_LIFESPANS[sys.system_type] || 20
            const pct = age ? Math.min(100, Math.round((age / lifespan) * 100)) : 0

            return (
              <div key={sys.id} style={{ padding: '16px 24px', borderBottom: i < systems.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontSize: '22px', width: '28px', flexShrink: 0 }}>{SYSTEM_ICONS[sys.system_type] || '🔧'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>
                      {sys.system_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()).replace('Hvac', 'HVAC')}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: condition.bg, color: condition.textColor }}>{condition.label}</span>
                    {sys.ever_replaced && <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>Replaced {sys.replacement_year}</span>}
                    {sys.under_warranty && <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '20px', background: '#E6F2F8', color: '#3A7CA8' }}>Warranty</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '6px' }}>
                    {sys.material && `${sys.material} · `}{age ? `${age} years old · ` : ''}{effectiveYear ? `Installed ${sys.install_year}` : 'Year unknown'}
                    {sys.known_issues && <span style={{ color: '#9B2C2C' }}> · ⚠️ {sys.known_issues}</span>}
                  </div>
                  {age !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', background: '#EDE8E0', borderRadius: '3px' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: condition.color, borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#8A8A82', flexShrink: 0 }}>{pct}% of ~{lifespan}yr</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Contractor History */}
        {jobs.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F' }}>Contractor History</h2>
              <p style={{ fontSize: '13px', color: '#8A8A82', marginTop: '4px' }}>{jobs.length} job{jobs.length !== 1 ? 's' : ''} logged</p>
            </div>
            {jobs.map((job, i) => (
              <div key={job.id} style={{ padding: '14px 24px', borderBottom: i < jobs.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>{job.company_name}</div>
                  <div style={{ fontSize: '12px', color: '#8A8A82' }}>
                    {job.service_description}
                    {job.job_date ? ` · ${new Date(job.job_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''}
                    {job.system_type ? ` · ${job.system_type.replace(/_/g, ' ')}` : ''}
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
                  <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F' }}>{job.final_price ? `$${Number(job.final_price).toLocaleString()}` : '—'}</div>
                  <div style={{ color: '#C47B2B', fontSize: '12px' }}>{'★'.repeat(job.quality_rating)}</div>
                  <div style={{ fontSize: '11px', color: job.would_refer === 'yes' ? '#3D7A5A' : '#9B2C2C', marginTop: '2px' }}>
                    {job.would_refer === 'yes' ? '✓ Would refer' : job.would_refer === 'no' ? '✕ Would not refer' : '~ With reservations'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* For Buyers / For Sellers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {[
            {
              emoji: '🏠',
              title: 'For Buyers',
              color: '#EAF2EC',
              borderColor: '#3D7A5A',
              items: [
                'Request maintenance records before closing',
                'Flag any systems past 80% of expected lifespan',
                'Use deferred maintenance as negotiation leverage',
                'Ask for contractor warranties on recent work',
                'Get independent inspection of flagged systems',
                'Check for storm damage history on roof and siding',
              ]
            },
            {
              emoji: '🔑',
              title: 'For Sellers',
              color: '#FBF0DC',
              borderColor: '#C47B2B',
              items: [
                'Address Inspect and Priority items before listing',
                'Document all recent contractor work with receipts',
                'Share this report card with serious buyers',
                'Systems in Good condition are a selling advantage',
                'Recent maintenance history increases buyer confidence',
                'Get roof and HVAC inspected if over 10 years old',
              ]
            }
          ].map(section => (
            <div key={section.title} style={{ background: '#fff', border: `1px solid rgba(30,58,47,0.11)`, borderTop: `3px solid ${section.borderColor}`, borderRadius: '16px', padding: '22px' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{section.emoji}</div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F', marginBottom: '14px' }}>{section.title}</h3>
              {section.items.map(item => (
                <div key={item} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#4A4A44', lineHeight: 1.5 }}>
                  <span style={{ color: section.borderColor, flexShrink: 0, fontWeight: 500 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid rgba(30,58,47,0.08)' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#1E3A2F', marginBottom: '4px' }}>
            H<em style={{ color: '#C47B2B', fontStyle: 'italic' }}>e</em>arth
          </div>
          <p style={{ fontSize: '12px', color: '#8A8A82' }}>
            Generated by Hearth · hearth-navy.vercel.app · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </main>
  )
}