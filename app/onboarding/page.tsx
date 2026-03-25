'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const PRODUCTS = [
  { key: 'roof', icon: '🏠', label: 'Roof', materials: ['Asphalt shingle', 'Metal', 'Tile', 'Wood shake', 'Flat / TPO', 'Slate'] },
  { key: 'siding', icon: '🏗️', label: 'Siding', materials: ['Vinyl', 'Fiber cement', 'Wood', 'Brick', 'Stucco', 'Aluminum'] },
  { key: 'windows', icon: '🪟', label: 'Windows', materials: ['Single pane', 'Double pane', 'Triple pane'] },
  { key: 'doors', icon: '🚪', label: 'Exterior Doors', materials: ['Fiberglass', 'Steel', 'Wood'] },
  { key: 'gutters', icon: '🌧️', label: 'Gutters', materials: ['Aluminum', 'Copper', 'Vinyl', 'Steel'] },
  { key: 'deck', icon: '🪵', label: 'Deck / Patio', materials: ['Pressure treated wood', 'Cedar', 'Composite', 'Concrete', 'Pavers'] },
  { key: 'driveway', icon: '🛣️', label: 'Driveway', materials: ['Asphalt', 'Concrete', 'Pavers', 'Gravel'] },
  { key: 'fencing', icon: '🔒', label: 'Fencing', materials: ['Wood', 'Vinyl', 'Aluminum', 'Chain link'] },
  { key: 'hvac', icon: '🌡️', label: 'HVAC', materials: ['Central air / gas furnace', 'Heat pump', 'Mini-split', 'Boiler', 'Radiant heat'] },
  { key: 'water_heater', icon: '🔥', label: 'Water Heater', materials: ['Tank (gas)', 'Tank (electric)', 'Tankless (gas)', 'Tankless (electric)'] },
  { key: 'electrical', icon: '⚡', label: 'Electrical Panel', materials: [] },
  { key: 'plumbing', icon: '💧', label: 'Plumbing', materials: ['Copper', 'PVC / CPVC', 'PEX', 'Galvanized steel', 'Mixed / Unknown'] },
]

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [score, setScore] = useState(0)
  const [existingHomes, setExistingHomes] = useState<any[]>([])
  const [checkingHome, setCheckingHome] = useState(true)
  const [addingAnother, setAddingAnother] = useState(false)

  // Step 1
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [stateVal, setStateVal] = useState('')
  const [zip, setZip] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [homeType, setHomeType] = useState('single_family')

  // Step 2
  const [installYears, setInstallYears] = useState<Record<string, string>>({})
  const [materials, setMaterials] = useState<Record<string, string>>({})
  const [replaced, setReplaced] = useState<Record<string, boolean>>({})
  const [replacedYears, setReplacedYears] = useState<Record<string, string>>({})
  const [warranties, setWarranties] = useState<Record<string, boolean>>({})

  // Step 3
  const [diyLevel, setDiyLevel] = useState(3)
  const [planToSell, setPlanToSell] = useState('no_plans')
  const [budgetRange, setBudgetRange] = useState('1k_5k')
  const [primaryConcern, setPrimaryConcern] = useState('peace_of_mind')

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCheckingHome(false); return }
      const { data: homes } = await supabase
        .from('homes')
        .select('id, address, city, state')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setExistingHomes(homes || [])
      setCheckingHome(false)
    }
    check()
  }, [])

  const setInstallYear = useCallback((key: string, val: string) => {
    setInstallYears(prev => ({ ...prev, [key]: val }))
  }, [])

  const setMaterial = useCallback((key: string, val: string) => {
    setMaterials(prev => ({ ...prev, [key]: val }))
  }, [])

  const setReplacedYear = useCallback((key: string, val: string) => {
    setReplacedYears(prev => ({ ...prev, [key]: val }))
  }, [])

  const toggleReplaced = useCallback((key: string) => {
    setReplaced(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const toggleWarranty = useCallback((key: string) => {
    setWarranties(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const goToStep2 = () => {
    if (yearBuilt) {
      const defaults: Record<string, string> = {}
      PRODUCTS.forEach(p => {
        if (!installYears[p.key]) defaults[p.key] = yearBuilt
      })
      setInstallYears(prev => ({ ...defaults, ...prev }))
    }
    setStep(2)
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px',
    fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff',
    color: '#1A1A18', boxSizing: 'border-box' as const
  }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '5px' }

  const handleFinish = async () => {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: home, error: homeError } = await supabase.from('homes').insert({
        user_id: user.id, address, city, state: stateVal, zip,
        year_built: parseInt(yearBuilt) || null,
        home_type: homeType,
        diy_level: diyLevel,
        plan_to_sell: planToSell,
        budget_range: budgetRange
      }).select().single()
      if (homeError) throw homeError

      await supabase.from('home_details').insert({ home_id: home.id })

      const lifespans: Record<string, number> = {
        roof: 27, hvac: 17, water_heater: 11, windows: 22,
        deck: 17, electrical: 35, plumbing: 50, siding: 30,
        doors: 30, gutters: 20, driveway: 25, fencing: 20
      }

      let systemRisk = 100
      for (const product of PRODUCTS) {
        const rawInstall = installYears[product.key] || yearBuilt
        const rawReplaced = replacedYears[product.key]
        const effectiveYear = rawReplaced || rawInstall
        const installYear = parseInt(rawInstall) || null
        const replacementYear = parseInt(rawReplaced) || null
        const effectiveYearNum = parseInt(effectiveYear) || null
        const age = effectiveYearNum ? new Date().getFullYear() - effectiveYearNum : null
        const lifespan = lifespans[product.key] || 20
        if (age) {
          const pct = age / lifespan
          if (pct > 1) systemRisk -= 15
          else if (pct > 0.8) systemRisk -= 8
          else if (pct > 0.6) systemRisk -= 4
        }
        await supabase.from('home_systems').insert({
          home_id: home.id,
          system_type: product.key,
          install_year: installYear,
          age_years: age,
          material: materials[product.key] || null,
          ever_replaced: replaced[product.key] || false,
          replacement_year: replacementYear,
          under_warranty: warranties[product.key] || false,
          condition: 'unknown'
        })
      }

      systemRisk = Math.max(0, systemRisk)
      const maintenanceScore = 40
      const valueScore = planToSell === 'within_2yr' ? 80 : planToSell === 'within_5yr' ? 70 : 60
      const seasonalScore = 75
      const calculatedScore = Math.round(systemRisk * 0.35 + maintenanceScore * 0.30 + valueScore * 0.20 + seasonalScore * 0.15)
      setScore(calculatedScore)

      await supabase.from('health_scores').insert({
        home_id: home.id,
        total_score: calculatedScore,
        system_risk_score: systemRisk,
        maintenance_score: maintenanceScore,
        value_protection_score: valueScore,
        seasonal_readiness_score: seasonalScore
      })

      setStep(4)
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '620px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <a href="/" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#1E3A2F', textDecoration: 'none' }}>
            Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
          </a>
        </div>

        {/* Checking state */}
        {checkingHome && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#8A8A82', fontSize: '14px' }}>Checking your account...</p>
          </div>
        )}

        {/* Existing homes screen */}
        {!checkingHome && existingHomes.length > 0 && !addingAnother && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>
              {existingHomes.length === 1 ? 'You already have a home set up' : 'Your properties'}
            </h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px' }}>
              {existingHomes.length === 1
                ? 'Your home is already in your account. Go to your dashboard to update details or log contractor jobs.'
                : 'You have multiple properties. Go to your dashboard to manage them.'}
            </p>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
              {existingHomes.map(h => (
                <div key={h.id} style={{ background: '#F8F4EE', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>{h.address}</div>
                    <div style={{ fontSize: '12px', color: '#8A8A82' }}>{h.city}{h.state ? `, ${h.state}` : ''}</div>
                  </div>
                  <a href="/dashboard" style={{ fontSize: '12px', color: '#3D7A5A', textDecoration: 'none', fontWeight: 500 }}>View →</a>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <a href="/dashboard" style={{
                display: 'block', background: '#1E3A2F', color: '#F8F4EE',
                textDecoration: 'none', padding: '12px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 500, textAlign: 'center'
              }}>Go to my dashboard</a>
              <button onClick={() => setAddingAnother(true)} style={{
                background: 'none', border: '1px solid rgba(30,58,47,0.2)',
                color: '#1E3A2F', padding: '12px', borderRadius: '10px',
                fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>+ Add another property</button>
            </div>
          </div>
        )}

        {/* Progress bar — only show during onboarding flow */}
        {!checkingHome && (existingHomes.length === 0 || addingAnother) && step < 4 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= step ? '#1E3A2F' : '#EDE8E0' }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: '#FDECEA', color: '#9B2C2C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
        )}

        {/* STEP 1 */}
        {!checkingHome && (existingHomes.length === 0 || addingAnother) && step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>
              {addingAnother ? 'Add another property' : 'Your home'}
            </h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '24px' }}>Step 1 of 3 — Just the basics to get started</p>

            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Street address</label>
                <input value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} placeholder="123 Main St" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input value={city} onChange={e => setCity(e.target.value)} style={inputStyle} placeholder="City" />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input value={stateVal} onChange={e => setStateVal(e.target.value)} style={inputStyle} placeholder="MD" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>ZIP code</label>
                  <input value={zip} onChange={e => setZip(e.target.value)} style={inputStyle} placeholder="21601" />
                </div>
                <div>
                  <label style={labelStyle}>Year built</label>
                  <input value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} style={inputStyle} placeholder="1995" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Home type</label>
                <select value={homeType} onChange={e => setHomeType(e.target.value)} style={inputStyle}>
                  <option value="single_family">Single family</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="condo">Condo</option>
                  <option value="multi_family">Multi-family</option>
                </select>
              </div>
            </div>

            <button onClick={goToStep2} style={{
              width: '100%', marginTop: '24px', background: '#1E3A2F', color: '#F8F4EE',
              border: 'none', padding: '12px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
            }}>Continue →</button>
          </div>
        )}

        {/* STEP 2 */}
        {!checkingHome && (existingHomes.length === 0 || addingAnother) && step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>Your products</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '4px' }}>Step 2 of 3 — Install years are pre-filled from your build year. Update anything that&apos;s been replaced.</p>
            <p style={{ fontSize: '12px', color: '#8A8A82', fontStyle: 'italic', marginBottom: '20px' }}>You can update materials and details anytime from your dashboard.</p>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
              {PRODUCTS.map(p => (
                <ProductRow
                  key={p.key}
                  product={p}
                  installYear={installYears[p.key] ?? yearBuilt}
                  material={materials[p.key] || ''}
                  isReplaced={replaced[p.key] || false}
                  replacedYear={replacedYears[p.key] || ''}
                  hasWarranty={warranties[p.key] || false}
                  onYearChange={setInstallYear}
                  onMaterialChange={setMaterial}
                  onToggleReplaced={toggleReplaced}
                  onReplacedYearChange={setReplacedYear}
                  onToggleWarranty={toggleWarranty}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
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

        {/* STEP 3 */}
        {!checkingHome && (existingHomes.length === 0 || addingAnother) && step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>Your goals</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '24px' }}>Step 3 of 3 — Helps us personalize your score</p>

            <div style={{ display: 'grid', gap: '18px' }}>
              <div>
                <label style={labelStyle}>DIY comfort level</label>
                <p style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '8px' }}>1 = hire everything · 5 = do it all myself</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1,2,3,4,5].map(n => (
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
                <select value={planToSell} onChange={e => setPlanToSell(e.target.value)} style={inputStyle}>
                  <option value="no_plans">No plans to sell</option>
                  <option value="within_5yr">Yes, within 5 years</option>
                  <option value="within_2yr">Yes, within 2 years</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Annual maintenance budget</label>
                <select value={budgetRange} onChange={e => setBudgetRange(e.target.value)} style={inputStyle}>
                  <option value="under_1k">Under $1,000</option>
                  <option value="1k_5k">$1,000 – $5,000</option>
                  <option value="5k_15k">$5,000 – $15,000</option>
                  <option value="15k_plus">$15,000+</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Primary goal</label>
                <select value={primaryConcern} onChange={e => setPrimaryConcern(e.target.value)} style={inputStyle}>
                  <option value="peace_of_mind">Peace of mind — know my home is in good shape</option>
                  <option value="reduce_costs">Reduce costs — avoid expensive surprises</option>
                  <option value="increase_value">Increase value — maximize what I get when I sell</option>
                  <option value="prepare_to_sell">Prepare to sell — get my home market-ready</option>
                  <option value="new_owner">New owner — understand what I just bought</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(2)} style={{
                flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)',
                color: '#1E3A2F', padding: '12px', borderRadius: '10px',
                fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>← Back</button>
              <button onClick={handleFinish} disabled={saving} style={{
                flex: 2, background: '#C47B2B', color: '#fff',
                border: 'none', padding: '12px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>{saving ? 'Saving...' : 'Get my score →'}</button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '16px' }}>Your home health score</p>
            <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 24px' }}>
              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="58" fill="none" stroke="#EDE8E0" strokeWidth="12" />
                <circle cx="70" cy="70" r="58" fill="none" stroke="#3D7A5A" strokeWidth="12"
                  strokeDasharray="364" strokeDashoffset={364 - (364 * score / 100)} strokeLinecap="round" />
              </svg>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '42px', color: '#1E3A2F', fontWeight: 600
              }}>{score}</div>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>
              {score >= 80 ? 'Your home is in great shape!' : score >= 60 ? 'Your home is doing well.' : 'Your home needs some attention.'}
            </h2>
            <p style={{ fontSize: '14px', color: '#8A8A82', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto 28px' }}>
              You can update system details and log contractor jobs from your dashboard to improve your score over time.
            </p>
            <a href="/dashboard" style={{
              display: 'block', background: '#1E3A2F', color: '#F8F4EE',
              textDecoration: 'none', padding: '13px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 500, textAlign: 'center'
            }}>Go to my dashboard →</a>
          </div>
        )}
      </div>
    </main>
  )
}

function ProductRow({ product, installYear, material, isReplaced, replacedYear, hasWarranty, onYearChange, onMaterialChange, onToggleReplaced, onReplacedYearChange, onToggleWarranty }: {
  product: { key: string, icon: string, label: string, materials: string[] }
  installYear: string
  material: string
  isReplaced: boolean
  replacedYear: string
  hasWarranty: boolean
  onYearChange: (key: string, val: string) => void
  onMaterialChange: (key: string, val: string) => void
  onToggleReplaced: (key: string) => void
  onReplacedYearChange: (key: string, val: string) => void
  onToggleWarranty: (key: string) => void
}) {
  const cellInput = {
    padding: '7px 10px', border: '1px solid rgba(30,58,47,0.2)',
    borderRadius: '6px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', color: '#1A1A18', width: '100%',
    boxSizing: 'border-box' as const
  }

  return (
    <div style={{ background: '#F8F4EE', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px auto', gap: '10px', alignItems: 'end' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '5px' }}>
            {product.icon} {product.label}
          </div>
          {product.materials.length > 0 ? (
            <select value={material} onChange={e => onMaterialChange(product.key, e.target.value)} style={cellInput}>
              <option value="">Material / type</option>
              {product.materials.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <div style={{ fontSize: '12px', color: '#8A8A82', padding: '4px 0' }}>—</div>
          )}
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '5px' }}>Year installed</div>
          <input
            type="text"
            value={installYear}
            onChange={e => onYearChange(product.key, e.target.value)}
            style={cellInput}
            placeholder="Year"
          />
        </div>
        <div style={{ paddingBottom: '2px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={isReplaced}
              onChange={() => onToggleReplaced(product.key)}
              style={{ width: '14px', height: '14px', accentColor: '#1E3A2F' }}
            />
            Replaced?
          </label>
        </div>
      </div>

      {isReplaced && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(30,58,47,0.1)' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '5px' }}>Year replaced</div>
            <input
              type="text"
              value={replacedYear}
              onChange={e => onReplacedYearChange(product.key, e.target.value)}
              style={cellInput}
              placeholder="e.g. 2019"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasWarranty}
                onChange={() => onToggleWarranty(product.key)}
                style={{ width: '14px', height: '14px', accentColor: '#1E3A2F' }}
              />
              Under warranty
            </label>
          </div>
        </div>
      )}
    </div>
  )
}