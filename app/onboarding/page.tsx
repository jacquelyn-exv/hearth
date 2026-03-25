'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const SYSTEMS = ['roof', 'hvac', 'water_heater', 'windows', 'deck', 'electrical']
const SYSTEM_LABELS: Record<string, string> = {
  roof: 'Roof',
  hvac: 'HVAC System',
  water_heater: 'Water Heater',
  windows: 'Windows',
  deck: 'Deck',
  electrical: 'Electrical Panel'
}

function calculateScore(systems: Record<string, string>, jobCount: number, planToSell: string, diyLevel: number) {
  const lifespans: Record<string, number> = {
    roof: 27, hvac: 17, water_heater: 11, windows: 22, deck: 17, electrical: 35
  }
  let systemRisk = 100
  let systemCount = 0
  for (const [system, yearStr] of Object.entries(systems)) {
    if (!yearStr) continue
    const age = new Date().getFullYear() - parseInt(yearStr)
    const lifespan = lifespans[system] || 20
    const pct = age / lifespan
    if (pct > 1) systemRisk -= 20
    else if (pct > 0.8) systemRisk -= 10
    else if (pct > 0.6) systemRisk -= 5
    systemCount++
  }
  systemRisk = Math.max(0, systemRisk)
  const maintenanceScore = Math.min(100, jobCount * 15 + 40)
  const valueScore = planToSell === 'within_2yr' ? 80 : planToSell === 'within_5yr' ? 70 : 60
  const seasonalScore = 75
  return Math.round(systemRisk * 0.35 + maintenanceScore * 0.30 + valueScore * 0.20 + seasonalScore * 0.15)
}

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [score, setScore] = useState(0)

  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [homeType, setHomeType] = useState('single_family')
  const [sqft, setSqft] = useState('')

  const [systemYears, setSystemYears] = useState<Record<string, string>>({})
  const [plumbingType, setPlumbingType] = useState('unknown')

  const [diyLevel, setDiyLevel] = useState(3)
  const [planToSell, setPlanToSell] = useState('no_plans')
  const [budgetRange, setBudgetRange] = useState('1k_5k')

  const handleFinish = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: home, error: homeError } = await supabase.from('homes').insert({
        user_id: user.id, address, city, state, zip,
        year_built: parseInt(yearBuilt) || null,
        home_type: homeType,
        sqft: parseInt(sqft) || null,
        diy_level: diyLevel,
        plan_to_sell: planToSell,
        budget_range: budgetRange
      }).select().single()

      if (homeError) throw homeError

      for (const [system, yearStr] of Object.entries(systemYears)) {
        if (!yearStr) continue
        await supabase.from('home_systems').insert({
          home_id: home.id,
          system_type: system,
          install_year: parseInt(yearStr),
          condition: 'unknown',
          plumbing_type: system === 'plumbing' ? plumbingType : null
        })
      }

      const calculatedScore = calculateScore(systemYears, 0, planToSell, diyLevel)
      setScore(calculatedScore)

      await supabase.from('health_scores').insert({
        home_id: home.id,
        total_score: calculatedScore,
        system_risk_score: calculatedScore,
        maintenance_score: 40,
        value_protection_score: 60,
        seasonal_readiness_score: 75
      })

      setStep(4)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px',
    fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', boxSizing: 'border-box' as const,
    color: '#1A1A18'
  }
  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 500,
    color: '#1A1A18', marginBottom: '6px'
  }
  const selectStyle = { ...inputStyle }

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '520px' }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#1E3A2F' }}>
            Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
          </div>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                flex: 1, height: '4px', borderRadius: '2px',
                background: s <= step ? '#1E3A2F' : '#EDE8E0'
              }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: '#FDECEA', color: '#9B2C2C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Step 1 — Home basics */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '6px' }}>Tell us about your home</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '24px' }}>Step 1 of 3 — Basic details</p>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Street address</label>
                <input value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} placeholder="123 Main St" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input value={city} onChange={e => setCity(e.target.value)} style={inputStyle} placeholder="City" />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input value={state} onChange={e => setState(e.target.value)} style={inputStyle} placeholder="MD" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>ZIP code</label>
                  <input value={zip} onChange={e => setZip(e.target.value)} style={inputStyle} placeholder="21601" />
                </div>
                <div>
                  <label style={labelStyle}>Year built</label>
                  <input value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} style={inputStyle} placeholder="1995" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Home type</label>
                  <select value={homeType} onChange={e => setHomeType(e.target.value)} style={selectStyle}>
                    <option value="single_family">Single family</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="condo">Condo</option>
                    <option value="multi_family">Multi-family</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Square footage</label>
                  <input value={sqft} onChange={e => setSqft(e.target.value)} style={inputStyle} placeholder="2000" />
                </div>
              </div>
            </div>

            <button onClick={() => setStep(2)} style={{
              width: '100%', marginTop: '24px', background: '#1E3A2F', color: '#F8F4EE',
              border: 'none', padding: '12px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
            }}>Continue →</button>
          </div>
        )}

        {/* Step 2 — System ages */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '6px' }}>Your home systems</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '24px' }}>Step 2 of 3 — When were they installed? (approximate is fine)</p>

            <div style={{ display: 'grid', gap: '14px' }}>
              {SYSTEMS.map(system => (
                <div key={system}>
                  <label style={labelStyle}>{SYSTEM_LABELS[system]} — year installed</label>
                  <input
                    value={systemYears[system] || ''}
                    onChange={e => setSystemYears(prev => ({ ...prev, [system]: e.target.value }))}
                    style={inputStyle}
                    placeholder="e.g. 2015 (leave blank if unknown)"
                  />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Plumbing type</label>
                <select value={plumbingType} onChange={e => setPlumbingType(e.target.value)} style={selectStyle}>
                  <option value="unknown">Unknown</option>
                  <option value="copper">Copper</option>
                  <option value="pvc">PVC</option>
                  <option value="galvanized">Galvanized (older homes)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)',
                color: '#1E3A2F', padding: '12px', borderRadius: '10px',
                fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>← Back</button>
              <button onClick={() => setStep(3)} style={{
                flex: 2, background: '#1E3A2F', color: '#F8F4EE',
                border: 'none', padding: '12px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3 — About you */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '6px' }}>A little about you</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '24px' }}>Step 3 of 3 — Helps us personalize your score</p>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={labelStyle}>DIY comfort level (1 = hire everything, 5 = do it all yourself)</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setDiyLevel(n)} style={{
                      flex: 1, padding: '10px', borderRadius: '8px',
                      border: `2px solid ${diyLevel === n ? '#1E3A2F' : 'rgba(30,58,47,0.15)'}`,
                      background: diyLevel === n ? '#1E3A2F' : '#fff',
                      color: diyLevel === n ? '#F8F4EE' : '#1A1A18',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
                      fontWeight: 500, cursor: 'pointer'
                    }}>{n}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Plans to sell?</label>
                <select value={planToSell} onChange={e => setPlanToSell(e.target.value)} style={selectStyle}>
                  <option value="no_plans">No plans to sell</option>
                  <option value="within_5yr">Yes, within 5 years</option>
                  <option value="within_2yr">Yes, within 2 years</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Annual maintenance budget</label>
                <select value={budgetRange} onChange={e => setBudgetRange(e.target.value)} style={selectStyle}>
                  <option value="under_1k">Under $1,000</option>
                  <option value="1k_5k">$1,000 – $5,000</option>
                  <option value="5k_15k">$5,000 – $15,000</option>
                  <option value="15k_plus">$15,000+</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(2)} style={{
                flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)',
                color: '#1E3A2F', padding: '12px', borderRadius: '10px',
                fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>← Back</button>
              <button onClick={handleFinish} disabled={loading} style={{
                flex: 2, background: '#C47B2B', color: '#fff',
                border: 'none', padding: '12px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>{loading ? 'Saving...' : 'Get my score →'}</button>
            </div>
          </div>
        )}

        {/* Step 4 — Score reveal */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '16px' }}>Your home health score</p>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 20px' }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#EDE8E0" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#3D7A5A" strokeWidth="10"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (314 * score / 100)}
                  strokeLinecap="round" />
              </svg>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '32px', color: '#1E3A2F', fontWeight: 600
              }}>{score}</div>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>
              {score >= 80 ? 'Your home is in great shape!' : score >= 60 ? 'Your home is doing well.' : 'Your home needs some attention.'}
            </h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '28px', lineHeight: 1.6 }}>
              Your score is based on your system ages, maintenance history, and home details. Log contractor jobs to improve it over time.
            </p>
            <button onClick={() => window.location.href = '/dashboard'} style={{
              width: '100%', background: '#1E3A2F', color: '#F8F4EE',
              border: 'none', padding: '12px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
            }}>Go to my dashboard →</button>
          </div>
        )}
      </div>
    </main>
  )
}