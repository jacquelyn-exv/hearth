'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const SYSTEMS = [
  { key: 'roof',          icon: '🏠', label: 'Roof' },
  { key: 'hvac',          icon: '🌡️', label: 'HVAC' },
  { key: 'water_heater',  icon: '🔥', label: 'Water Heater' },
  { key: 'plumbing',      icon: '💧', label: 'Plumbing' },
  { key: 'electrical',    icon: '⚡', label: 'Electrical' },
  { key: 'windows',       icon: '🪟', label: 'Windows' },
  { key: 'doors',         icon: '🚪', label: 'Exterior Doors' },
  { key: 'siding',        icon: '🏗️', label: 'Siding' },
  { key: 'gutters',       icon: '🌧️', label: 'Gutters' },
  { key: 'deck',          icon: '🪵', label: 'Deck / Patio' },
  { key: 'driveway',      icon: '🛣️', label: 'Driveway' },
  { key: 'fencing',       icon: '🔒', label: 'Fencing' },
  { key: 'sump_pump',     icon: '💦', label: 'Sump Pump' },
  { key: 'chimney',       icon: '🔥', label: 'Chimney' },
  { key: 'landscaping',   icon: '🌿', label: 'Landscaping' },
]

const LIFESPANS: Record<string, number> = {
  roof: 27, hvac: 17, water_heater: 11, windows: 22,
  deck: 17, electrical: 35, plumbing: 50, siding: 30,
  doors: 30, gutters: 20, driveway: 25, fencing: 20,
  chimney: 50, sump_pump: 10, landscaping: 20,
}

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [score, setScore] = useState(0)
  const [checkingHome, setCheckingHome] = useState(true)
  const [existingHomes, setExistingHomes] = useState<any[]>([])
  const [addingAnother, setAddingAnother] = useState(false)

  // Duplicate home state
  const [duplicateHome, setDuplicateHome] = useState<any>(null)
  const [showDuplicateScreen, setShowDuplicateScreen] = useState(false)
  const [requestingSent, setRequestingSent] = useState(false)
  const [requestType, setRequestType] = useState('')
  const [transferMessage, setTransferMessage] = useState('')

  // Step 1 — identity + home
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [stateVal, setStateVal] = useState('')
  const [zip, setZip] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [homeType, setHomeType] = useState('single_family')

  // Step 2 — systems checklist
  const [selectedSystems, setSelectedSystems] = useState<Set<string>>(new Set())
  const [dontKnowSystems, setDontKnowSystems] = useState<Set<string>>(new Set())

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCheckingHome(false); return }

      // Load existing profile name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single()
      if (profile) {
        setFirstName(profile.first_name || '')
        setLastName(profile.last_name || '')
      }

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

  const toggleSystem = (key: string) => {
    setSelectedSystems(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        setDontKnowSystems(dk => { const d = new Set(dk); d.delete(key); return d })
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleDontKnow = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedSystems.has(key)) {
      setSelectedSystems(prev => { const next = new Set(prev); next.add(key); return next })
    }
    setDontKnowSystems(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleStep1Continue = async () => {
    setError('')
    if (!firstName.trim() || !lastName.trim()) { setError('Please enter your first and last name.'); return }
    if (!address.trim() || !city.trim() || !stateVal.trim() || !zip.trim()) { setError('Please fill in your full address.'); return }
    if (!yearBuilt.trim()) { setError('Please enter the year your home was built.'); return }

    // Check for duplicate
    const { data: matches } = await supabase.rpc('find_home_by_address', {
      p_address: address, p_city: city, p_state: stateVal, p_zip: zip
    })
    if (matches && matches.length > 0) {
      setDuplicateHome(matches[0])
      setShowDuplicateScreen(true)
      return
    }

    setStep(2)
  }

  const handleRequestCoOwnership = async () => {
    setSaving(true)
    await supabase.rpc('request_co_ownership', { p_home_id: duplicateHome.home_id, p_role: 'co_owner' })
    setRequestType('co_owner'); setRequestingSent(true); setSaving(false)
  }

  const handleRequestViewOnly = async () => {
    setSaving(true)
    await supabase.rpc('request_co_ownership', { p_home_id: duplicateHome.home_id, p_role: 'viewer' })
    setRequestType('viewer'); setRequestingSent(true); setSaving(false)
  }

  const handleRequestTransfer = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.rpc('request_ownership_transfer', {
      p_home_id: duplicateHome.home_id, p_to_email: user.email,
      p_initiated_by: 'buyer', p_message: transferMessage || null
    })
    setRequestType('transfer'); setRequestingSent(true); setSaving(false)
  }

  const handleFinish = async (skipSystems = false) => {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      // Save name to user_profiles
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      // Create home
      const { data: home, error: homeError } = await supabase.from('homes').insert({
        user_id: user.id,
        address, city, state: stateVal, zip,
        year_built: parseInt(yearBuilt) || null,
        home_type: homeType,
        is_primary: existingHomes.length === 0,
      }).select().single()
      if (homeError) throw homeError

      await supabase.from('home_details').insert({ home_id: home.id })

      let systemRisk = 100

      if (!skipSystems && selectedSystems.size > 0) {
        for (const key of Array.from(selectedSystems)) {
          const isDontKnow = dontKnowSystems.has(key)
          const installYear = isDontKnow ? null : (parseInt(yearBuilt) || null)
          const age = installYear ? new Date().getFullYear() - installYear : null
          const lifespan = LIFESPANS[key] || 20

          if (age) {
            const pct = age / lifespan
            if (pct > 1) systemRisk -= 15
            else if (pct > 0.8) systemRisk -= 8
            else if (pct > 0.6) systemRisk -= 4
          }

          await supabase.from('home_systems').insert({
            home_id: home.id,
            system_type: key,
            install_year: installYear,
            age_years: age,
            not_applicable: false,
            condition: 'unknown',
          })
        }
      }

      systemRisk = Math.max(0, systemRisk)
      const maintenanceScore = 40
      const valueScore = 60
      const seasonalScore = 75
      const calculatedScore = Math.round(
        systemRisk * 0.35 + maintenanceScore * 0.30 + valueScore * 0.20 + seasonalScore * 0.15
      )
      setScore(calculatedScore)

      await supabase.from('health_scores').insert({
        home_id: home.id,
        total_score: calculatedScore,
        system_risk_score: systemRisk,
        maintenance_score: maintenanceScore,
        value_protection_score: valueScore,
        seasonal_readiness_score: seasonalScore,
      })

      await supabase.rpc('recalculate_community_score', { p_user_id: user.id })

      setStep(3)
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px',
    fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', color: '#1A1A18',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 500,
    color: '#1A1A18', marginBottom: '5px'
  }

  if (checkingHome) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#8A8A82' }}>Loading...</p>
    </div>
  )

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '580px', margin: '0 auto' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <a href="/" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', color: '#1E3A2F', textDecoration: 'none' }}>
            H<em style={{ color: '#C47B2B', fontStyle: 'italic' }}>e</em>arth
          </a>
        </div>

        {/* Existing homes */}
        {existingHomes.length > 0 && !addingAnother && !showDuplicateScreen && !requestingSent && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>
              {existingHomes.length === 1 ? 'You already have a home set up' : 'Your properties'}
            </h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px' }}>
              Go to your dashboard to manage your home or add another property.
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
              <a href="/dashboard" style={{ display: 'block', background: '#1E3A2F', color: '#F8F4EE', textDecoration: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}>Go to my dashboard</a>
              <button onClick={() => setAddingAnother(true)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '12px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Add another property</button>
            </div>
          </div>
        )}

        {/* Duplicate screen */}
        {showDuplicateScreen && !requestingSent && (
          <div>
            <div style={{ textAlign: 'center', fontSize: '40px', marginBottom: '16px' }}>🏠</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px', textAlign: 'center' }}>This home is already in Hearth</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '24px', textAlign: 'center', lineHeight: 1.7 }}>
              {address}, {city}, {stateVal} {zip} is already registered. How would you like to proceed?
            </p>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
              {[
                { title: 'I live here too', desc: 'Request co-owner access. The current owner will be notified and can approve your request.', action: handleRequestCoOwnership, label: 'Request co-owner access', style: { background: '#1E3A2F', color: '#F8F4EE', border: 'none' } },
                { title: 'I just bought this home', desc: 'Request ownership transfer. If they don\'t respond within 30 days, ownership transfers automatically.', action: handleRequestTransfer, label: 'Request ownership transfer', style: { background: '#C47B2B', color: '#fff', border: 'none' }, hasMessage: true },
                { title: 'I just want to view this home', desc: 'Request view-only access to see all home details and history.', action: handleRequestViewOnly, label: 'Request view-only access', style: { background: 'none', color: '#1E3A2F', border: '1px solid rgba(30,58,47,0.2)' } },
              ].map((opt, i) => (
                <div key={i} style={{ background: '#F8F4EE', borderRadius: '12px', padding: '18px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F', marginBottom: '6px' }}>{opt.title}</h4>
                  <p style={{ fontSize: '12px', color: '#8A8A82', lineHeight: 1.6, marginBottom: '12px' }}>{opt.desc}</p>
                  {opt.hasMessage && (
                    <textarea value={transferMessage} onChange={e => setTransferMessage(e.target.value)} placeholder="Optional: add a note to the current owner" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', marginBottom: '10px', fontSize: '13px' }} />
                  )}
                  <button onClick={opt.action} disabled={saving} style={{ ...opt.style, width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{opt.label}</button>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowDuplicateScreen(false); setDuplicateHome(null) }} style={{ width: '100%', background: 'none', border: 'none', color: '#8A8A82', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: '8px' }}>← Go back and correct my address</button>
          </div>
        )}

        {/* Request sent */}
        {requestingSent && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{requestType === 'transfer' ? '🔑' : requestType === 'co_owner' ? '🤝' : '👁️'}</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>
              {requestType === 'transfer' ? 'Transfer requested' : requestType === 'co_owner' ? 'Request sent' : 'View access requested'}
            </h2>
            <p style={{ fontSize: '14px', color: '#8A8A82', lineHeight: 1.7, marginBottom: '24px', maxWidth: '380px', margin: '0 auto 24px' }}>
              {requestType === 'transfer' ? 'The current owner has been notified. If they don\'t respond within 30 days, ownership transfers automatically.' : 'The current owner has been notified and needs to approve your request.'}
            </p>
            <a href="/dashboard" style={{ display: 'block', background: '#1E3A2F', color: '#F8F4EE', textDecoration: 'none', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}>Go to my dashboard</a>
          </div>
        )}

        {/* Main onboarding flow */}
        {(existingHomes.length === 0 || addingAnother) && !showDuplicateScreen && !requestingSent && (
          <div>

            {/* Progress bar */}
            {step < 3 && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {[1, 2].map(s => (
                    <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= step ? '#1E3A2F' : '#EDE8E0', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#8A8A82' }}>Step {step} of 2</div>
              </div>
            )}

            {error && (
              <div style={{ background: '#FDECEA', color: '#9B2C2C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
            )}

            {/* STEP 1 — Identity + Home */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>
                  Let&apos;s set up your home
                </h2>
                <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '24px', lineHeight: 1.6 }}>
                  Just a few basics to get started — you can add more details anytime.
                </p>

                <div style={{ display: 'grid', gap: '14px' }}>

                  {/* Name */}
                  <div>
                    <label style={labelStyle}>Your name</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} placeholder="First name" />
                      <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} placeholder="Last name" />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label style={labelStyle}>Home address</label>
                    <input value={address} onChange={e => setAddress(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }} placeholder="123 Main St" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: '8px' }}>
                      <input value={city} onChange={e => setCity(e.target.value)} style={inputStyle} placeholder="City" />
                      <input value={stateVal} onChange={e => setStateVal(e.target.value)} style={inputStyle} placeholder="State" />
                      <input value={zip} onChange={e => setZip(e.target.value)} style={inputStyle} placeholder="ZIP" />
                    </div>
                  </div>

                  {/* Year built + type */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Year built</label>
                      <input value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} style={inputStyle} placeholder="e.g. 1998" />
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
                </div>

                <button onClick={handleStep1Continue} style={{ width: '100%', marginTop: '24px', background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Continue →
                </button>
              </div>
            )}

            {/* STEP 2 — Systems checklist */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>
                  What systems does your home have?
                </h2>
                <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '6px', lineHeight: 1.6 }}>
                  Tap everything that applies. You can add details later from your dashboard.
                </p>
                <p style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '20px', fontStyle: 'italic' }}>
                  Check "Don&apos;t know details" if you have the system but aren&apos;t sure about install year or condition.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', marginBottom: '24px' }}>
                  {SYSTEMS.map(sys => {
                    const selected = selectedSystems.has(sys.key)
                    const dontKnow = dontKnowSystems.has(sys.key)
                    return (
                      <div
                        key={sys.key}
                        onClick={() => toggleSystem(sys.key)}
                        style={{
                          border: `2px solid ${selected ? '#1E3A2F' : 'rgba(30,58,47,0.15)'}`,
                          borderRadius: '12px',
                          padding: '12px',
                          cursor: 'pointer',
                          background: selected ? '#F0F5F2' : '#fff',
                          transition: 'all 0.15s',
                          position: 'relative',
                        }}
                      >
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{sys.icon}</div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: selected ? '8px' : '0' }}>{sys.label}</div>
                        {selected && (
                          <button
                            type="button"
                            onClick={e => toggleDontKnow(sys.key, e)}
                            style={{
                              fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                              border: `1px solid ${dontKnow ? '#C47B2B' : 'rgba(30,58,47,0.2)'}`,
                              background: dontKnow ? '#FBF0DC' : '#fff',
                              color: dontKnow ? '#7A4A10' : '#8A8A82',
                              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                              display: 'block', width: '100%', textAlign: 'center',
                            }}
                          >
                            {dontKnow ? '? No details' : 'Don\'t know details'}
                          </button>
                        )}
                        {selected && !dontKnow && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', borderRadius: '50%', background: '#1E3A2F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {selectedSystems.size > 0 && (
                  <div style={{ background: '#EAF2EC', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#3D7A5A' }}>
                    ✓ {selectedSystems.size} system{selectedSystems.size !== 1 ? 's' : ''} selected
                    {dontKnowSystems.size > 0 && ` · ${dontKnowSystems.size} marked as don't know`}
                  </div>
                )}

                <div style={{ display: 'grid', gap: '10px' }}>
                  <button
                    onClick={() => handleFinish(false)}
                    disabled={saving}
                    style={{ width: '100%', background: '#C47B2B', color: '#fff', border: 'none', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? 'Setting up your home...' : 'Get my home score →'}
                  </button>
                  <button
                    onClick={() => handleFinish(true)}
                    disabled={saving}
                    style={{ width: '100%', background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '11px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Skip for now — I&apos;ll add systems later
                  </button>
                  <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#8A8A82', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: '4px' }}>← Back</button>
                </div>
              </div>
            )}

            {/* STEP 3 — Score reveal */}
            {step === 3 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '16px' }}>Your home health score</p>
                <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 24px' }}>
                  <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="70" cy="70" r="58" fill="none" stroke="#EDE8E0" strokeWidth="12" />
                    <circle cx="70" cy="70" r="58" fill="none"
                      stroke={score >= 80 ? '#3D7A5A' : score >= 60 ? '#C47B2B' : '#9B2C2C'}
                      strokeWidth="12" strokeDasharray="364"
                      strokeDashoffset={364 - (364 * score / 100)}
                      strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '42px', color: '#1E3A2F', fontWeight: 600 }}>{score}</div>
                </div>

                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>
                  Welcome{firstName ? `, ${firstName}` : ''}!
                </h2>
                <p style={{ fontSize: '14px', color: '#8A8A82', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto 12px' }}>
                  {score >= 80 ? 'Your home is in great shape.' : score >= 60 ? 'Your home is doing well.' : 'Your home needs some attention.'}
                  {' '}Log contractor jobs and update system details from your dashboard to improve your score over time.
                </p>

                {selectedSystems.size === 0 && (
                  <p style={{ fontSize: '13px', color: '#C47B2B', marginBottom: '16px' }}>
                    💡 Add your home systems to get a more accurate score.
                  </p>
                )}

                <a href="/dashboard" style={{ display: 'block', background: '#1E3A2F', color: '#F8F4EE', textDecoration: 'none', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, textAlign: 'center', maxWidth: '380px', margin: '0 auto' }}>
                  Go to my dashboard →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}