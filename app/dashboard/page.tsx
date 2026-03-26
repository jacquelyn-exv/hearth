'use client'

import { useEffect, useState, useRef } from 'react'
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

const DOC_CATEGORIES = [
  { key: 'warranty', label: 'Warranties', icon: '🛡️', color: '#EAF2EC', textColor: '#3D7A5A' },
  { key: 'permit', label: 'Permits & Inspections', icon: '📋', color: '#E6F2F8', textColor: '#3A7CA8' },
  { key: 'manual', label: 'Appliance Manuals', icon: '📖', color: '#FBF0DC', textColor: '#C47B2B' },
  { key: 'insurance', label: 'Insurance Summary', icon: '🏛️', color: '#F5EAE7', textColor: '#8B3A2A' },
  { key: 'invoice', label: 'Invoices & Quotes', icon: '🧾', color: '#EAF2EC', textColor: '#3D7A5A' },
  { key: 'hoa', label: 'HOA Documents', icon: '🏘️', color: '#F0EEF8', textColor: '#5A4A8A' },
  { key: 'inspection', label: 'Inspection Reports', icon: '🔍', color: '#FBF0DC', textColor: '#C47B2B' },
  { key: 'other', label: 'Other', icon: '📁', color: '#F5F5F5', textColor: '#8A8A82' },
]

const DOC_SYSTEMS = [
  'Roof', 'Siding', 'Windows', 'Doors', 'Gutters', 'Deck',
  'Driveway', 'Fencing', 'HVAC', 'Water Heater', 'Electrical',
  'Plumbing', 'Sump Pump', 'Chimney', 'Whole Home', 'Other'
]

function getCondition(sys: any) {
  if (sys.not_applicable) {
    return { label: 'N/A', color: '#8A8A82', bg: '#F5F5F5', textColor: '#8A8A82' }
  }
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

  if (weather?.recentStorm) {
    const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000
    const stormAge = Date.now() - new Date(weather.recentStorm.date).getTime()
    if (stormAge < THREE_WEEKS_MS) {
      const systemList = weather.recentStorm.systems.map((s: string) => s.replace(/_/g, ' ')).join(', ')
      tasks.push({
        id: 'storm-event',
        title: `Walk your property after the ${weather.recentStorm.label.toLowerCase()}`,
        description: `Recorded ${new Date(weather.recentStorm.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Check these areas: ${systemList}. Document anything with photos before calling anyone.`,
        source: 'smart', status: 'todo', system_type: null, urgency: 'high'
      })
    }
  }

  const criticalSystems = systems
    .filter(s => getCondition(s).label === 'Inspect' || getCondition(s).label === 'Priority')
    .sort((a, b) => {
      const order: Record<string, number> = { Inspect: 0, Priority: 1 }
      return order[getCondition(a).label] - order[getCondition(b).label]
    })

  if (criticalSystems.length > 0) {
    const sys = criticalSystems[0]
    const condition = getCondition(sys)
    tasks.push({
      id: `age-${sys.id}`,
      title: `Get your ${sys.system_type.replace(/_/g, ' ')} assessed`,
      description: `${criticalSystems.length > 1 ? `Your ${sys.system_type.replace(/_/g, ' ')} is the most urgent of ${criticalSystems.length} systems nearing end of lifespan.` : `Your ${sys.system_type.replace(/_/g, ' ')} is approaching or past its expected lifespan.`} Get a quote before it becomes an emergency.`,
      source: 'smart', status: 'todo', system_type: sys.system_type,
      urgency: condition.label === 'Inspect' ? 'high' : 'medium'
    })
  }

  if (isSpring) {
    tasks.push(
      { id: 'spring-1', title: 'Clean gutters and check drainage', description: 'Remove winter debris and make sure downspouts are directing water away from your foundation.', source: 'seasonal', status: 'todo', system_type: 'gutters', urgency: 'medium' },
      { id: 'spring-2', title: 'Schedule HVAC tune-up before summer', description: 'Change filters and have the system checked before the cooling season starts.', source: 'seasonal', status: 'todo', system_type: 'hvac', urgency: 'medium' }
    )
  }
  if (isFall) {
    tasks.push(
      { id: 'fall-1', title: 'Clean gutters before winter', description: 'Leaves and debris cause ice dams and water damage. Best done before first freeze.', source: 'seasonal', status: 'todo', system_type: 'gutters', urgency: 'medium' },
      { id: 'fall-2', title: 'Service heating system', description: 'Schedule a furnace or heat pump tune-up before cold weather arrives.', source: 'seasonal', status: 'todo', system_type: 'hvac', urgency: 'high' }
    )
  }
  if (isWinter) {
    tasks.push({ id: 'winter-1', title: 'Check pipes in unheated spaces', description: 'Insulate exposed pipes in basement, garage, and crawl spaces to prevent freezing.', source: 'seasonal', status: 'todo', system_type: 'plumbing', urgency: 'high' })
  }
  if (isSummer) {
    tasks.push({ id: 'summer-1', title: 'Check AC performance and filters', description: 'Test cooling efficiency and replace filters if needed before peak heat.', source: 'seasonal', status: 'todo', system_type: 'hvac', urgency: 'low' })
  }

  return tasks.slice(0, 4)
}

function getCommunityLevel(points: number) {
  if (points >= 1000) return { label: 'Community Champion', emoji: '🏆', next: null, nextPoints: null }
  if (points >= 500) return { label: 'Neighborhood Expert', emoji: '🌟', next: 'Community Champion', nextPoints: 1000 }
  if (points >= 200) return { label: 'Active Homeowner', emoji: '🏡', next: 'Neighborhood Expert', nextPoints: 500 }
  return { label: 'New Homeowner', emoji: '🌱', next: 'Active Homeowner', nextPoints: 200 }
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
  const [docs, setDocs] = useState<any[]>([])
  const [communityScore, setCommunityScore] = useState<any>(null)
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
  const [showStormHistory, setShowStormHistory] = useState(false)
  const [stormHistory, setStormHistory] = useState<any[]>([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [newTaskAssigned, setNewTaskAssigned] = useState('')
  const [dismissedSmartTasks, setDismissedSmartTasks] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('dismissedSmartTasks') || '[]')
    } catch { return [] }
  })
  const [propertyMenuOpen, setPropertyMenuOpen] = useState<string | null>(null)
  const [showClaimedModal, setShowClaimedModal] = useState(false)

  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadCategory, setUploadCategory] = useState('other')
  const [uploadSystem, setUploadSystem] = useState('')
  const [uploadExpires, setUploadExpires] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [docFilter, setDocFilter] = useState('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadHomeData = async (homeId: string) => {
    const [
      { data: detailData }, { data: systemData }, { data: jobData },
      { data: scoreData }, { data: taskData }, { data: memberData },
      { data: docData }
    ] = await Promise.all([
      supabase.from('home_details').select('*').eq('home_id', homeId).single(),
      supabase.from('home_systems').select('*').eq('home_id', homeId),
      supabase.from('contractor_jobs').select('*').eq('home_id', homeId).order('job_date', { ascending: false }),
      supabase.from('health_scores').select('*').eq('home_id', homeId).order('calculated_at', { ascending: false }).limit(1),
      supabase.from('home_tasks').select('*').eq('home_id', homeId).order('created_at', { ascending: false }),
      supabase.from('home_members').select('*').eq('home_id', homeId).eq('status', 'active'),
      supabase.from('home_documents').select('*').eq('home_id', homeId).order('created_at', { ascending: false })
    ])
    setDetails(detailData)
    setSystems(systemData || [])
    setJobs(jobData || [])
    if (scoreData && scoreData.length > 0) setScore(scoreData[0])
    setTasks(taskData || [])
    setMembers(memberData || [])
    setDocs(docData || [])

    const { data: homeZipData } = await supabase.from('homes').select('zip').eq('id', homeId).single()
    if (homeZipData?.zip) {
      const { data: storms } = await supabase
        .from('storm_events')
        .select('*')
        .eq('zip', homeZipData.zip)
        .order('event_date', { ascending: false })
        .limit(20)
      setStormHistory(storms || [])
    }
  }

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)

      const { data: homes } = await supabase
        .from('homes').select('*').eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

      if (homes && homes.length > 0) {
        setAllHomes(homes)
        const primaryHome = homes.find(h => h.is_primary) || homes[0]
        setHome(primaryHome)

        if (primaryHome.city || primaryHome.zip) {
          fetch(`/api/weather?city=${encodeURIComponent(primaryHome.city || '')}&state=${encodeURIComponent(primaryHome.state || '')}&zip=${encodeURIComponent(primaryHome.zip || '')}`)
            .then(r => r.json())
            .then(data => { if (!data.error) setWeather(data) })
            .finally(() => setWeatherLoading(false))
        } else {
          setWeatherLoading(false)
        }

        await loadHomeData(primaryHome.id)

        await supabase.rpc('recalculate_community_score', { p_user_id: user.id })
        const { data: csData } = await supabase.from('community_scores').select('*').eq('user_id', user.id).single()
        if (csData) setCommunityScore(csData)

        if (typeof window !== 'undefined' && window.location.search.includes('claimed=true')) {
          setShowClaimedModal(true)
          window.history.replaceState({}, '', '/dashboard')
        }
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
    setSystems([]); setJobs([]); setTasks([]); setScore(null)
    setDetails(null); setMembers([]); setDocs([])
    setWeather(null); setWeatherLoading(true); setLoading(true)
    setStormHistory([])

    if (selectedHome.city || selectedHome.zip) {
      fetch(`/api/weather?city=${encodeURIComponent(selectedHome.city || '')}&state=${encodeURIComponent(selectedHome.state || '')}&zip=${encodeURIComponent(selectedHome.zip || '')}`)
        .then(r => r.json())
        .then(data => { if (!data.error) setWeather(data) })
        .finally(() => setWeatherLoading(false))
    } else {
      setWeatherLoading(false)
    }

    await loadHomeData(selectedHome.id)
    setLoading(false)
  }

  const setPrimaryHome = async (homeId: string) => {
    await supabase.from('homes').update({ is_primary: false }).eq('user_id', user.id)
    await supabase.from('homes').update({ is_primary: true }).eq('id', homeId)
    setAllHomes(prev => prev.map(h => ({ ...h, is_primary: h.id === homeId })))
    setPropertyMenuOpen(null)
  }

  const markForTransfer = async (homeId: string) => {
    await supabase.from('homes').update({ status: 'for_transfer' }).eq('id', homeId)
    setAllHomes(prev => prev.map(h => h.id === homeId ? { ...h, status: 'for_transfer' } : h))
    setPropertyMenuOpen(null)
  }

  const startEditHome = () => {
    setHomeEdits({
      address: home?.address || '', city: home?.city || '',
      state: home?.state || '', zip: home?.zip || '',
      year_built: home?.year_built || '', home_type: home?.home_type || 'single_family',
      sqft: home?.sqft || '', bedrooms: details?.bedrooms || '',
      bathrooms: details?.bathrooms || '', basement: details?.basement || 'none',
      garage: details?.garage || 'none', pool: details?.pool || false,
      hoa: details?.hoa || false, has_fireplace: details?.has_fireplace || false,
      has_sump_pump: details?.has_sump_pump || false, has_irrigation: details?.has_irrigation || false,
      has_generator: details?.has_generator || false, lot_size: details?.lot_size || '',
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
      install_year: sys.install_year || '',
      material: sys.material || '',
      product_type: sys.product_type || '',
      ever_replaced: sys.ever_replaced || false,
      replacement_year: sys.replacement_year || '',
      under_warranty: sys.under_warranty || false,
      storm_damage_unaddressed: sys.storm_damage_unaddressed || false,
      known_issues: sys.known_issues || '',
      notes: sys.notes || '',
      not_applicable: sys.not_applicable || false,
    })
    setEditingSystemId(sys.id)
  }

  const saveSystem = async (sysId: string) => {
    setSaving(true)
    const effectiveYear = systemEdits.replacement_year || systemEdits.install_year
    const age = effectiveYear && systemEdits.install_year !== 'unknown'
      ? new Date().getFullYear() - parseInt(effectiveYear)
      : null
    const { data: updated } = await supabase.from('home_systems').update({
      install_year: systemEdits.install_year === 'unknown' ? null : parseInt(systemEdits.install_year) || null,
      material: systemEdits.material || null,
      product_type: systemEdits.product_type || null,
      ever_replaced: systemEdits.ever_replaced,
      replacement_year: parseInt(systemEdits.replacement_year) || null,
      under_warranty: systemEdits.under_warranty,
      storm_damage_unaddressed: systemEdits.storm_damage_unaddressed,
      known_issues: systemEdits.known_issues || null,
      notes: systemEdits.notes || null,
      not_applicable: systemEdits.not_applicable || false,
      age_years: age,
    }).eq('id', sysId).select().single()
    if (updated) setSystems(prev => prev.map(s => s.id === sysId ? updated : s))

    const { data: newScore } = await supabase.rpc('recalculate_health_score', { p_home_id: home.id })
    if (newScore) {
      const { data: updatedScore } = await supabase.from('health_scores').select('*').eq('home_id', home.id).order('calculated_at', { ascending: false }).limit(1)
      if (updatedScore && updatedScore.length > 0) setScore(updatedScore[0])
    }
    setEditingSystemId(null)
    setSaving(false)
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return
    const { data: { user: u } } = await supabase.auth.getUser()
    const { data } = await supabase.from('home_tasks').insert({
      home_id: home.id, created_by: u!.id,
      assigned_to: newTaskAssigned || null,
      title: newTaskTitle, description: newTaskDesc || null,
      source: 'custom', status: 'todo', due_date: newTaskDue || null,
    }).select().single()
    if (data) setTasks(prev => [data, ...prev])
    setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskDue(''); setNewTaskAssigned('')
    setShowAddTask(false)
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    await supabase.from('home_tasks').update({
      status, completed_at: status === 'done' ? new Date().toISOString() : null
    }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))

    if (home?.id) {
      await supabase.rpc('recalculate_health_score', { p_home_id: home.id })
      const { data: updatedScore } = await supabase
        .from('health_scores')
        .select('*')
        .eq('home_id', home.id)
        .order('calculated_at', { ascending: false })
        .limit(1)
      if (updatedScore && updatedScore.length > 0) setScore(updatedScore[0])
    }
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from('home_tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(f.type)) { setUploadError('Only PDF, JPG, and PNG files are accepted.'); return }
    if (f.size > 10 * 1024 * 1024) { setUploadError('File must be under 10MB.'); return }
    setUploadError('')
    setUploadFile(f)
    if (!uploadName) setUploadName(f.name.replace(/\.[^/.]+$/, ''))
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) { setUploadError('Please select a file and enter a name.'); return }
    setUploading(true)
    setUploadError('')
    try {
      const ext = uploadFile.name.split('.').pop()
      const filePath = `${user.id}/${home.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('home-documents').upload(filePath, uploadFile, { contentType: uploadFile.type })
      if (uploadErr) throw uploadErr
      const { data: doc } = await supabase.from('home_documents').insert({
        home_id: home.id, user_id: user.id,
        name: uploadName.trim(), description: uploadDesc.trim() || null,
        category: uploadCategory, system_type: uploadSystem || null,
        file_path: filePath, file_size: uploadFile.size, file_type: uploadFile.type,
        expires_at: uploadExpires || null,
      }).select().single()
      if (doc) setDocs(prev => [doc, ...prev])
      setUploadFile(null); setUploadName(''); setUploadDesc('')
      setUploadCategory('other'); setUploadSystem(''); setUploadExpires('')
      setShowUploadForm(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e: any) {
      setUploadError(e.message)
    }
    setUploading(false)
  }

  const handleDownload = async (doc: any) => {
    const { data } = await supabase.storage.from('home-documents').createSignedUrl(doc.file_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const handleDeleteDoc = async (doc: any) => {
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    await supabase.storage.from('home-documents').remove([doc.file_path])
    await supabase.from('home_documents').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    if (!window.confirm('Last chance — this is permanent and cannot be reversed.')) return
    setDeletingAccount(true)
    const { error } = await supabase.rpc('delete_user_account')
    if (error) { alert('Error deleting account: ' + error.message); setDeletingAccount(false) }
    else { await supabase.auth.signOut(); window.location.href = '/' }
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) return (
    <div style={{ background: '#F8F4EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#8A8A82' }}>Loading your home...</p>
    </div>
  )

  const scoreValue = score?.total_score || 0
  const tabs = ['overview', 'systems', 'log', 'report', 'documents']
  const tabLabels: Record<string, string> = { overview: 'Overview', systems: 'Systems', log: 'Contractor Log', report: 'Report Card', documents: 'Documents' }
  const alertSystems = systems.filter(s => ['Inspect', 'Priority'].includes(getCondition(s).label))
  const firstName = user?.email?.split('@')[0]?.split('.')[0]
  const displayName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : 'there'
  const smartTasks = getSmartTasks(systems, score, weather).filter(t => !dismissedSmartTasks.includes(t.id))
  const customTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const communityLevel = getCommunityLevel(communityScore?.total_points || 0)
  const expiringDocs = docs.filter(d => {
    if (!d.expires_at) return false
    const days = Math.ceil((new Date(d.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 90 && days > 0
  })
  const filteredDocs = docs.filter(d => docFilter === 'all' || d.category === docFilter)
  const docsByCategory = DOC_CATEGORIES.map(cat => ({
    ...cat, docs: filteredDocs.filter(d => d.category === cat.key)
  })).filter(cat => cat.docs.length > 0)

  const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000
  const showActiveStorm = weather?.recentStorm &&
    (Date.now() - new Date(weather.recentStorm.date).getTime()) < THREE_WEEKS_MS

  const scoreDetails = [
    { label: 'Systems', icon: '🏠', value: score?.system_risk_score || 0, insight: score?.system_risk_score >= 80 ? 'All systems in good shape' : score?.system_risk_score >= 60 ? 'A few systems to watch' : 'Systems need attention', action: 'View systems', onClick: () => setActiveTab('systems') },
    { label: 'Maintenance', icon: '🔧', value: score?.maintenance_score || 0, insight: score?.maintenance_score >= 70 ? 'Great maintenance history' : 'Log more jobs to improve', action: 'Log a job', href: '/log' },
    { label: 'Value', icon: '💰', value: score?.value_protection_score || 0, insight: score?.value_protection_score >= 70 ? 'Home value well protected' : 'See what affects your value', action: 'View report', onClick: () => setActiveTab('report') },
    { label: 'Seasonal', icon: '🌿', value: score?.seasonal_readiness_score || 0, insight: score?.seasonal_readiness_score >= 70 ? 'Ready for the season' : 'Check your seasonal to-do list', action: 'View tasks', onClick: () => setActiveTab('overview') },
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    border: '1px solid rgba(30,58,47,0.2)', borderRadius: '6px',
    fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', color: '#1A1A18',
    boxSizing: 'border-box',
  }

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      <div style={{ background: '#1E3A2F', padding: '28px 28px 0' }}>
        <div style={{ paddingBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '4px' }}>Welcome back</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#F8F4EE', fontWeight: 400 }}>{displayName}</div>

          {allHomes.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', alignItems: 'center' }}>
              {allHomes.map(h => (
                <div key={h.id} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button onClick={() => switchHome(h)} style={{
                      background: h.id === home?.id ? '#C47B2B' : 'rgba(248,244,238,0.1)',
                      border: `1px solid ${h.id === home?.id ? '#C47B2B' : 'rgba(248,244,238,0.2)'}`,
                      borderRight: 'none', color: h.id === home?.id ? '#fff' : 'rgba(248,244,238,0.7)',
                      padding: '6px 12px', borderRadius: '20px 0 0 20px',
                      fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      fontWeight: h.id === home?.id ? 500 : 400, display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      {h.is_primary && <span style={{ fontSize: '10px' }}>⭐</span>}
                      {h.status === 'for_transfer' && <span style={{ fontSize: '10px' }}>🔑</span>}
                      {h.address}{h.city ? `, ${h.city}` : ''}
                    </button>
                    <button onClick={() => setPropertyMenuOpen(propertyMenuOpen === h.id ? null : h.id)} style={{
                      background: h.id === home?.id ? '#B36B20' : 'rgba(248,244,238,0.08)',
                      border: `1px solid ${h.id === home?.id ? '#C47B2B' : 'rgba(248,244,238,0.2)'}`,
                      color: h.id === home?.id ? '#fff' : 'rgba(248,244,238,0.7)',
                      padding: '6px 8px', borderRadius: '0 20px 20px 0',
                      fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}>•••</button>
                  </div>

                  {propertyMenuOpen === h.id && (
                    <div style={{ position: 'absolute', top: '36px', left: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid rgba(30,58,47,0.11)', overflow: 'hidden', zIndex: 300, minWidth: '220px' }}>
                      {!h.is_primary && (
                        <button onClick={() => setPrimaryHome(h.id)} style={{ display: 'block', width: '100%', padding: '11px 16px', background: 'none', border: 'none', borderBottom: '1px solid rgba(30,58,47,0.06)', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", color: '#1E3A2F' }}>
                          ⭐ Set as primary residence
                        </button>
                      )}
                      {h.status !== 'for_transfer' && (
                        <button onClick={() => markForTransfer(h.id)} style={{ display: 'block', width: '100%', padding: '11px 16px', background: 'none', border: 'none', borderBottom: '1px solid rgba(30,58,47,0.06)', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", color: '#C47B2B' }}>
                          🔑 Mark as former property
                        </button>
                      )}
                      {h.status === 'for_transfer' && (
                        <div style={{ padding: '11px 16px', fontSize: '12px', color: '#8A8A82', borderBottom: '1px solid rgba(30,58,47,0.06)' }}>🔑 Awaiting new owner</div>
                      )}
                      <button onClick={() => setPropertyMenuOpen(null)} style={{ display: 'block', width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", color: '#8A8A82' }}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
              <a href="/onboarding" style={{ background: 'none', border: '1px dashed rgba(248,244,238,0.25)', color: 'rgba(248,244,238,0.5)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>+ Add property</a>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '2px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'none', border: 'none',
              color: activeTab === tab ? '#F8F4EE' : 'rgba(248,244,238,0.5)',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
              padding: '9px 14px 13px', cursor: 'pointer', whiteSpace: 'nowrap',
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
              {alertSystems.length > 0 && (
                <div style={{ background: '#FDECEA', border: '1px solid rgba(139,58,42,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#9B2C2C', marginBottom: '2px' }}>⚠️ {alertSystems.length} system{alertSystems.length > 1 ? 's' : ''} need attention</div>
                    <div style={{ fontSize: '12px', color: '#7A3A2A' }}>{alertSystems.map(s => s.system_type.replace(/_/g, ' ')).join(', ')}</div>
                  </div>
                  <button onClick={() => setActiveTab('systems')} style={{ background: 'none', border: '1px solid rgba(139,58,42,0.3)', color: '#9B2C2C', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>View →</button>
                </div>
              )}

              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
                  <div style={{ width: '72px', height: '72px', flexShrink: 0, position: 'relative' }}>
                    <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="36" cy="36" r="28" fill="none" stroke="#EDE8E0" strokeWidth="8" />
                      <circle cx="36" cy="36" r="28" fill="none" stroke={scoreValue >= 80 ? '#3D7A5A' : scoreValue >= 60 ? '#C47B2B' : '#9B2C2C'} strokeWidth="8"
                        strokeDasharray="176" strokeDashoffset={176 - (176 * scoreValue / 100)} strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#1E3A2F', fontWeight: 600 }}>{scoreValue}</div>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, marginBottom: '2px', color: '#1E3A2F' }}>
                      {scoreValue >= 80 ? 'Your home is in great shape' : scoreValue >= 60 ? 'Your home is doing well' : 'Your home needs attention'}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#8A8A82' }}>Home health score · Tap a category below to take action</p>
                  </div>
                </div>
                {scoreDetails.map((dim, i) => (
                  <div key={dim.label} style={{ padding: '12px 22px', borderBottom: i < scoreDetails.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => dim.onClick ? dim.onClick() : dim.href ? window.location.href = dim.href : null}>
                    <div style={{ fontSize: '20px', width: '28px', flexShrink: 0 }}>{dim.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{dim.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: dim.value >= 80 ? '#3D7A5A' : dim.value >= 60 ? '#C47B2B' : '#9B2C2C' }}>{dim.value}</span>
                      </div>
                      <div style={{ height: '6px', background: '#EDE8E0', borderRadius: '3px', marginBottom: '4px' }}>
                        <div style={{ width: `${dim.value}%`, height: '100%', background: dim.value >= 80 ? '#3D7A5A' : dim.value >= 60 ? '#C47B2B' : '#9B2C2C', borderRadius: '3px' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#8A8A82' }}>{dim.insight}</span>
                        <span style={{ fontSize: '11px', color: '#3D7A5A', fontWeight: 500 }}>{dim.action} →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ background: '#1E3A2F', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#F8F4EE', fontWeight: 400 }}>Home To-Do</h4>
                  <button onClick={() => setShowAddTask(!showAddTask)} style={{ background: 'rgba(248,244,238,0.1)', border: '1px solid rgba(248,244,238,0.2)', color: '#F8F4EE', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Add task</button>
                </div>

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

                {customTasks.map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '13px 20px', borderBottom: '1px solid rgba(30,58,47,0.06)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, background: '#EAF2EC' }}>✏️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', marginBottom: '2px', fontWeight: 500 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>{task.description}</div>}
                      {task.due_date && <div style={{ fontSize: '11px', color: '#C47B2B' }}>Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)} style={{ fontSize: '11px', padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(30,58,47,0.2)', background: '#fff', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>
                        <option value="todo">To do</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Done ✓</option>
                      </select>
                      <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#8A8A82', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
                    </div>
                  </div>
                ))}

                {smartTasks.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '13px 20px', borderBottom: '1px solid rgba(30,58,47,0.06)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, background: item.urgency === 'high' ? '#FDECEA' : item.urgency === 'medium' ? '#FBF0DC' : '#EAF2EC' }}>
                      {item.source === 'smart' ? '🧠' : '📋'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', marginBottom: '2px' }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: '#8A8A82' }}>{item.description}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px', background: item.urgency === 'high' ? '#FDECEA' : item.urgency === 'medium' ? '#FBF0DC' : '#EAF2EC', color: item.urgency === 'high' ? '#9B2C2C' : item.urgency === 'medium' ? '#7A4A10' : '#3D7A5A' }}>
                        {item.source === 'smart' ? 'Smart' : 'Seasonal'}
                      </span>
                      <select
                        defaultValue="todo"
                        onChange={e => {
                          if (e.target.value === 'done' || e.target.value === 'dismiss') {
                            setDismissedSmartTasks(prev => {
                              const updated = [...prev, item.id]
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('dismissedSmartTasks', JSON.stringify(updated))
                              }
                              return updated
                            })
                          }
                        }}
                        style={{ fontSize: '11px', padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(30,58,47,0.2)', background: '#fff', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}
                      >
                        <option value="todo">To do</option>
                        <option value="done">Done ✓</option>
                        <option value="dismiss">Dismiss</option>
                      </select>
                    </div>
                  </div>
                ))}

                {customTasks.length === 0 && smartTasks.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#8A8A82', fontSize: '13px' }}>
                    No tasks right now — add your own or they&apos;ll appear based on your home data.
                  </div>
                )}

                {doneTasks.length > 0 && (
                  <div style={{ padding: '10px 20px', background: '#F8F4EE', borderTop: '1px solid rgba(30,58,47,0.06)' }}>
                    <div style={{ fontSize: '12px', color: '#8A8A82' }}>✓ {doneTasks.length} completed task{doneTasks.length !== 1 ? 's' : ''}</div>
                  </div>
                )}
              </div>

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

            <div>
              {communityScore && (
                <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '28px' }}>{communityLevel.emoji}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#F8F4EE' }}>{communityLevel.label}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.5)' }}>Community score</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#C47B2B', fontWeight: 600 }}>{communityScore.total_points}</div>
                  </div>
                  {communityLevel.nextPoints && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(248,244,238,0.5)', marginBottom: '4px' }}>
                        <span>{communityScore.total_points} pts</span>
                        <span>{communityLevel.nextPoints} pts to {communityLevel.next}</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                        <div style={{ width: `${Math.min(100, (communityScore.total_points / communityLevel.nextPoints) * 100)}%`, height: '100%', background: '#C47B2B', borderRadius: '3px' }} />
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {[
                      { label: 'Home set up', pts: 50, done: communityScore.total_points >= 50 },
                      { label: 'First job logged', pts: 100, done: communityScore.first_job_logged },
                      { label: `${communityScore.jobs_shared} jobs shared`, pts: 75, done: communityScore.jobs_shared > 0, perItem: true },
                      { label: `${communityScore.systems_detailed} systems detailed`, pts: 25, done: communityScore.systems_detailed > 0, perItem: true },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                        <span style={{ color: item.done ? '#6AAF8A' : 'rgba(248,244,238,0.3)' }}>{item.done ? '✓' : '○'}</span>
                        <span style={{ color: item.done ? 'rgba(248,244,238,0.8)' : 'rgba(248,244,238,0.4)', flex: 1 }}>{item.label}</span>
                        <span style={{ color: '#C47B2B', fontWeight: 500 }}>+{item.pts}{item.perItem ? ' ea' : ''}</span>
                      </div>
                    ))}
                  </div>
                  <a href="/neighbors" style={{ display: 'block', marginTop: '12px', background: 'rgba(248,244,238,0.1)', border: '1px solid rgba(248,244,238,0.15)', color: 'rgba(248,244,238,0.8)', textAlign: 'center', padding: '8px', borderRadius: '8px', fontSize: '12px', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                    View your neighbor contributions →
                  </a>
                </div>
              )}

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
                      <div style={{ fontSize: '12px', color: '#7A4A10', background: '#FBF0DC', padding: '9px 16px', borderTop: '1px solid rgba(196,123,43,0.14)' }}>{weather.tip}</div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px' }}>
                      <div style={{ fontSize: '32px' }}>⛅</div>
                      <div style={{ fontSize: '13px', color: '#8A8A82' }}>Weather unavailable</div>
                    </div>
                  )}
                </div>

                {/* Active storm alert — only shows within 3 weeks */}
                {showActiveStorm && (
                  <div style={{ background: '#FBF0DC', border: '1px solid rgba(196,123,43,0.2)', borderRadius: '12px', padding: '14px 16px', marginTop: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#7A4A10', marginBottom: '3px' }}>⚠️ {weather.recentStorm.label} recorded</div>
                    <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '6px' }}>
                      {new Date(weather.recentStorm.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {weather.recentStorm.windspeed > 0 && ` · ${Math.round(weather.recentStorm.windspeed)} mph winds`}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {weather.recentStorm.systems.map((s: string) => (
                        <span key={s} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(196,123,43,0.15)', color: '#7A4A10', textTransform: 'capitalize' }}>{s.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                    <button onClick={() => setShowStormDetail(!showStormDetail)} style={{ background: 'none', border: '1px solid rgba(122,74,16,0.3)', color: '#7A4A10', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      {showStormDetail ? 'Hide inspection guide' : 'What to check →'}
                    </button>
                    {showStormDetail && weather.inspectionGuides && (
                      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(196,123,43,0.2)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#7A4A10', marginBottom: '8px' }}>Self-inspect checklist — you are in control</div>
                        <div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '12px', lineHeight: 1.6 }}>Check these yourself first. A legitimate inspector will never pressure you into same-day decisions.</div>
                        {weather.inspectionGuides.map((guide: any, i: number) => (
                          <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F', marginBottom: '4px' }}>{guide.what}</div>
                            <div style={{ fontSize: '11px', color: '#8A8A82', lineHeight: 1.6 }}>{guide.look_for}</div>
                          </div>
                        ))}
                        <div style={{ background: '#EAF2EC', borderRadius: '8px', padding: '10px 12px', marginTop: '10px' }}>
                          <div style={{ fontSize: '11px', color: '#3D7A5A', lineHeight: 1.6 }}>💡 <strong>Insurance tip:</strong> Document everything with photos before any repairs. Contact your insurer before hiring a contractor.</div>
                        </div>
                        <button onClick={() => window.location.href = '/log'} style={{ marginTop: '10px', width: '100%', background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Log an inspection when ready →</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Storm history — always available */}
                {stormHistory.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={() => setShowStormHistory(!showStormHistory)}
                      style={{ width: '100%', background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: showStormHistory ? '10px 10px 0 0' : '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F' }}>🌩️ Storm history · {stormHistory.length} event{stormHistory.length !== 1 ? 's' : ''}</span>
                      <span style={{ fontSize: '11px', color: '#8A8A82' }}>{showStormHistory ? '▲ Hide' : '▼ Show'}</span>
                    </button>
                    {showStormHistory && (
                      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                        {stormHistory.map((storm, i) => {
                          const daysAgo = Math.round((Date.now() - new Date(storm.event_date).getTime()) / (1000 * 60 * 60 * 24))
                          return (
                            <div key={storm.id} style={{ padding: '10px 14px', borderBottom: i < stormHistory.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>{storm.notes || storm.event_type.replace(/_/g, ' ')}</div>
                                  <div style={{ fontSize: '11px', color: '#8A8A82' }}>
                                    {new Date(storm.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {storm.max_windspeed > 0 && ` · ${Math.round(storm.max_windspeed)} mph`}
                                  </div>
                                  {storm.affected_systems?.length > 0 && (
                                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '4px' }}>
                                      {storm.affected_systems.map((s: string) => (
                                        <span key={s} style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '20px', background: '#F5F5F5', color: '#8A8A82', textTransform: 'capitalize' }}>{s.replace(/_/g, ' ')}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', flexShrink: 0, background: daysAgo <= 21 ? '#FBF0DC' : '#F5F5F5', color: daysAgo <= 21 ? '#7A4A10' : '#8A8A82', fontWeight: 500 }}>
                                  {daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo}d ago`}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                    <button onClick={startEditHome} style={{ marginTop: '12px', width: '100%', background: '#F8F4EE', border: '1px dashed rgba(30,58,47,0.2)', color: '#8A8A82', fontSize: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Add missing details</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {[
                      { label: 'Address', key: 'address' }, { label: 'City', key: 'city' },
                      { label: 'State', key: 'state' }, { label: 'ZIP', key: 'zip' },
                      { label: 'Year built', key: 'year_built' }, { label: 'Square footage', key: 'sqft' },
                      { label: 'Bedrooms', key: 'bedrooms' }, { label: 'Bathrooms', key: 'bathrooms' },
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
                        { label: 'Pool', key: 'pool' }, { label: 'HOA', key: 'hoa' },
                        { label: 'Fireplace', key: 'has_fireplace' }, { label: 'Sump pump', key: 'has_sump_pump' },
                        { label: 'Irrigation', key: 'has_irrigation' }, { label: 'Generator', key: 'has_generator' },
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

              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '14px' }}>Quick actions</h4>
                {[
                  { label: '+ Log a contractor job', href: '/log' },
                  { label: '+ Add another property', href: '/onboarding' },
                  { label: '👥 Browse neighbor reviews', href: '/neighbors' },
                  { label: '📄 View report card', onClick: () => setActiveTab('report') },
                  { label: '📂 Document vault', onClick: () => setActiveTab('documents') },
                  { label: '📖 Browse guides', href: '/guides' },
                  { label: '🔑 Claim a home', href: '/claim' },
                ].map(action => (
                  action.href
                    ? <a key={action.label} href={action.href} style={{ display: 'block', padding: '9px 0', fontSize: '13px', color: '#1E3A2F', textDecoration: 'none', borderBottom: '1px solid rgba(30,58,47,0.07)' }}>{action.label}</a>
                    : <button key={action.label} onClick={action.onClick} style={{ display: 'block', width: '100%', padding: '9px 0', fontSize: '13px', color: '#1E3A2F', background: 'none', border: 'none', borderBottom: '1px solid rgba(30,58,47,0.07)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>{action.label}</button>
                ))}
              </div>

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

              <div style={{ background: '#fff', border: '1px solid rgba(155,44,44,0.15)', borderRadius: '16px', padding: '18px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 500, color: '#9B2C2C', marginBottom: '8px' }}>Danger zone</h4>
                <p style={{ fontSize: '12px', color: '#8A8A82', lineHeight: 1.6, marginBottom: '12px' }}>Deleting your account permanently removes all your homes, systems, contractor jobs, and health scores.</p>
                <button onClick={handleDeleteAccount} disabled={deletingAccount} style={{ background: 'none', border: '1px solid rgba(155,44,44,0.3)', color: '#9B2C2C', fontSize: '12px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%' }}>
                  {deletingAccount ? 'Deleting...' : 'Delete my account'}
                </button>
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
                          <h4 style={{ fontSize: '15px', fontWeight: 500 }}>{sys.system_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()).replace('Hvac', 'HVAC')}</h4>
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
                            {sys.not_applicable ? 'Not applicable for this home' : `${sys.material ? `${sys.material} · ` : ''}${age ? `${age} years old · ${sys.ever_replaced ? `Replaced ${sys.replacement_year}` : `Installed ${sys.install_year}`}` : 'Install year unknown'}`}
                          </div>
                          {sys.known_issues && <div style={{ fontSize: '12px', color: '#8B3A2A', marginBottom: '8px' }}>⚠️ {sys.known_issues}</div>}
                          {age && !sys.not_applicable && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8A8A82', marginBottom: '4px' }}>
                                <span>Lifespan used</span><span>{pct}% of ~{lifespan} years</span>
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
                              <input
                                value={systemEdits.install_year === 'unknown' ? '' : systemEdits.install_year}
                                onChange={e => setSystemEdits((p: any) => ({ ...p, install_year: e.target.value, not_applicable: false }))}
                                style={{ ...inputStyle, opacity: systemEdits.not_applicable ? 0.4 : 1 }}
                                placeholder={systemEdits.install_year === 'unknown' ? "Don't know" : 'e.g. 2018'}
                                disabled={systemEdits.not_applicable}
                              />
                              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => setSystemEdits((p: any) => ({ ...p, install_year: p.install_year === 'unknown' ? '' : 'unknown', not_applicable: false }))}
                                  style={{ flex: 1, fontSize: '11px', padding: '4px 6px', borderRadius: '6px', border: '1px solid rgba(30,58,47,0.2)', background: systemEdits.install_year === 'unknown' ? '#1E3A2F' : '#fff', color: systemEdits.install_year === 'unknown' ? '#F8F4EE' : '#8A8A82', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                                >
                                  Don&apos;t know
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSystemEdits((p: any) => ({ ...p, not_applicable: !p.not_applicable, install_year: '' }))}
                                  style={{ flex: 1, fontSize: '11px', padding: '4px 6px', borderRadius: '6px', border: '1px solid rgba(30,58,47,0.2)', background: systemEdits.not_applicable ? '#1E3A2F' : '#fff', color: systemEdits.not_applicable ? '#F8F4EE' : '#8A8A82', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                                >
                                  Not applicable
                                </button>
                              </div>
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
                              <input type="checkbox" checked={systemEdits.ever_replaced} onChange={e => setSystemEdits((p: any) => ({ ...p, ever_replaced: e.target.checked }))} style={{ accentColor: '#1E3A2F' }} /> Ever replaced?
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={systemEdits.under_warranty} onChange={e => setSystemEdits((p: any) => ({ ...p, under_warranty: e.target.checked }))} style={{ accentColor: '#1E3A2F' }} /> Under warranty
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={systemEdits.storm_damage_unaddressed} onChange={e => setSystemEdits((p: any) => ({ ...p, storm_damage_unaddressed: e.target.checked }))} style={{ accentColor: '#1E3A2F' }} /> Storm damage?
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
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>{job.company_name}</h4>
                      <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '6px' }}>
                        {job.service_description} · {job.system_type?.replace(/_/g, ' ')}
                        {job.job_date ? ` · ${new Date(job.job_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''}
                      </p>
                      {job.tags && job.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {job.tags.map((tag: string) => <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{tag}</span>)}
                        </div>
                      )}
                      <a href={`/log`} style={{ fontSize: '11px', color: '#3D7A5A', textDecoration: 'none', border: '1px solid rgba(30,58,47,0.2)', padding: '3px 10px', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif" }}>
                        Edit →
                      </a>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
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
          <ReportCardInline home={home} details={details} systems={systems} jobs={jobs} score={score} onTabChange={setActiveTab} />
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>Document Vault</h2>
                <p style={{ fontSize: '13px', color: '#8A8A82' }}>{docs.length} document{docs.length !== 1 ? 's' : ''} · Transfers with your home</p>
              </div>
              <button onClick={() => setShowUploadForm(!showUploadForm)} style={{ background: '#C47B2B', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Upload</button>
            </div>

            <div style={{ background: '#EAF2EC', border: '1px solid rgba(61,122,90,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>🔒</span>
              <div style={{ fontSize: '12px', color: '#3D7A5A', lineHeight: 1.6 }}>
                <strong>Private and secure.</strong> Only you and approved co-owners can access these documents. Only upload home-related files — warranties, permits, manuals. Do not upload documents with personal financial, tax, or identity information.
              </div>
            </div>

            {expiringDocs.length > 0 && (
              <div style={{ background: '#FBF0DC', border: '1px solid rgba(196,123,43,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#7A4A10', marginBottom: '6px' }}>⚠️ {expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''} expiring within 90 days</div>
                {expiringDocs.map(d => {
                  const days = Math.ceil((new Date(d.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  return <div key={d.id} style={{ fontSize: '12px', color: '#8A8A82' }}>{d.name} — expires in {days} days</div>
                })}
              </div>
            )}

            {showUploadForm && (
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '22px', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F', marginBottom: '16px' }}>Upload a document</h3>
                <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed rgba(30,58,47,0.2)', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: uploadFile ? '#EAF2EC' : '#F8F4EE', marginBottom: '14px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{uploadFile ? '✅' : '📎'}</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F', marginBottom: '3px' }}>{uploadFile ? uploadFile.name : 'Click to select a file'}</div>
                  <div style={{ fontSize: '12px', color: '#8A8A82' }}>{uploadFile ? formatSize(uploadFile.size) : 'PDF, JPG, or PNG · Max 10MB'}</div>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileSelect} style={{ display: 'none' }} />
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Document name *</label>
                    <input value={uploadName} onChange={e => setUploadName(e.target.value)} style={inputStyle} placeholder="e.g. Roof warranty 2021" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Description (optional)</label>
                    <input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} style={inputStyle} placeholder="e.g. 10-year workmanship warranty from ABC Roofing" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Category *</label>
                      <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} style={inputStyle}>
                        {DOC_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Related system (optional)</label>
                      <select value={uploadSystem} onChange={e => setUploadSystem(e.target.value)} style={inputStyle}>
                        <option value="">None</option>
                        {DOC_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Expiration date (optional — for warranties)</label>
                    <input type="date" value={uploadExpires} onChange={e => setUploadExpires(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                {uploadError && (
                  <div style={{ background: '#FDECEA', color: '#9B2C2C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '12px' }}>{uploadError}</div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button onClick={handleUpload} disabled={uploading || !uploadFile} style={{ flex: 2, background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: uploading || !uploadFile ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: uploading || !uploadFile ? 0.6 : 1 }}>
                    {uploading ? 'Uploading...' : 'Upload document'}
                  </button>
                  <button onClick={() => { setShowUploadForm(false); setUploadFile(null); setUploadError('') }} style={{ flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '10px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                </div>
              </div>
            )}

            {docs.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button onClick={() => setDocFilter('all')} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: docFilter === 'all' ? '#1E3A2F' : '#fff', color: docFilter === 'all' ? '#F8F4EE' : '#1E3A2F', outline: '1px solid rgba(30,58,47,0.15)' }}>
                  All ({docs.length})
                </button>
                {DOC_CATEGORIES.filter(c => docs.some(d => d.category === c.key)).map(cat => (
                  <button key={cat.key} onClick={() => setDocFilter(cat.key)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: docFilter === cat.key ? cat.textColor : cat.color, color: docFilter === cat.key ? '#fff' : cat.textColor, outline: `1px solid ${cat.textColor}33` }}>
                    {cat.icon} {cat.label} ({docs.filter(d => d.category === cat.key).length})
                  </button>
                ))}
              </div>
            )}

            {docs.length === 0 && !showUploadForm && (
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '44px', marginBottom: '14px' }}>📂</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>No documents yet</h3>
                <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto 20px' }}>
                  Store warranties, permits, inspection reports, and manuals here. They transfer automatically when you pass ownership of your home.
                </p>
                <button onClick={() => setShowUploadForm(true)} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '11px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Upload your first document
                </button>
              </div>
            )}

            {docsByCategory.map(cat => (
              <div key={cat.key} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)', display: 'flex', alignItems: 'center', gap: '10px', background: cat.color }}>
                  <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                  <h4 style={{ fontSize: '13px', fontWeight: 500, color: cat.textColor }}>{cat.label}</h4>
                  <span style={{ fontSize: '11px', color: cat.textColor, opacity: 0.7, marginLeft: 'auto' }}>{cat.docs.length} file{cat.docs.length !== 1 ? 's' : ''}</span>
                </div>
                {cat.docs.map((doc: any, i: number) => {
                  const isPdf = doc.file_type === 'application/pdf'
                  const isImage = doc.file_type?.startsWith('image/')
                  const isExpiring = doc.expires_at && Math.ceil((new Date(doc.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 90
                  return (
                    <div key={doc.id} style={{ padding: '12px 20px', borderBottom: i < cat.docs.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '20px', flexShrink: 0 }}>{isPdf ? '📄' : isImage ? '🖼️' : '📎'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{doc.name}</span>
                          {doc.system_type && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: '#EDE8E0', color: '#8A8A82' }}>{doc.system_type}</span>}
                          {isExpiring && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: '#FBF0DC', color: '#C47B2B' }}>⏰ Expiring soon</span>}
                        </div>
                        {doc.description && <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '2px' }}>{doc.description}</div>}
                        <div style={{ fontSize: '11px', color: '#8A8A82' }}>
                          {formatSize(doc.file_size)}
                          {doc.expires_at && ` · Expires ${new Date(doc.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                          {` · Added ${new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => handleDownload(doc)} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                          {isImage ? 'View' : 'Download'}
                        </button>
                        <button onClick={() => handleDeleteDoc(doc)} style={{ background: 'none', border: '1px solid rgba(155,44,44,0.2)', color: '#9B2C2C', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {showClaimedModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>This home is now yours</h2>
            <p style={{ fontSize: '14px', color: '#8A8A82', lineHeight: 1.7, marginBottom: '24px' }}>
              You now have full access to this home&apos;s complete history. Would you like to update the home details and set your own tasks now?
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              <button onClick={() => { setShowClaimedModal(false); startEditHome() }} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Update home details now</button>
              <button onClick={() => setShowClaimedModal(false)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '12px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>I&apos;ll do it later</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function ReportCardInline({ home, details, systems, jobs, score, onTabChange }: any) {
  const [copied, setCopied] = useState(false)

  const scoreValue = score?.total_score || 0
  const age = home?.year_built ? new Date().getFullYear() - home.year_built : null
  const alertSystems = systems.filter((s: any) => ['Inspect', 'Priority'].includes(getCondition(s).label))

  const scoreDetails = [
    { label: 'System Risk', icon: '🏠', value: score?.system_risk_score || 0, weight: '35%', insight: score?.system_risk_score >= 80 ? 'All systems in good shape' : score?.system_risk_score >= 60 ? 'A few systems to watch' : 'Systems need attention', onClick: () => onTabChange('systems') },
    { label: 'Maintenance', icon: '🔧', value: score?.maintenance_score || 0, weight: '30%', insight: score?.maintenance_score >= 70 ? 'Strong maintenance history' : 'Log more jobs to improve', href: '/log' },
    { label: 'Value Protection', icon: '💰', value: score?.value_protection_score || 0, weight: '20%', insight: score?.value_protection_score >= 70 ? 'Home value well protected' : 'Address flagged systems before selling' },
    { label: 'Seasonal Readiness', icon: '🌿', value: score?.seasonal_readiness_score || 0, weight: '15%', insight: score?.seasonal_readiness_score >= 70 ? 'Ready for the season' : 'Review seasonal checklist', onClick: () => onTabChange('overview') },
  ]

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#8A8A82' }}>{home?.address} · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: copied ? '✓ Copied!' : '🔗 Copy link', onClick: () => { navigator.clipboard.writeText(window.location.origin + '/report'); setCopied(true); setTimeout(() => setCopied(false), 2000) } },
            { label: '✉️ Email', onClick: () => { window.location.href = `mailto:?subject=${encodeURIComponent('Home Report Card — ' + home?.address)}&body=${encodeURIComponent('View my home report card: ' + window.location.origin + '/report')}` } },
            { label: '🖨️ Print', onClick: () => window.print() },
            { label: '↗️ Full page', onClick: () => window.open('/report', '_blank') },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{btn.label}</button>
          ))}
        </div>
      </div>

      <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '28px 32px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(196,123,43,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '6px' }}>Home Report Card</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(18px, 3vw, 26px)', color: '#F8F4EE', fontWeight: 400, marginBottom: '4px' }}>{home?.address}</h2>
            <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.6)', marginBottom: '16px' }}>{home?.city}{home?.state ? `, ${home.state}` : ''} · Built {home?.year_built}</p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {[{ label: 'Age', value: age ? `${age}yr` : '—' }, { label: 'Jobs', value: jobs.length }, { label: 'Systems', value: systems.length }].map(stat => (
                <div key={stat.label}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#F8F4EE', fontWeight: 600 }}>{stat.value}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.5)', marginTop: '2px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
            <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={scoreValue >= 80 ? '#6AAF8A' : scoreValue >= 60 ? '#C47B2B' : '#E57373'} strokeWidth="10" strokeDasharray="201" strokeDashoffset={201 - (201 * scoreValue / 100)} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#F8F4EE', fontWeight: 600, lineHeight: 1 }}>{scoreValue}</div>
            </div>
          </div>
        </div>
      </div>

      {alertSystems.length > 0 && (
        <div style={{ background: '#FDECEA', border: '1px solid rgba(139,58,42,0.2)', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#9B2C2C', marginBottom: '2px' }}>⚠️ {alertSystems.length} system{alertSystems.length > 1 ? 's' : ''} need attention</div>
          <div style={{ fontSize: '12px', color: '#7A3A2A' }}>{alertSystems.map((s: any) => s.system_type.replace(/_/g, ' ')).join(', ')}</div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>Health Score Breakdown</h3>
          <p style={{ fontSize: '12px', color: '#8A8A82', marginTop: '3px' }}>What&apos;s driving your {scoreValue} score — tap to take action</p>
        </div>
        {scoreDetails.map((dim, i) => (
          <div key={dim.label} style={{ padding: '14px 20px', borderBottom: i < scoreDetails.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: dim.onClick || dim.href ? 'pointer' : 'default' }}
            onClick={() => dim.onClick ? dim.onClick() : dim.href ? window.location.href = dim.href : null}>
            <div style={{ fontSize: '20px', width: '26px', flexShrink: 0 }}>{dim.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{dim.label}</span>
                  <span style={{ fontSize: '11px', color: '#8A8A82', marginLeft: '6px' }}>{dim.weight}</span>
                </div>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 600, color: dim.value >= 80 ? '#3D7A5A' : dim.value >= 60 ? '#C47B2B' : '#9B2C2C' }}>{dim.value}</span>
              </div>
              <div style={{ height: '6px', background: '#EDE8E0', borderRadius: '3px', marginBottom: '4px' }}>
                <div style={{ width: `${dim.value}%`, height: '100%', background: dim.value >= 80 ? '#3D7A5A' : dim.value >= 60 ? '#C47B2B' : '#9B2C2C', borderRadius: '3px' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#8A8A82' }}>{dim.insight}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>System Condition</h3>
        </div>
        {systems.map((sys: any, i: number) => {
          const condition = getCondition(sys)
          const effectiveYear = sys.replacement_year || sys.install_year
          const sysAge = effectiveYear ? new Date().getFullYear() - effectiveYear : null
          const lifespan = SYSTEM_LIFESPANS[sys.system_type] || 20
          const pct = sysAge ? Math.min(100, Math.round((sysAge / lifespan) * 100)) : 0
          return (
            <div key={sys.id} style={{ padding: '12px 20px', borderBottom: i < systems.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '18px', width: '24px', flexShrink: 0 }}>{SYSTEM_ICONS[sys.system_type] || '🔧'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{sys.system_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()).replace('Hvac', 'HVAC')}</span>
                  <span style={{ fontSize: '10px', fontWeight: 500, padding: '1px 6px', borderRadius: '20px', background: condition.bg, color: condition.textColor }}>{condition.label}</span>
                  {sys.ever_replaced && <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>Replaced {sys.replacement_year}</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '4px' }}>
                  {sys.not_applicable ? 'Not applicable' : `${sys.material ? `${sys.material} · ` : ''}${sysAge ? `${sysAge}yr old` : 'Year unknown'}`}
                </div>
                {sysAge !== null && !sys.not_applicable && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', background: '#EDE8E0', borderRadius: '2px' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: condition.color, borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '10px', color: '#8A8A82', flexShrink: 0 }}>{pct}%</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {jobs.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>Contractor History</h3>
          </div>
          {jobs.map((job: any, i: number) => (
            <div key={job.id} style={{ padding: '12px 20px', borderBottom: i < jobs.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>{job.company_name}</div>
                <div style={{ fontSize: '12px', color: '#8A8A82' }}>{job.service_description}{job.job_date ? ` · ${new Date(job.job_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>{job.final_price ? `$${Number(job.final_price).toLocaleString()}` : '—'}</div>
                <div style={{ color: '#C47B2B', fontSize: '11px' }}>{'★'.repeat(job.quality_rating)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {[
          { emoji: '🏠', title: 'For Buyers', color: '#3D7A5A', items: ['Request maintenance records before closing', 'Flag systems past 80% of expected lifespan', 'Use deferred maintenance as negotiation leverage', 'Ask for contractor warranties on recent work', 'Get independent inspection of flagged systems'] },
          { emoji: '🔑', title: 'For Sellers', color: '#C47B2B', items: ['Address Inspect and Priority items before listing', 'Document all recent contractor work', 'Share this report card with serious buyers', 'Systems in Good condition are a selling advantage', 'Recent maintenance history builds buyer confidence'] }
        ].map(section => (
          <div key={section.title} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderTop: `3px solid ${section.color}`, borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{section.emoji}</div>
            <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1E3A2F', marginBottom: '12px' }}>{section.title}</h4>
            {section.items.map(item => (
              <div key={item} style={{ display: 'flex', gap: '6px', marginBottom: '6px', fontSize: '12px', color: '#4A4A44', lineHeight: 1.5 }}>
                <span style={{ color: section.color, flexShrink: 0 }}>✓</span>{item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}