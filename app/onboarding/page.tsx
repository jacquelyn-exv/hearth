'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [score, setScore] = useState(0)

  // Step 1 — House Facts
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [homeType, setHomeType] = useState('single_family')
  const [sqft, setSqft] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [basement, setBasement] = useState('none')
  const [garage, setGarage] = useState('none')
  const [garageSpaces, setGarageSpaces] = useState('')
  const [pool, setPool] = useState(false)
  const [hotTub, setHotTub] = useState(false)
  const [hoa, setHoa] = useState(false)
  const [lotSize, setLotSize] = useState('')
  const [driveType, setDriveType] = useState('unknown')
  const [hasFireplace, setHasFireplace] = useState(false)
  const [hasSumpPump, setHasSumpPump] = useState(false)
  const [hasIrrigation, setHasIrrigation] = useState(false)
  const [hasGenerator, setHasGenerator] = useState(false)

  // Step 2 — Products
  const [products, setProducts] = useState<Record<string, Record<string, any>>>({
    roof: { install_year: '', material: '', ever_replaced: false, storm_damage_unaddressed: false },
    siding: { install_year: '', material: '', ever_replaced: false },
    windows: { install_year: '', product_type: '', count: '', ever_replaced: false },
    doors: { install_year: '', material: '', ever_replaced: false },
    gutters: { install_year: '', material: '', cleaned_regularly: true, ever_replaced: false },
    deck: { install_year: '', material: '', ever_replaced: false },
    driveway: { install_year: '', material: '', ever_replaced: false },
    fencing: { install_year: '', material: '', ever_replaced: false },
    hvac: { install_year: '', product_type: '', ever_replaced: false, storm_damage_unaddressed: false },
    water_heater: { install_year: '', product_type: '', ever_replaced: false },
    electrical: { install_year: '', ever_replaced: false, known_issues: '' },
    plumbing: { product_type: '', ever_replaced: false },
    chimney: { install_year: '', ever_replaced: false, known_issues: '' },
    sump_pump: { install_year: '', ever_replaced: false },
  })

  // Step 3 — Goals
  const [diyLevel, setDiyLevel] = useState(3)
  const [planToSell, setPlanToSell] = useState('no_plans')
  const [budgetRange, setBudgetRange] = useState('1k_5k')
  const [primaryConcern, setPrimaryConcern] = useState('peace_of_mind')
  const [upcomingPlans, setUpcomingPlans] = useState('')

  const updateProduct = (system: string, field: string, value: any) => {
    setProducts(prev => ({ ...prev, [system]: { ...prev[system], [field]: value } }))
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px',
    fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', boxSizing: 'border-box' as const,
    color: '#1A1A18'
  }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }
  const sectionStyle = { background: '#F8F4EE', borderRadius: '12px', padding: '16px', marginBottom: '16px' }
  const sectionTitleStyle = { fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }

  const handleFinish = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      // Save home
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

      // Save home details
      await supabase.from('home_details').insert({
        home_id: home.id,
        bedrooms: parseInt(bedrooms) || null,
        bathrooms: parseFloat(bathrooms) || null,
        basement, garage,
        garage_spaces: parseInt(garageSpaces) || null,
        pool, hot_tub: hotTub, hoa,
        lot_size: lotSize,
        driveway_type: driveType,
        has_fireplace: hasFireplace,
        has_sump_pump: hasSumpPump,
        has_irrigation: hasIrrigation,
        has_generator: hasGenerator
      })

      // Save products
      for (const [system, data] of Object.entries(products)) {
        const installYear = data.install_year ? parseInt(data.install_year) : null
        if (!installYear && !data.product_type && !data.material && !data.known_issues) continue
        await supabase.from('home_systems').insert({
          home_id: home.id,
          system_type: system,
          install_year: installYear,
          age_years: installYear ? new Date().getFullYear() - installYear : null,
          material: data.material || null,
          product_type: data.product_type || null,
          ever_replaced: data.ever_replaced || false,
          storm_damage_unaddressed: data.storm_damage_unaddressed || false,
          cleaned_regularly: data.cleaned_regularly ?? null,
          count: data.count ? parseInt(data.count) : null,
          known_issues: data.known_issues || null,
          condition: 'unknown'
        })
      }

      // Calculate score
      let systemRisk = 100
      const lifespans: Record<string, number> = {
        roof: 27, hvac: 17, water_heater: 11, windows: 22,
        deck: 17, electrical: 35, plumbing: 50, siding: 30
      }
      for (const [system, data] of Object.entries(products)) {
        if (!data.install_year) continue
        const age = new Date().getFullYear() - parseInt(data.install_year)
        const lifespan = lifespans[system] || 20
        const pct = age / lifespan
        if (data.storm_damage_unaddressed) systemRisk -= 15
        if (pct > 1) systemRisk -= 15
        else if (pct > 0.8) systemRisk -= 8
        else if (pct > 0.6) systemRisk -= 4
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
    setLoading(false)
  }

  const CheckboxRow = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1A1A18', cursor: 'pointer', marginBottom: '8px' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: '16px', height: '16px', accentColor: '#1E3A2F' }} />
      {label}
    </label>
  )

  const ProductSection = ({ system, icon, title, fields }: {
    system: string, icon: string, title: string,
    fields: { key: string, label: string, type: 'text' | 'year' | 'select' | 'checkbox' | 'number', options?: string[] }[]
  }) => (
    <div style={sectionStyle}>
      <div style={sectionTitleStyle as any}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span>{title}</span>
      </div>
      <div style={{ display: 'grid', gap: '12px' }}>
        {fields.map(field => (
          <div key={field.key}>
            {field.type === 'checkbox' ? (
              <CheckboxRow
                label={field.label}
                checked={products[system][field.key] || false}
                onChange={v => updateProduct(system, field.key, v)}
              />
            ) : field.type === 'select' ? (
              <>
                <label style={labelStyle}>{field.label}</label>
                <select value={products[system][field.key] || ''} onChange={e => updateProduct(system, field.key, e.target.value)} style={inputStyle}>
                  <option value="">Unknown / Not sure</option>
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </>
            ) : (
              <>
                <label style={labelStyle}>{field.label}</label>
                <input
                  type={field.type === 'year' || field.type === 'number' ? 'number' : 'text'}
                  value={products[system][field.key] || ''}
                  onChange={e => updateProduct(system, field.key, e.target.value)}
                  style={inputStyle}
                  placeholder={field.type === 'year' ? 'e.g. 2015' : ''}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '640px', margin: '0 auto' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <a href="/" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#1E3A2F', textDecoration: 'none' }}>
            Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
          </a>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= step ? '#1E3A2F' : '#EDE8E0' }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: '#FDECEA', color: '#9B2C2C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
        )}

        {/* STEP 1 — House Facts */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '6px' }}>House Facts</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '24px' }}>Step 1 of 3 — Tell us about your home</p>

            <div style={{ display: 'grid', gap: '14px' }}>
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
                  <input value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} style={inputStyle} placeholder="1995" type="number" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Home type</label>
                  <select value={homeType} onChange={e => setHomeType(e.target.value)} style={inputStyle}>
                    <option value="single_family">Single family</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="condo">Condo</option>
                    <option value="multi_family">Multi-family</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Square footage</label>
                  <input value={sqft} onChange={e => setSqft(e.target.value)} style={inputStyle} placeholder="2000" type="number" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Bedrooms</label>
                  <input value={bedrooms} onChange={e => setBedrooms(e.target.value)} style={inputStyle} placeholder="3" type="number" />
                </div>
                <div>
                  <label style={labelStyle}>Bathrooms</label>
                  <input value={bathrooms} onChange={e => setBathrooms(e.target.value)} style={inputStyle} placeholder="2.5" type="number" step="0.5" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Basement</label>
                  <select value={basement} onChange={e => setBasement(e.target.value)} style={inputStyle}>
                    <option value="none">None</option>
                    <option value="unfinished">Unfinished</option>
                    <option value="finished">Finished</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Garage</label>
                  <select value={garage} onChange={e => setGarage(e.target.value)} style={inputStyle}>
                    <option value="none">None</option>
                    <option value="attached">Attached</option>
                    <option value="detached">Detached</option>
                    <option value="carport">Carport</option>
                  </select>
                </div>
              </div>
              {garage !== 'none' && (
                <div>
                  <label style={labelStyle}>Garage spaces</label>
                  <input value={garageSpaces} onChange={e => setGarageSpaces(e.target.value)} style={inputStyle} placeholder="2" type="number" />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Driveway type</label>
                  <select value={driveType} onChange={e => setDriveType(e.target.value)} style={inputStyle}>
                    <option value="unknown">Unknown</option>
                    <option value="asphalt">Asphalt</option>
                    <option value="concrete">Concrete</option>
                    <option value="pavers">Pavers</option>
                    <option value="gravel">Gravel</option>
                    <option value="dirt">Dirt</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Lot size (optional)</label>
                  <input value={lotSize} onChange={e => setLotSize(e.target.value)} style={inputStyle} placeholder="e.g. 0.25 acres" />
                </div>
              </div>

              {/* Checkboxes */}
              <div style={{ background: '#F8F4EE', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F', marginBottom: '12px' }}>Additional features</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <CheckboxRow label="Pool" checked={pool} onChange={setPool} />
                  <CheckboxRow label="Hot tub" checked={hotTub} onChange={setHotTub} />
                  <CheckboxRow label="HOA" checked={hoa} onChange={setHoa} />
                  <CheckboxRow label="Fireplace / chimney" checked={hasFireplace} onChange={setHasFireplace} />
                  <CheckboxRow label="Sump pump" checked={hasSumpPump} onChange={setHasSumpPump} />
                  <CheckboxRow label="Irrigation system" checked={hasIrrigation} onChange={setHasIrrigation} />
                  <CheckboxRow label="Backup generator" checked={hasGenerator} onChange={setHasGenerator} />
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

        {/* STEP 2 — Products */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '6px' }}>Your Products</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '24px' }}>Step 2 of 3 — Tell us about your home's systems and components. Leave blank if unknown.</p>

            <ProductSection system="roof" icon="🏠" title="Roof" fields={[
              { key: 'install_year', label: 'Year installed / last replaced', type: 'year' },
              { key: 'material', label: 'Material', type: 'select', options: ['Asphalt shingle', 'Metal', 'Tile', 'Wood shake', 'Flat / TPO', 'Slate'] },
              { key: 'ever_replaced', label: 'Has the roof ever been fully replaced?', type: 'checkbox' },
              { key: 'storm_damage_unaddressed', label: 'Had hail or wind storm damage without a professional inspection after?', type: 'checkbox' },
            ]} />

            <ProductSection system="siding" icon="🏗️" title="Siding" fields={[
              { key: 'install_year', label: 'Year installed / last replaced', type: 'year' },
              { key: 'material', label: 'Material', type: 'select', options: ['Vinyl', 'Fiber cement', 'Wood', 'Brick', 'Stucco', 'Aluminum', 'Stone'] },
              { key: 'ever_replaced', label: 'Has the siding ever been replaced?', type: 'checkbox' },
              { key: 'storm_damage_unaddressed', label: 'Storm damage without inspection?', type: 'checkbox' },
            ]} />

            <ProductSection system="windows" icon="🪟" title="Windows" fields={[
              { key: 'install_year', label: 'Year installed / last replaced', type: 'year' },
              { key: 'product_type', label: 'Type', type: 'select', options: ['Single pane', 'Double pane', 'Triple pane'] },
              { key: 'count', label: 'Approximate number of windows', type: 'number' },
              { key: 'ever_replaced', label: 'Have windows ever been replaced?', type: 'checkbox' },
            ]} />

            <ProductSection system="doors" icon="🚪" title="Exterior Doors" fields={[
              { key: 'install_year', label: 'Year installed / last replaced', type: 'year' },
              { key: 'material', label: 'Material', type: 'select', options: ['Fiberglass', 'Steel', 'Wood', 'Composite'] },
              { key: 'ever_replaced', label: 'Have doors ever been replaced?', type: 'checkbox' },
            ]} />

            <ProductSection system="gutters" icon="🌧️" title="Gutters & Downspouts" fields={[
              { key: 'install_year', label: 'Year installed / last replaced', type: 'year' },
              { key: 'material', label: 'Material', type: 'select', options: ['Aluminum', 'Copper', 'Vinyl', 'Steel', 'Zinc'] },
              { key: 'cleaned_regularly', label: 'Cleaned at least once per year?', type: 'checkbox' },
              { key: 'ever_replaced', label: 'Have gutters ever been replaced?', type: 'checkbox' },
            ]} />

            <ProductSection system="deck" icon="🪵" title="Deck / Patio" fields={[
              { key: 'install_year', label: 'Year installed / last replaced', type: 'year' },
              { key: 'material', label: 'Material', type: 'select', options: ['Pressure treated wood', 'Cedar', 'Composite', 'PVC', 'Hardwood', 'Concrete', 'Pavers'] },
              { key: 'ever_replaced', label: 'Has the deck ever been replaced?', type: 'checkbox' },
            ]} />

            <ProductSection system="driveway" icon="🛣️" title="Driveway" fields={[
              { key: 'install_year', label: 'Year installed / last sealed or replaced', type: 'year' },
              { key: 'ever_replaced', label: 'Has the driveway ever been replaced?', type: 'checkbox' },
            ]} />

            <ProductSection system="fencing" icon="🔒" title="Fencing" fields={[
              { key: 'install_year', label: 'Year installed', type: 'year' },
              { key: 'material', label: 'Material', type: 'select', options: ['Wood', 'Vinyl', 'Aluminum', 'Chain link', 'Wrought iron', 'Composite'] },
              { key: 'ever_replaced', label: 'Has fencing ever been replaced?', type: 'checkbox' },
            ]} />

            <ProductSection system="hvac" icon="🌡️" title="HVAC System" fields={[
              { key: 'install_year', label: 'Year installed / last replaced', type: 'year' },
              { key: 'product_type', label: 'Type', type: 'select', options: ['Central air / gas furnace', 'Heat pump', 'Mini-split', 'Boiler', 'Window units', 'Radiant heat'] },
              { key: 'ever_replaced', label: 'Has HVAC ever been fully replaced?', type: 'checkbox' },
              { key: 'storm_damage_unaddressed', label: 'Any known issues or concerns?', type: 'checkbox' },
            ]} />

            <ProductSection system="water_heater" icon="🔥" title="Water Heater" fields={[
              { key: 'install_year', label: 'Year installed / last replaced', type: 'year' },
              { key: 'product_type', label: 'Type', type: 'select', options: ['Tank (gas)', 'Tank (electric)', 'Tankless (gas)', 'Tankless (electric)', 'Heat pump water heater'] },
              { key: 'ever_replaced', label: 'Has water heater ever been replaced?', type: 'checkbox' },
            ]} />

            <ProductSection system="electrical" icon="⚡" title="Electrical Panel" fields={[
              { key: 'install_year', label: 'Year installed / last updated', type: 'year' },
              { key: 'ever_replaced', label: 'Has panel ever been replaced or upgraded?', type: 'checkbox' },
              { key: 'known_issues', label: 'Any known issues (flickering lights, tripped breakers, etc.)?', type: 'text' },
            ]} />

            <ProductSection system="plumbing" icon="💧" title="Plumbing" fields={[
              { key: 'product_type', label: 'Pipe material', type: 'select', options: ['Copper', 'PVC / CPVC', 'PEX', 'Galvanized steel', 'Cast iron', 'Mixed / Unknown'] },
              { key: 'ever_replaced', label: 'Has plumbing ever been replaced or repiped?', type: 'checkbox' },
            ]} />

            {hasFireplace && (
              <ProductSection system="chimney" icon="🔥" title="Fireplace / Chimney" fields={[
                { key: 'install_year', label: 'Year last inspected or serviced', type: 'year' },
                { key: 'ever_replaced', label: 'Has chimney liner ever been replaced?', type: 'checkbox' },
                { key: 'known_issues', label: 'Any known issues?', type: 'text' },
              ]} />
            )}

            {hasSumpPump && (
              <ProductSection system="sump_pump" icon="💦" title="Sump Pump" fields={[
                { key: 'install_year', label: 'Year installed / last replaced', type: 'year' },
                { key: 'ever_replaced', label: 'Has sump pump ever been replaced?', type: 'checkbox' },
              ]} />
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
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

        {/* STEP 3 — Goals */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '6px' }}>Your Goals</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '24px' }}>Step 3 of 3 — Helps us personalize your score and recommendations</p>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={labelStyle}>DIY comfort level</label>
                <p style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '10px' }}>1 = I hire everything out · 5 = I do it all myself</p>
                <div style={{ display: 'flex', gap: '8px' }}>
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

              <div>
                <label style={labelStyle}>Anything coming up? (optional)</label>
                <textarea
                  value={upcomingPlans}
                  onChange={e => setUpcomingPlans(e.target.value)}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="e.g. Planning a kitchen renovation, insurance renewal coming up, refinancing next year..."
                />
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

        {/* STEP 4 — Score reveal */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '16px' }}>Your home health score</p>
            <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 24px' }}>
              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="58" fill="none" stroke="#EDE8E0" strokeWidth="12" />
                <circle cx="70" cy="70" r="58" fill="none" stroke="#3D7A5A" strokeWidth="12"
                  strokeDasharray="364"
                  strokeDashoffset={364 - (364 * score / 100)}
                  strokeLinecap="round" />
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
            <p style={{ fontSize: '14px', color: '#8A8A82', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto 28px' }}>
              Your score is based on your system ages, storm history, maintenance record, and goals. Log contractor jobs over time to improve it.
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