'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

const SHOW_SPONSORED = false

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

const SYSTEM_MATERIALS: Record<string, string[]> = {
  roof: ['Asphalt shingle', 'Metal', 'Tile', 'Wood shake', 'Flat / TPO', 'Slate'],
  siding: ['Vinyl', 'Fiber cement', 'Wood', 'Brick', 'Stucco', 'Aluminum'],
  windows: ['Single pane', 'Double pane', 'Triple pane'],
  doors: ['Fiberglass', 'Steel', 'Wood'],
  gutters: ['Aluminum', 'Copper', 'Vinyl', 'Steel'],
  deck: ['Pressure treated wood', 'Cedar', 'Composite', 'Concrete', 'Pavers'],
  driveway: ['Asphalt', 'Concrete', 'Pavers', 'Gravel'],
  fencing: ['Wood', 'Vinyl', 'Aluminum', 'Chain link'],
  hvac: ['Central air / gas furnace', 'Heat pump', 'Mini-split', 'Boiler', 'Radiant heat'],
  water_heater: ['Tank (gas)', 'Tank (electric)', 'Tankless (gas)', 'Tankless (electric)'],
  plumbing: ['Copper', 'PVC / CPVC', 'PEX', 'Galvanized steel', 'Mixed / Unknown'],
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

function getSmartTasks(systems: any[], score: any, weather: any): any[] {
  const tasks: any[] = []
  const month = new Date().getMonth()
  const isSpring = month >= 2 && month <= 4
  const isFall = month >= 8 && month <= 10
  const isWinter = month === 11 || month <= 1
  const isSummer = month >= 5 && month <= 7

  // Storm-based tasks
  if (weather?.recentStorm) {
    weather.recentStorm.systems.forEach((sys: string) => {
      tasks.push({
        id: `storm-${sys}`,
        title: `Inspect ${sys.replace(/_/g, ' ')} after ${weather.recentStorm.label.toLowerCase()}`,
        description: `A ${weather.recentStorm.label.toLowerCase()} was recorded on ${new Date(weather.recentStorm.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Check for damage before filing any insurance claims.`,
        source: 'smart',
        status: 'todo',
        system_type: sys,
        urgency: 'high'
      })
    })
  }

  // System age-based tasks
  systems.forEach(sys => {
    const condition = getCondition(sys)
    if (condition.label === 'Inspect' || condition.label === 'Priority') {
      tasks.push({
        id: `age-${sys.id}`,
        title: `Schedule ${sys.system_type.replace(/_/g, ' ')} inspection`,
        description: `Your ${sys.system_type.replace(/_/g, ' ')} is approaching or past its expected lifespan. Get an assessment before it becomes an emergency.`,
        source: 'smart',
        status: 'todo',
        system_type: sys.system_type,
        urgency: condition.label === 'Inspect' ? 'high' : 'medium'
      })
    }
  })

  // Seasonal tasks
  if (isSpring) {
    tasks.push(
      { id: 'spring-gutters', title: 'Clean gutters and downspouts', description: 'Remove winter debris and check for damage from ice and snow.', source: 'seasonal', status: 'todo', system_type: 'gutters', urgency: 'medium' },
      { id: 'spring-hvac', title: 'Schedule HVAC tune-up', description: 'Before cooling season — change filters and have the system checked.', source: 'seasonal', status: 'todo', system_type: 'hvac', urgency: 'medium' },
      { id: 'spring-deck', title: 'Inspect and seal deck', description: 'Check for loose boards, rot, and apply sealant if needed.', source: 'seasonal', status: 'todo', system_type: 'deck', urgency: 'low' },
      { id: 'spring-windows', title: 'Check window and door seals', description: 'Look for gaps in caulking and weatherstripping after winter.', source: 'seasonal', status: 'todo', system_type: 'windows', urgency: 'low' }
    )
  }
  if (isFall) {
    tasks.push(
      { id: 'fall-gutters', title: 'Clean gutters before winter', description: 'Remove leaves and debris to prevent ice dams and water damage.', source: 'seasonal', status: 'todo', system_type: 'gutters', urgency: 'medium' },
      { id: 'fall-hvac', title: 'Service heating system', description: 'Schedule a furnace or heat pump tune-up before cold weather.', source: 'seasonal', status: 'todo', system_type: 'hvac', urgency: 'high' },
      { id: 'fall-pipes', title: 'Winterize outdoor plumbing', description: 'Shut off and drain outdoor faucets and irrigation systems.', source: 'seasonal', status: 'todo', system_type: 'plumbing', urgency: 'medium' }
    )
  }
  if (isWinter) {
    tasks.push(
      { id: 'winter-pipes', title: 'Check pipes in unheated spaces', description: 'Insulate exposed pipes in basement, garage, and crawl spaces.', source: 'seasonal', status: 'todo', system_type: 'plumbing', urgency: 'high' },
      { id: 'winter-roof', title: 'Monitor roof for ice dams', description: 'After heavy snow, check for ice buildup at roof edges.', source: 'seasonal', status: 'todo', system_type: 'roof', urgency: 'medium' }
    )
  }
  if (isSummer) {
    tasks.push(
      { id: 'summer-ac', title: 'Check AC performance', description: 'Test cooling efficiency and change filters if needed.', source: 'seasonal', status: 'todo', system_type: 'hvac', urgency: 'low' },
      { id: 'summer-roof', title: 'Inspect roof and attic ventilation', description: 'Summer heat can accelerate shingle deterioration. Check ventilation.', source: 'seasonal', status: 'todo', system_type: 'roof', urgency: 'low' }
    )
  }

  return tasks
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [allHomes, setAllHomes] = useState<any[]>([])
  const [home, setHome] = useState<any>(null)
  const [details, setDetails] = useState<any>(null)
  const [systems, setSystems] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [score, setScore] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editingHome, setEditingHome] = useState(false)
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null)
  const [homeEdits, setHomeEdits] = useState<any>({})
  const [systemEdits, setSystemEdits] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [weather, setWeather] = useState<any>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [showStormDetail, setShowStormDetail] = useState(false)
  const [showPropertySwitcher, setShowPropertySwitcher] = useState(false)

  // Task state
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [newTaskAssigned, setNewTaskAssigned] = useState('')

  const loadHomeData = async (homeId: string) => {
    const [{ data: detailData }, { data: systemData }, { data: jobData }, { data: scoreData }, { data: taskData }, { data: memberData }] = await Promise.all([
      supabase.from('home_details').select('*').eq('home_id', homeId).single(),
      supabase.from('home_systems').select('*').eq('home_id', homeId),
      supabase.from('contractor_jobs').select('*').eq('home_id', homeId).order('job_date', { ascending: false }),
      supabase.from('health_scores').select('*').eq('home_id', homeId).order('calculated_at', { ascending: false }).limit(1),
      supabase.from('home_tasks').select('*').eq('home_id', homeId).order('created_at', { ascending: false }),
      supabase.from('home_members').select('*').eq('home_id', homeId).eq('status', 'active')
    ])
    setDetails(detailData)
    setSystems(systemData || [])
    setJobs(jobData || [])
    if (scoreData && scoreData.length > 0) setScore(scoreData[0])
    setTasks(taskData || [])
    setMembers(memberData || [])
  }

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)

      const { data: homes } = await supabase
        .from('homes').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (homes && homes.length > 0) {
        setAllHomes(homes)
        setHome(homes[0])

        if (homes[0].city || homes[0].zip) {
          fetch(`/api/weather?city=${encodeURIComponent(homes[0].city || '')}&state=${encodeURIComponent(homes[0].state || '')}&zip=${encodeURIComponent(homes[0].zip || '')}`)
            .then(r => r.json())
            .then(data => { if (!data.error) setWeather(data) })
            .finally(() => setWeatherLoading(false))
        } else {
          setWeatherLoading(false)
        }

        await loadHomeData(homes[0].id)
      } else {
        window.location.replace('/onboarding')
        return
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const switchHome = async (selectedHome: any) => {
    setHome(selectedHome)
    setShowPropertySwitcher(false)
    setLoading(true)
    await loadHomeData(selectedHome.id)
    setLoading(false)
  }

  const startEditHome = () => {
    setHomeEdits({
      address: home?.address || '',
      city: home?.city || '',
      state: home?.state || '',
      zip: home?.zip || '',
      year_built: home?.year_built || '',
      home_type: home?.home_type || 'single_family',
      sqft: home?.sqft || '',
      bedrooms: details?.bedrooms || '',
      bathrooms: details?.bathrooms || '',
      basement: details?.basement || 'none',
      garage: details?.garage || 'none',
      pool: details?.pool || false,
      hoa: details?.hoa || false,
      has_fireplace: details?.has_fireplace || false,
      has_sump_pump: details?.has_sump_pump || false,
      has_irrigation: details?.has_irrigation || false,
      has_generator: details?.has_generator || false,
      lot_size: details?.lot_size || '',
    })
    setEditingHome(true)
  }

  const saveHome = async () => {
    setSaving(true)
    const { data: updatedHome } = await supabase.from('homes').update({
      address: homeEdits.address, city: homeEdits.city, state: homeEdits.state,
      zip: homeEdits.zip, year_built: parseInt(homeEdits.year_built) || null,
      home_type: homeEdits.home_type, sqft: parseInt(homeEdits.sqft) || null,
    }).eq('id', home.id).select().single()
    if (updatedHome) setHome(updatedHome)

    const detailUpdate = {
      bedrooms: parseInt(homeEdits.bedrooms) || null,
      bathrooms: parseFloat(homeEdits.bathrooms) || null,
      basement: homeEdits.basement, garage: homeEdits.garage,
      pool: homeEdits.pool, hoa: homeEdits.hoa,
      has_fireplace: homeEdits.has_fireplace, has_sump_pump: homeEdits.has_sump_pump,
      has_irrigation: homeEdits.has_irrigation, has_generator: homeEdits.has_generator,
      lot_size: homeEdits.lot_size,
    }

    if (details) {
      const { data: updatedDetails } = await supabase.from('home_details').update(detailUpdate).eq('home_id', home.id).select().single()
      if (updatedDetails) setDetails(updatedDetails)
    } else {
      const { data: newDetails } = await supabase.from('home_details').insert({ home_id: home.id, ...detailUpdate }).select().single()
      if (newDetails) setDetails(newDetails)
    }
    setEditingHome(false)
    setSaving(false)
  }

  const startEditSystem = (sys: any) => {
    setSystemEdits({
      install_year: sys.install_year || '', material: sys.material || '',
      product_type: sys.product_type || '', ever_replaced: sys.ever_replaced || false,
      replacement_year: sys.replacement_year || '', under_warranty: sys.under_warranty || false,
      storm_damage_unaddressed: sys.storm_damage_unaddressed || false,
      known_issues: sys.known_issues || '', notes: sys.notes || '',
    })
    setEditingSystemId(sys.id)
  }

  const saveSystem = async (sysId: string) => {
    setSaving(true)
    const effectiveYear = systemEdits.replacement_year || systemEdits.install_year
    const age = effectiveYear ? new Date().getFullYear() - parseInt(effectiveYear) : null
    const { data: updated } = await supabase.from('home_systems').update({
      install_year: parseInt(systemEdits.install_year) || null,
      material: systemEdits.material || null, product_type: systemEdits.product_type || null,
      ever_replaced: systemEdits.ever_replaced, replacement_year: parseInt(systemEdits.replacement_year) || null,
      under_warranty: systemEdits.under_warranty, storm_damage_unaddressed: systemEdits.storm_damage_unaddressed,
      known_issues: systemEdits.known_issues || null, notes: systemEdits.notes || null, age_years: age,
    }).eq('id', sysId).select().single()
    if (updated) setSystems(prev => prev.map(s => s.id === sysId ? updated : s))

    const { data: newScore } = await supabase.rpc('recalculate_health_score', { p_home_id: home.id })
    if (newScore) {
      const { data: updatedScore } = await supabase.from('health_scores').select('*').eq('home_id', home.id).single()
      if (updatedScore) setScore(updatedScore)
    }

    setEditingSystemId(null)
    setSaving(false)
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return
    const { data: { user: u } } = await supabase.auth.getUser()
    const { data } = await supabase.from('home_tasks').insert({
      home_id: home.id,
      created_by: u!.id,
      assigned_to: newTaskAssigned || null,
      title: newTaskTitle,
      description: newTaskDesc || null,
      source: 'custom',
      status: 'todo',
      due_date: newTaskDue || null,
    }).select().single()
    if (data) setTasks(prev => [data, ...prev])
    setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskDue(''); setNewTaskAssigned('')
    setShowAddTask(false)
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    await supabase.from('home_tasks').update({
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null
    }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, completed_at: status === 'done' ? new Date().toISOString() : null } : t))
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from('home_tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This will permanently delete all your homes, systems, contractor jobs, and health scores. This cannot be undone.')) return
    if (!window.confirm('Last chance — this is permanent and cannot be reversed.')) return
    setDeletingAccount(true)
    const { error } = await supabase.rpc('delete_user_account')
    if (error) { alert('Error deleting account: ' + error.message); setDeletingAccount(false) }
    else { await supabase.auth.signOut(); window.location.href = '/' }
  }

  if (loading) return (
    <div style={{ background: '#F8F4EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#8A8A82' }}>Loading your home...</p>
    </div>
  )

  const scoreValue = score?.total_score || 0
  const tabs = ['overview', 'systems', 'log', 'report']
  const tabLabels: Record<string, string> = { overview: 'Overview', systems: 'Systems', log: 'Contractor Log', report: 'Report Card' }
  const alertSystems = systems.filter(s => ['Inspect', 'Priority'].includes(getCondition(s).label))
  const firstName = user?.email?.split('@')[0]?.split('.')[0]
  const displayName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : 'there'
  const smartTasks = getSmartTasks(systems, score, weather)
  const customTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')

  const inputStyle = {
    width: '100%', padding: '7px 10px',
    border: '1px solid rgba(30,58,47,0.2)', borderRadius: '6px',
    fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', color: '#1A1A18',
    boxSizing: 'border-box' as const
  }

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      {/* Dashboard header */}
      <div style={{ background: '#1E3A2F', padding: '28px 28px 0' }}>
        <div style={{ paddingBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '4px' }}>Welcome back</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#F8F4EE', fontWeight: 400 }}>{displayName}</div>

          {/* Property switcher */}
          <div style={{ position: 'relative', display: 'inline-block', marginTop: '4px' }}>
            <button
              onClick={() => setShowPropertySwitcher(!showPropertySwitcher)}
              style={{ background: 'none', border: 'none', cursor: allHomes.length > 1 ? 'pointer' : 'default', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span style={{ fontSize: '13px', color: 'rgba(248,244,238,0.6)' }}>
                {home?.address}{home?.city ? `, ${home.city}` : ''}{home?.state ? `, ${home.state}` : ''}
              </span>
              {allHomes.length > 1 && (
                <span style={{ fontSize: '11px', color: 'rgba(248,244,238,0.4)' }}>▾</span>
              )}
            </button>

            {showPropertySwitcher && allHomes.length > 1 && (
              <div style={{
                position: 'absolute', top: '28px', left: 0, background: '#fff',
                borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                border: '1px solid rgba(30,58,47,0.11)', overflow: 'hidden',
                zIndex: 300, minWidth: '280px'
              }}>
                {allHomes.map(h => (
                  <button
                    key={h.id}
                    onClick={() => switchHome(h)}
                    style={{
                      display: 'block', width: '100%', padding: '12px 16px',
                      background: h.id === home?.id ? '#F8F4EE' : '#fff',
                      border: 'none', borderBottom: '1px solid rgba(30,58,47,0.06)',
                      cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif"
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{h.address}</div>
                    <div style={{ fontSize: '11px', color: '#8A8A82' }}>{h.city}{h.state ? `, ${h.state}` : ''}</div>
                  </button>
                ))}
                <a href="/onboarding" style={{
                  display: 'block', padding: '12px 16px', fontSize: '13px',
                  color: '#3D7A5A', textDecoration: 'none', fontWeight: 500,
                  borderTop: '1px solid rgba(30,58,47,0.08)'
                }}>+ Add another property</a>
              </div>
            )}
          </div>
        </div>

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

      <div style={{ padding: '24px 28px 48px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
            <div>
              {/* Alert banner */}
              {alertSystems.length > 0 && (
                <div style={{ background: '#FDECEA', border: '1px solid rgba(139,58,42,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#9B2C2C', marginBottom: '2px' }}>⚠️ {alertSystems.length} system{alertSystems.length > 1 ? 's' : ''} need attention</div>
                    <div style={{ fontSize: '12px', color: '#7A3A2A' }}>{alertSystems.map(s => s.system_type.replace(/_/g, ' ')).join(', ')}</div>
                  </div>
                  <button onClick={() => setActiveTab('systems')} style={{ background: 'none', border: '1px solid rgba(139,58,42,0.3)', color: '#9B2C2C', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>View →</button>
                </div>
              )}

              {/* Score */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div style={{ width: '80px', height: '80px', flexShrink: 0, position: 'relative' }}>
                  <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#EDE8E0" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#3D7A5A" strokeWidth="8"
                      strokeDasharray="201" strokeDashoffset={201 - (201 * scoreValue / 100)} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#1E3A2F', fontWeight: 600 }}>{scoreValue}</div>
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
                      <div key={pill.label} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A', border: '1px solid rgba(30,58,47,0.14)' }}>{pill.label}: {pill.value}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unified Tasks + Checklist */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ background: '#1E3A2F', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#F8F4EE', fontWeight: 400 }}>Home To-Do</h4>
                  <button
                    onClick={() => setShowAddTask(!showAddTask)}
                    style={{ background: 'rgba(248,244,238,0.1)', border: '1px solid rgba(248,244,238,0.2)', color: '#F8F4EE', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >+ Add task</button>
                </div>

                {/* Add task form */}
                {showAddTask && (
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)', background: '#F8F4EE' }}>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} style={inputStyle} placeholder="Task title" />
                      <input value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} style={inputStyle} placeholder="Description (optional)" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} style={inputStyle} />
                        {members.length > 0 && (
                          <select value={newTaskAssigned} onChange={e => setNewTaskAssigned(e.target.value)} style={inputStyle}>
                            <option value="">Assign to (optional)</option>
                            {members.map(m => <option key={m.user_id} value={m.user_id}>{m.user_id}</option>)}
                          </select>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={addTask} style={{ flex: 1, background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Add task</button>
                        <button onClick={() => setShowAddTask(false)} style={{ flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '8px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom tasks */}
                {customTasks.map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '13px 20px', borderBottom: '1px solid rgba(30,58,47,0.06)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, background: '#EAF2EC' }}>✏️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', marginBottom: '2px', fontWeight: 500 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>{task.description}</div>}
                      {task.due_date && <div style={{ fontSize: '11px', color: '#C47B2B' }}>Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <select
                        value={task.status}
                        onChange={e => updateTaskStatus(task.id, e.target.value)}
                        style={{ fontSize: '11px', padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(30,58,47,0.2)', background: '#fff', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}
                      >
                        <option value="todo">To do</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Done ✓</option>
                      </select>
                      <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#8A8A82', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
                    </div>
                  </div>
                ))}

                {/* Smart recommendations */}
                {smartTasks.slice(0, 4).map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '13px 20px', borderBottom: '1px solid rgba(30,58,47,0.06)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, background: item.urgency === 'high' ? '#FDECEA' : item.urgency === 'medium' ? '#FBF0DC' : '#EAF2EC' }}>
                      {item.source === 'smart' ? '🧠' : item.urgency === 'high' ? '🌡️' : item.urgency === 'medium' ? '📋' : '🌿'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', marginBottom: '2px' }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: '#8A8A82' }}>{item.description}</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px', flexShrink: 0, background: item.urgency === 'high' ? '#FDECEA' : item.urgency === 'medium' ? '#FBF0DC' : '#EAF2EC', color: item.urgency === 'high' ? '#9B2C2C' : item.urgency === 'medium' ? '#7A4A10' : '#3D7A5A' }}>
                      {item.source === 'smart' ? 'Smart' : 'Seasonal'}
                    </span>
                  </div>
                ))}

                {customTasks.length === 0 && smartTasks.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#8A8A82', fontSize: '13px' }}>
                    No tasks right now — add your own or they'll appear based on your home data.
                  </div>
                )}

                {/* Done tasks collapsed */}
                {doneTasks.length > 0 && (
                  <div style={{ padding: '10px 20px', background: '#F8F4EE', borderTop: '1px solid rgba(30,58,47,0.06)' }}>
                    <div style={{ fontSize: '12px', color: '#8A8A82' }}>✓ {doneTasks.length} completed task{doneTasks.length !== 1 ? 's' : ''}</div>
                  </div>
                )}
              </div>

              {/* Systems grid */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(30,58,47,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 500 }}>Home Systems</h4>
                  <button onClick={() => setActiveTab('systems')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#3D7A5A', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>View all →</button>
                </div>
                {systems.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center' }}><p style={{ fontSize: '13px', color: '#8A8A82' }}>No systems logged yet.</p></div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(30,58,47,0.08)' }}>
                    {systems.slice(0, 6).map(sys => {
                      const condition = getCondition(sys)
                      return (
                        <div key={sys.id} style={{ background: '#fff', padding: '16px 14px', cursor: 'pointer' }} onClick={() => { setActiveTab('systems'); startEditSystem(sys) }}>
                          <div style={{ fontSize: '20px', marginBottom: '6px' }}>{SYSTEM_ICONS[sys.system_type] || '🔧'}</div>
                          <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '3px' }}>
                            {sys.system_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()).replace('Hvac', 'HVAC')}
                          </div>
                          <div style={{ fontSize: '11px', color: condition.textColor, fontWeight: 500 }}>{condition.label}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              {/* Weather + Storm */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
                  {weatherLoading ? (
                    <div style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '32px' }}>⛅</div>
                      <div style={{ fontSize: '13px', color: '#8A8A82' }}>Loading weather...</div>
                    </div>
                  ) : weather ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px' }}>
                        <div style={{ fontSize: '32px' }}>{weather.emoji}</div>
                        <div>
                          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#1E3A2F' }}>{weather.temp}°</div>
                          <div style={{ fontSize: '12px', color: '#8A8A82' }}>{home?.city}, {home?.state} · {weather.desc}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#7A4A10', background: '#FBF0DC', padding: '9px 16px', borderTop: '1px solid rgba(196,123,43,0.14)' }}>
                        {weather.tip}
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px' }}>
                      <div style={{ fontSize: '32px' }}>⛅</div>
                      <div style={{ fontSize: '13px', color: '#8A8A82' }}>Weather unavailable</div>
                    </div>
                  )}
                </div>

                {weather?.recentStorm && (
                  <div style={{ background: '#FBF0DC', border: '1px solid rgba(196,123,43,0.2)', borderRadius: '12px', padding: '14px 16px', marginTop: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#7A4A10', marginBottom: '3px' }}>
                      ⚠️ {weather.recentStorm.label} recorded
                    </div>
                    <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '6px' }}>
                      {new Date(weather.recentStorm.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {weather.recentStorm.windspeed > 0 && ` · ${Math.round(weather.recentStorm.windspeed)} mph winds`}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {weather.recentStorm.systems.map((s: string) => (
                        <span key={s} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(196,123,43,0.15)', color: '#7A4A10', textTransform: 'capitalize' }}>
                          {s.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => setShowStormDetail(!showStormDetail)} style={{ background: 'none', border: '1px solid rgba(122,74,16,0.3)', color: '#7A4A10', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      {showStormDetail ? 'Hide inspection guide' : 'What to check →'}
                    </button>

                    {showStormDetail && weather.inspectionGuides && (
                      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(196,123,43,0.2)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#7A4A10', marginBottom: '8px' }}>Self-inspect checklist — you are in control</div>
                        <div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '12px', lineHeight: 1.6 }}>
                          Check these yourself first before calling anyone. A legitimate inspector will never pressure you into same-day decisions.
                        </div>
                        {weather.inspectionGuides.map((guide: any, i: number) => (
                          <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F', marginBottom: '4px' }}>{guide.what}</div>
                            <div style={{ fontSize: '11px', color: '#8A8A82', lineHeight: 1.6 }}>{guide.look_for}</div>
                          </div>
                        ))}
                        <div style={{ background: '#EAF2EC', borderRadius: '8px', padding: '10px 12px', marginTop: '10px' }}>
                          <div style={{ fontSize: '11px', color: '#3D7A5A', lineHeight: 1.6 }}>
                            💡 <strong>Insurance tip:</strong> Document everything with photos before any repairs. Contact your insurance company before hiring a contractor.
                          </div>
                        </div>
                        <button onClick={() => window.location.href = '/log'} style={{ marginTop: '10px', width: '100%', background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                          Log an inspection when ready →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Home details */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 500 }}>Home details</h4>
                  {!editingHome ? (
                    <button onClick={startEditHome} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setEditingHome(false)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                      <button onClick={saveHome} disabled={saving} style={{ background: '#1E3A2F', border: 'none', color: '#F8F4EE', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{saving ? 'Saving...' : 'Save'}</button>
                    </div>
                  )}
                </div>

                {!editingHome ? (
                  <div>
                    {[
                      { label: 'Address', value: home?.address },
                      { label: 'City', value: `${home?.city || ''}${home?.state ? `, ${home.state}` : ''}${home?.zip ? ` ${home.zip}` : ''}` },
                      { label: 'Year built', value: home?.year_built },
                      { label: 'Home type', value: home?.home_type?.replace('_', ' ') },
                      { label: 'Square footage', value: home?.sqft ? `${home.sqft.toLocaleString()} sq ft` : null },
                      { label: 'Bedrooms', value: details?.bedrooms },
                      { label: 'Bathrooms', value: details?.bathrooms },
                      { label: 'Basement', value: details?.basement },
                      { label: 'Garage', value: details?.garage },
                      { label: 'Pool', value: details?.pool ? 'Yes' : null },
                      { label: 'HOA', value: details?.hoa ? 'Yes' : null },
                      { label: 'Fireplace', value: details?.has_fireplace ? 'Yes' : null },
                      { label: 'Sump pump', value: details?.has_sump_pump ? 'Yes' : null },
                      { label: 'Jobs logged', value: jobs.length },
                      { label: 'Systems tracked', value: systems.length },
                    ].filter(s => s.value !== null && s.value !== undefined && s.value !== '' && s.value !== 'none').map(stat => (
                      <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid rgba(30,58,47,0.07)' }}>
                        <span style={{ color: '#8A8A82' }}>{stat.label}</span>
                        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{stat.value}</span>
                      </div>
                    ))}
                    <button onClick={startEditHome} style={{ marginTop: '12px', width: '100%', background: '#F8F4EE', border: '1px dashed rgba(30,58,47,0.2)', color: '#8A8A82', fontSize: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      + Add missing details
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {[
                      { label: 'Address', key: 'address' },
                      { label: 'City', key: 'city' },
                      { label: 'State', key: 'state' },
                      { label: 'ZIP', key: 'zip' },
                      { label: 'Year built', key: 'year_built' },
                      { label: 'Square footage', key: 'sqft' },
                      { label: 'Bedrooms', key: 'bedrooms' },
                      { label: 'Bathrooms', key: 'bathrooms' },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>{field.label}</label>
                        <input value={homeEdits[field.key] || ''} onChange={e => setHomeEdits((prev: any) => ({ ...prev, [field.key]: e.target.value }))} style={inputStyle} />
                      </div>
                    ))}
                    {[
                      { label: 'Home type', key: 'home_type', options: [{ v: 'single_family', l: 'Single family' }, { v: 'townhouse', l: 'Townhouse' }, { v: 'condo', l: 'Condo' }, { v: 'multi_family', l: 'Multi-family' }] },
                      { label: 'Basement', key: 'basement', options: [{ v: 'none', l: 'None' }, { v: 'unfinished', l: 'Unfinished' }, { v: 'finished', l: 'Finished' }, { v: 'partial', l: 'Partial' }] },
                      { label: 'Garage', key: 'garage', options: [{ v: 'none', l: 'None' }, { v: 'attached', l: 'Attached' }, { v: 'detached', l: 'Detached' }, { v: 'carport', l: 'Carport' }] },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>{field.label}</label>
                        <select value={homeEdits[field.key]} onChange={e => setHomeEdits((prev: any) => ({ ...prev, [field.key]: e.target.value }))} style={inputStyle}>
                          {field.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      </div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { label: 'Pool', key: 'pool' },
                        { label: 'HOA', key: 'hoa' },
                        { label: 'Fireplace', key: 'has_fireplace' },
                        { label: 'Sump pump', key: 'has_sump_pump' },
                        { label: 'Irrigation', key: 'has_irrigation' },
                        { label: 'Generator', key: 'has_generator' },
                      ].map(cb => (
                        <label key={cb.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={homeEdits[cb.key] || false} onChange={e => setHomeEdits((prev: any) => ({ ...prev, [cb.key]: e.target.checked }))} style={{ accentColor: '#1E3A2F' }} />
                          {cb.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '14px' }}>Quick actions</h4>
                {[
                  { label: '+ Log a contractor job', href: '/log' },
                  { label: '+ Add another property', href: '/onboarding' },
                  { label: '👥 Browse neighbor reviews', href: '/neighbors' },
                  { label: '📄 View report card', href: '/report' },
                  { label: '📖 Browse guides', href: '/guides' },
                ].map(action => (
                  <a key={action.label} href={action.href} style={{ display: 'block', padding: '9px 0', fontSize: '13px', color: '#1E3A2F', textDecoration: 'none', borderBottom: '1px solid rgba(30,58,47,0.07)' }}>{action.label}</a>
                ))}
              </div>

              {/* Sponsored - hidden until live sponsorship */}
              {SHOW_SPONSORED && (
                <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8A8A82', padding: '6px 14px', background: '#EDE8E0', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>Sponsored</div>
                  <div style={{ padding: '14px 16px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Is your roof ready for summer?</h5>
                    <p style={{ fontSize: '12px', color: '#8A8A82', lineHeight: 1.5, marginBottom: '10px' }}>Free inspection from certified roofing professionals in your area.</p>
                    <button style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Learn more</button>
                  </div>
                </div>
              )}

              {/* Danger zone */}
              <div style={{ background: '#fff', border: '1px solid rgba(155,44,44,0.15)', borderRadius: '16px', padding: '18px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 500, color: '#9B2C2C', marginBottom: '8px' }}>Danger zone</h4>
                <p style={{ fontSize: '12px', color: '#8A8A82', lineHeight: 1.6, marginBottom: '12px' }}>
                  Deleting your account permanently removes all your homes, systems, contractor jobs, and health scores. This cannot be undone.
                </p>
                <button onClick={handleDeleteAccount} disabled={deletingAccount} style={{
                  background: 'none', border: '1px solid rgba(155,44,44,0.3)',
                  color: '#9B2C2C', fontSize: '12px', padding: '8px 14px',
                  borderRadius: '8px', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", width: '100%'
                }}>{deletingAccount ? 'Deleting...' : 'Delete my account'}</button>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEMS TAB */}
        {activeTab === 'systems' && (
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F' }}>Your Home Systems</h2>
              <a href="/report" style={{ fontSize: '13px', color: '#3D7A5A', textDecoration: 'none', fontWeight: 500 }}>Full report card →</a>
            </div>
            {systems.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid rgba(30,58,47,0.11)' }}>
                <p style={{ color: '#8A8A82' }}>No systems tracked yet.</p>
              </div>
            ) : systems.map(sys => {
              const condition = getCondition(sys)
              const effectiveYear = sys.replacement_year || sys.install_year
              const age = effectiveYear ? new Date().getFullYear() - effectiveYear : null
              const lifespan = SYSTEM_LIFESPANS[sys.system_type] || 20
              const pct = age ? Math.min(100, Math.round((age / lifespan) * 100)) : 0
              const isEditing = editingSystemId === sys.id

              return (
                <div key={sys.id} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '28px', flexShrink: 0 }}>{SYSTEM_ICONS[sys.system_type] || '🔧'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 500 }}>
                            {sys.system_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()).replace('Hvac', 'HVAC')}
                          </h4>
                          <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: condition.bg, color: condition.textColor }}>{condition.label}</span>
                          {sys.ever_replaced && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>Replaced {sys.replacement_year || ''}</span>}
                          {sys.under_warranty && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#E6F2F8', color: '#3A7CA8' }}>Under warranty</span>}
                          {sys.storm_damage_unaddressed && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#FDECEA', color: '#9B2C2C' }}>⚠️ Storm damage</span>}
                        </div>
                        {!isEditing ? (
                          <button onClick={() => startEditSystem(sys)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>Edit</button>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => setEditingSystemId(null)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                            <button onClick={() => saveSystem(sys.id)} disabled={saving} style={{ background: '#1E3A2F', border: 'none', color: '#F8F4EE', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{saving ? 'Saving...' : 'Save'}</button>
                          </div>
                        )}
                      </div>

                      {!isEditing ? (
                        <>
                          <div style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '8px' }}>
                            {sys.material && <span>{sys.material} · </span>}
                            {age ? `${age} years old · ${sys.ever_replaced ? `Replaced ${sys.replacement_year}` : `Installed ${sys.install_year}`}` : 'Install year unknown'}
                          </div>
                          {sys.known_issues && <div style={{ fontSize: '12px', color: '#8B3A2A', marginBottom: '8px' }}>⚠️ {sys.known_issues}</div>}
                          {age && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8A8A82', marginBottom: '4px' }}>
                                <span>Lifespan used</span>
                                <span>{pct}% of ~{lifespan} years</span>
                              </div>
                              <div style={{ height: '6px', background: '#EDE8E0', borderRadius: '3px' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: condition.color, borderRadius: '3px' }} />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: 'grid', gap: '10px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid rgba(30,58,47,0.08)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Year installed</label>
                              <input value={systemEdits.install_year} onChange={e => setSystemEdits((p: any) => ({ ...p, install_year: e.target.value }))} style={inputStyle} placeholder="e.g. 2018" />
                            </div>
                            {SYSTEM_MATERIALS[sys.system_type] && (
                              <div>
                                <label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Material / type</label>
                                <select value={systemEdits.material} onChange={e => setSystemEdits((p: any) => ({ ...p, material: e.target.value }))} style={inputStyle}>
                                  <option value="">Unknown</option>
                                  {SYSTEM_MATERIALS[sys.system_type].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={systemEdits.ever_replaced} onChange={e => setSystemEdits((p: any) => ({ ...p, ever_replaced: e.target.checked }))} style={{ accentColor: '#1E3A2F' }} />
                              Ever replaced?
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={systemEdits.under_warranty} onChange={e => setSystemEdits((p: any) => ({ ...p, under_warranty: e.target.checked }))} style={{ accentColor: '#1E3A2F' }} />
                              Under warranty
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={systemEdits.storm_damage_unaddressed} onChange={e => setSystemEdits((p: any) => ({ ...p, storm_damage_unaddressed: e.target.checked }))} style={{ accentColor: '#1E3A2F' }} />
                              Storm damage?
                            </label>
                          </div>
                          {systemEdits.ever_replaced && (
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Year replaced</label>
                              <input value={systemEdits.replacement_year} onChange={e => setSystemEdits((p: any) => ({ ...p, replacement_year: e.target.value }))} style={inputStyle} placeholder="e.g. 2022" />
                            </div>
                          )}
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Known issues or notes</label>
                            <input value={systemEdits.known_issues} onChange={e => setSystemEdits((p: any) => ({ ...p, known_issues: e.target.value }))} style={inputStyle} placeholder="e.g. Slow drain in master bath" />
                          </div>
                        </div>
                      )}
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
                      {job.tags && job.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {job.tags.map((tag: string) => (
                            <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F' }}>{job.final_price ? `$${Number(job.final_price).toLocaleString()}` : '—'}</div>
                      <div style={{ color: '#C47B2B', fontSize: '12px' }}>{'★'.repeat(job.quality_rating)}</div>
                      <div style={{ fontSize: '11px', marginTop: '2px', color: job.is_shared ? '#3D7A5A' : '#8A8A82' }}>{job.is_shared ? '✓ Shared' : 'Private'}</div>
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
            <p style={{ fontSize: '14px', color: '#8A8A82', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              View your full report card with system conditions, home facts, contractor history, and buyer/seller guides.
            </p>
            <a href="/report" style={{ display: 'inline-block', background: '#1E3A2F', color: '#F8F4EE', textDecoration: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>View full report card</a>
          </div>
        )}
      </div>
    </main>
  )
}