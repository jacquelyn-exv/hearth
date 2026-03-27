'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

const SHOW_SPONSORED = false

const SYSTEM_LIFESPANS: Record<string, number> = {
  roof: 27, hvac: 17, water_heater: 11, windows: 22,
  deck: 17, siding: 30, entry_door: 35, sliding_door: 28,
  gutters: 20, driveway: 25, fencing: 20,
  chimney: 50, sump_pump: 10, landscaping: 20,
  refrigerator: 13, dishwasher: 12,
}

const SYSTEM_ICONS: Record<string, string> = {
  roof: '🏠', hvac: '🌡️', water_heater: '🔥', windows: '🪟',
  deck: '🪵', siding: '🏗️', entry_door: '🚪', sliding_door: '🪟',
  gutters: '🌧️', driveway: '🛣️', fencing: '🔒',
  chimney: '🔥', sump_pump: '💦', landscaping: '🌿',
  refrigerator: '🧊', dishwasher: '🍽️',
}

const SYSTEM_DISPLAY_NAMES: Record<string, string> = {
  roof: 'Roof', hvac: 'HVAC', water_heater: 'Water Heater',
  windows: 'Windows', deck: 'Deck / Patio', siding: 'Siding',
  entry_door: 'Entry Door', sliding_door: 'Sliding Door',
  gutters: 'Gutters & Trim', driveway: 'Driveway', fencing: 'Fencing',
  chimney: 'Chimney / Fireplace', sump_pump: 'Sump Pump',
  landscaping: 'Landscaping', refrigerator: 'Refrigerator',
  dishwasher: 'Dishwasher',
}

const ALL_SYSTEMS = [
  'roof', 'hvac', 'water_heater', 'windows', 'entry_door', 'sliding_door',
  'siding', 'gutters', 'deck', 'driveway', 'fencing', 'chimney', 'sump_pump', 'landscaping',
]

const APPLIANCES = ['refrigerator', 'dishwasher']

const SYSTEM_FIELDS: Record<string, { label: string; type: string; options?: string[] }[]> = {
  roof: [
    { label: 'Material', type: 'select', options: ['3-tab asphalt','Architectural asphalt','Premium architectural','Wood shake','Metal','Clay tile','Concrete tile','Synthetic / composite','TPO / flat','Slate','Unknown'] },
    { label: 'Install year', type: 'year' },
    { label: 'Last inspection', type: 'date' },
    { label: 'Has skylights', type: 'boolean' },
    { label: 'Known issues', type: 'text' },
  ],
  siding: [
    { label: 'Material', type: 'select', options: ['Vinyl','Fiber cement','Engineered wood','Wood','Brick','Stucco','Stone veneer','Metal','Unknown'] },
    { label: 'Install year', type: 'year' },
    { label: 'Last inspection', type: 'date' },
    { label: 'Known issues', type: 'text' },
  ],
  gutters: [
    { label: 'Material', type: 'select', options: ['Aluminum','Vinyl','Steel','Copper / Zinc','Unknown'] },
    { label: 'Seamless or sectional', type: 'select', options: ['Seamless','Sectional','Unknown'] },
    { label: 'Fascia material', type: 'select', options: ['Wood','Cellular PVC','Composite','Aluminum wrapped','Unknown'] },
    { label: 'Has gutter guards', type: 'boolean' },
    { label: 'Install year', type: 'year' },
    { label: 'Last cleaning', type: 'date' },
  ],
  windows: [
    { label: 'Frame material', type: 'select', options: ['Vinyl','Wood','Aluminum','Fiberglass','Composite / Clad wood','Unknown'] },
    { label: 'Glazing type', type: 'select', options: ['Single pane','Double pane','Triple pane','Unknown'] },
    { label: 'Install year', type: 'year' },
    { label: 'Fogged units', type: 'number' },
    { label: 'Any broken glass', type: 'boolean' },
    { label: 'Any wood rot', type: 'boolean' },
  ],
  entry_door: [
    { label: 'Material', type: 'select', options: ['Fiberglass','Steel','Wood','Composite','Unknown'] },
    { label: 'Frame material', type: 'select', options: ['Wood','Composite','Fiberglass','Unknown'] },
    { label: 'Has glass lites or sidelites', type: 'boolean' },
    { label: 'Hardware in working condition', type: 'boolean' },
    { label: 'Install year', type: 'year' },
  ],
  sliding_door: [
    { label: 'Frame material', type: 'select', options: ['Vinyl','Aluminum','Fiberglass','Wood','Clad wood','Unknown'] },
    { label: 'Glazing type', type: 'select', options: ['Single pane','Double pane','Triple pane','Unknown'] },
    { label: 'Configuration', type: 'select', options: ['2-panel','3-panel','Unknown'] },
    { label: 'Locking type', type: 'select', options: ['Single-point','Multi-point','Unknown'] },
    { label: 'Has anti-lift', type: 'boolean' },
    { label: 'Hardware in working condition', type: 'boolean' },
    { label: 'Install year', type: 'year' },
  ],
  hvac: [
    { label: 'System type', type: 'select', options: ['Gas furnace + central AC','Air source heat pump','Mini split / ductless','Boiler','Other'] },
    { label: 'Fuel source', type: 'select', options: ['Gas','Electric','Propane','Oil'] },
    { label: 'Furnace install year', type: 'year' },
    { label: 'AC or heat pump install year', type: 'year' },
    { label: 'Filter size', type: 'text' },
    { label: 'Last filter replacement', type: 'date' },
    { label: 'Last professional service', type: 'date' },
  ],
  water_heater: [
    { label: 'Type', type: 'select', options: ['Tank (gas)','Tank (electric)','Tankless (gas)','Tankless (electric)','Heat pump / hybrid'] },
    { label: 'Tank size (gallons)', type: 'number' },
    { label: 'Install year', type: 'year' },
    { label: 'Has expansion tank', type: 'select', options: ['Yes','No','Unknown'] },
    { label: 'Last flush', type: 'date' },
    { label: 'Last anode rod inspection', type: 'date' },
    { label: 'Last TPR valve test', type: 'date' },
  ],
  deck: [
    { label: 'Material', type: 'select', options: ['Pressure treated wood','Cedar','Composite','Hardwood','Concrete','Pavers'] },
    { label: 'Install year', type: 'year' },
    { label: 'Last seal / stain', type: 'date' },
    { label: 'Known issues', type: 'text' },
  ],
  chimney: [
    { label: 'Type', type: 'select', options: ['Wood burning','Gas','Electric','Decorative'] },
    { label: 'Last sweep', type: 'date' },
    { label: 'Last inspection', type: 'date' },
  ],
  sump_pump: [
    { label: 'Install year', type: 'year' },
    { label: 'Has battery backup', type: 'boolean' },
    { label: 'Last test', type: 'date' },
    { label: 'Last battery replacement', type: 'date' },
  ],
  driveway: [
    { label: 'Material', type: 'select', options: ['Asphalt','Concrete','Pavers','Gravel','Other'] },
    { label: 'Install year', type: 'year' },
    { label: 'Known issues', type: 'text' },
  ],
  fencing: [
    { label: 'Material', type: 'select', options: ['Wood','Vinyl','Aluminum','Chain link','Other'] },
    { label: 'Install year', type: 'year' },
    { label: 'Known issues', type: 'text' },
  ],
  landscaping: [
    { label: 'Install year', type: 'year' },
    { label: 'Notes', type: 'text' },
  ],
  refrigerator: [
    { label: 'Type', type: 'select', options: ['Top freezer','Bottom freezer','Side-by-side','French door'] },
    { label: 'Purchase year', type: 'year' },
    { label: 'Has ice maker', type: 'boolean' },
    { label: 'Has water dispenser', type: 'boolean' },
    { label: 'Last condenser coil cleaning', type: 'date' },
    { label: 'Last water filter replacement', type: 'date' },
  ],
  dishwasher: [
    { label: 'Type', type: 'select', options: ['Built-in','Drawer','Portable'] },
    { label: 'Purchase year', type: 'year' },
    { label: 'Last filter cleaning', type: 'date' },
    { label: 'Last cleaner cycle', type: 'date' },
  ],
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
  'Roof','Siding','Windows','Entry Door','Sliding Door','Gutters & Trim',
  'Deck','Driveway','Fencing','HVAC','Water Heater','Sump Pump',
  'Chimney','Refrigerator','Dishwasher','Whole Home','Other'
]

const GOALS = [
  { key: 'maintain', emoji: '🏡', label: 'Maintain and protect' },
  { key: 'protect_value', emoji: '🏷️', label: 'Prepare to sell' },
  { key: 'renovate', emoji: '🔨', label: 'Renovate and improve' },
  { key: 'new_owner', emoji: '📚', label: 'Learn as a new homeowner' },
  { key: 'maximize_value', emoji: '📈', label: 'Maximize long-term value' },
  { key: 'budget', emoji: '💰', label: 'Control my maintenance costs' },
]

const FIRST_30_DAYS_CATEGORIES = [
  { key: 'safety', label: 'Safety First', icon: '🔐', items: [
    { key: 'change_locks', title: 'Change all locks and garage codes' },
    { key: 'locate_shutoffs', title: 'Locate and label your electrical panel, main water shutoff, and gas shutoff' },
    { key: 'smoke_detectors', title: 'Test smoke and CO detectors — replace batteries' },
    { key: 'fire_extinguisher', title: "Buy a fire extinguisher if one isn't present" },
    { key: 'evacuation_plan', title: 'Create a home evacuation plan' },
  ]},
  { key: 'utilities', label: 'Utilities & Accounts', icon: '💡', items: [
    { key: 'transfer_utilities', title: 'Transfer all utilities into your name' },
    { key: 'auto_payments', title: 'Set up automatic payments or note due dates' },
    { key: 'forward_mail', title: 'Forward mail and update your address with USPS, bank, DMV, and employer' },
  ]},
  { key: 'insurance', label: 'Insurance & Documents', icon: '📄', items: [
    { key: 'review_insurance', title: "Review your homeowner's insurance policy" },
    { key: 'home_inventory', title: 'Create a home inventory — photos/video of all rooms' },
    { key: 'store_documents', title: 'Store important documents in a safe place' },
  ]},
  { key: 'maintenance', label: 'Maintenance Baseline', icon: '🔧', items: [
    { key: 'hvac_filter', title: 'Change HVAC filters and note the size' },
    { key: 'water_heater_check', title: 'Locate the water heater and check its age' },
    { key: 'dryer_vent', title: 'Clean dryer vents' },
    { key: 'check_leaks', title: 'Check for leaks under sinks, around toilets, and near the water heater' },
    { key: 'gfci_test', title: 'Test GFCI outlets in kitchens, bathrooms, and garage' },
  ]},
  { key: 'know_your_home', label: 'Get to Know the Home', icon: '🏠', items: [
    { key: 'inspection_report', title: 'Re-read your home inspection report and prioritize flagged items' },
    { key: 'exterior_walk', title: 'Walk the exterior — check gutters, grading, and caulking' },
    { key: 'meet_neighbors', title: 'Introduce yourself to neighbors' },
    { key: 'add_systems', title: 'Add all your home systems to Hearth' },
  ]},
  { key: 'financial', label: 'Financial Setup', icon: '💰', items: [
    { key: 'savings_account', title: 'Set up a dedicated savings account for home repairs (1–2% of home value annually)' },
    { key: 'mortgage_statement', title: 'Understand your mortgage statement and confirm your first payment date' },
    { key: 'homestead_exemption', title: 'Look into homestead exemption with your county — many have deadlines' },
  ]},
  { key: 'quick_wins', label: 'Quick Wins', icon: '✨', items: [
    { key: 'deep_clean', title: 'Deep clean before fully moving in if possible' },
    { key: 'paint_refresh', title: 'Repaint or refresh anything cosmetically bothersome' },
    { key: 'inspection_quotes', title: 'Get quotes for any issues flagged in the inspection' },
  ]},
]

const COST_DATA: Record<string, { maintain: string; repair: string; emergency: string; valueAtRisk: string }> = {
  roof: { maintain: '$150–400', repair: '$400–1,500', emergency: '$5,000–50,000', valueAtRisk: '$3,000–15,000' },
  hvac: { maintain: '$80–150', repair: '$200–1,200', emergency: '$5,000–12,000', valueAtRisk: '$1,000–4,000' },
  water_heater: { maintain: '$0–100', repair: '$150–500', emergency: '$8,000–15,000', valueAtRisk: '$2,400–5,400' },
  windows: { maintain: '$20–60', repair: '$100–500', emergency: '$1,000–8,000', valueAtRisk: '$1,000–5,000' },
  gutters: { maintain: '$120–200', repair: '$150–600', emergency: '$4,000–12,000', valueAtRisk: '$800–2,000' },
  siding: { maintain: '$100–300', repair: '$300–1,500', emergency: '$3,000–15,000', valueAtRisk: '$2,000–8,000' },
  deck: { maintain: '$200–600', repair: '$300–2,500', emergency: '$500–5,000', valueAtRisk: '$2,000–8,000' },
  sump_pump: { maintain: '$0', repair: '$200–400', emergency: '$10,000–30,000', valueAtRisk: '$1,000–3,000' },
  entry_door: { maintain: '$50–100', repair: '$150–500', emergency: '$500–2,000', valueAtRisk: '$500–2,000' },
  sliding_door: { maintain: '$50–150', repair: '$200–800', emergency: '$500–2,000', valueAtRisk: '$500–2,000' },
  chimney: { maintain: '$150–300', repair: '$500–2,500', emergency: '$2,000–15,000', valueAtRisk: '$1,000–3,000' },
}

function getCondition(sys: any) {
  if (sys.not_applicable) return { label: 'N/A', color: '#8A8A82', bg: '#F5F5F5', textColor: '#8A8A82' }
  if (sys.storm_damage_unaddressed || sys.known_issues) return { label: 'Inspect', color: '#9B2C2C', bg: '#FDECEA', textColor: '#9B2C2C' }
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

function getDeferredLiability(systems: any[]): number {
  const costs: Record<string, number> = {
    roof: 12000, hvac: 7000, water_heater: 1500, windows: 6000,
    deck: 8000, siding: 12000, entry_door: 2000, sliding_door: 2500,
    gutters: 2000, driveway: 4000, fencing: 3000, chimney: 2000, sump_pump: 800,
  }
  let total = 0
  for (const sys of systems) {
    if (sys.not_applicable) continue
    const effectiveYear = sys.replacement_year || sys.install_year
    if (!effectiveYear) continue
    const age = new Date().getFullYear() - effectiveYear
    const lifespan = SYSTEM_LIFESPANS[sys.system_type] || 20
    const pct = age / lifespan
    if (pct > 1.0) total += (costs[sys.system_type] || 3000)
    else if (pct > 0.8) total += (costs[sys.system_type] || 3000) * 0.3
  }
  return Math.round(total)
}

function getThisMonthTasks(systems: any[]): any[] {
  const tasks: any[] = []
  const month = new Date().getMonth()
  const isSpring = month >= 2 && month <= 4
  const isFall = month >= 8 && month <= 10
  const isWinter = month === 11 || month <= 1
  const isSummer = month >= 5 && month <= 7
  const criticalSystems = systems.filter(s => ['Inspect', 'Priority'].includes(getCondition(s).label))
  if (criticalSystems.length > 0) {
    tasks.push({ title: `Get your ${SYSTEM_DISPLAY_NAMES[criticalSystems[0].system_type] || criticalSystems[0].system_type} assessed`, urgency: 'high' })
  }
  if (isSpring) {
    tasks.push(
      { title: 'Clean gutters after winter', urgency: 'medium' },
      { title: 'Schedule HVAC tune-up before cooling season', urgency: 'medium' },
      { title: 'Test sump pump before spring rains', urgency: 'low' },
    )
  }
  if (isFall) {
    tasks.push(
      { title: 'Clean gutters before winter', urgency: 'high' },
      { title: 'Service heating system before cold weather', urgency: 'high' },
      { title: 'Disconnect hose bibs before first freeze', urgency: 'medium' },
    )
  }
  if (isWinter) tasks.push({ title: 'Check pipes in unheated spaces', urgency: 'high' })
  if (isSummer) tasks.push({ title: 'Check AC performance and replace filters', urgency: 'low' })
  return tasks.slice(0, 5)
}

function getSmartTasks(systems: any[], score: any, weather: any): any[] {
  const tasks: any[] = []
  const month = new Date().getMonth()
  const isSpring = month >= 2 && month <= 4
  const isFall = month >= 8 && month <= 10
  const isWinter = month === 11 || month <= 1
  const isSummer = month >= 5 && month <= 7
  if (weather?.recentStorm) {
    const stormAge = Date.now() - new Date(weather.recentStorm.date).getTime()
    if (stormAge < 21 * 24 * 60 * 60 * 1000) {
      tasks.push({ id: 'storm-event', title: `Walk your property after the ${weather.recentStorm.label.toLowerCase()}`, description: `Recorded ${new Date(weather.recentStorm.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Document with photos before calling anyone.`, source: 'smart', urgency: 'high' })
    }
  }
  const criticalSystems = systems.filter(s => ['Inspect', 'Priority'].includes(getCondition(s).label)).sort((a, b) => (getCondition(a).label === 'Inspect' ? 0 : 1) - (getCondition(b).label === 'Inspect' ? 0 : 1))
  if (criticalSystems.length > 0) {
    const sys = criticalSystems[0]
    tasks.push({ id: `age-${sys.id}`, title: `Get your ${SYSTEM_DISPLAY_NAMES[sys.system_type] || sys.system_type} assessed`, description: `Your ${SYSTEM_DISPLAY_NAMES[sys.system_type]} is approaching or past its expected lifespan. Get a quote before it becomes an emergency.`, source: 'smart', urgency: getCondition(sys).label === 'Inspect' ? 'high' : 'medium' })
  }
  if (isSpring) { tasks.push({ id: 'spring-1', title: 'Clean gutters and check drainage', description: 'Remove winter debris and make sure downspouts direct water away from your foundation.', source: 'seasonal', urgency: 'medium' }, { id: 'spring-2', title: 'Schedule HVAC tune-up before summer', description: 'Change filters and have the system checked before the cooling season starts.', source: 'seasonal', urgency: 'medium' }) }
  if (isFall) { tasks.push({ id: 'fall-1', title: 'Clean gutters before winter', description: 'Leaves and debris cause ice dams and water damage.', source: 'seasonal', urgency: 'medium' }, { id: 'fall-2', title: 'Service heating system', description: 'Schedule a furnace or heat pump tune-up before cold weather arrives.', source: 'seasonal', urgency: 'high' }) }
  if (isWinter) tasks.push({ id: 'winter-1', title: 'Check pipes in unheated spaces', description: 'Insulate exposed pipes in basement, garage, and crawl spaces to prevent freezing.', source: 'seasonal', urgency: 'high' })
  if (isSummer) tasks.push({ id: 'summer-1', title: 'Check AC performance and filters', description: 'Test cooling efficiency and replace filters if needed before peak heat.', source: 'seasonal', urgency: 'low' })
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
  const [saving, setSaving] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [homeownerType, setHomeownerType] = useState('')
  const [userGoals, setUserGoals] = useState<string[]>([])
  const [weather, setWeather] = useState<any>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [showStormDetail, setShowStormDetail] = useState(false)
  const [showStormHistory, setShowStormHistory] = useState(false)
  const [stormHistory, setStormHistory] = useState<any[]>([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [dismissedSmartTasks, setDismissedSmartTasks] = useState<string[]>([])
  const [propertyMenuOpen, setPropertyMenuOpen] = useState<string | null>(null)
  const [showClaimedModal, setShowClaimedModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingGoals, setEditingGoals] = useState(false)
  const [draftGoals, setDraftGoals] = useState<Set<string>>(new Set())
  const [completedChecklist, setCompletedChecklist] = useState<string[]>([])
  const [showFullChecklist, setShowFullChecklist] = useState(false)
  const [expandedChecklistCategories, setExpandedChecklistCategories] = useState<Set<string>>(new Set(['safety']))
  const [homeEdits, setHomeEdits] = useState<any>({})
  const [editingHomeSection, setEditingHomeSection] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['about']))
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set())
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null)
  const [systemEdits, setSystemEdits] = useState<any>({})
  const [showHiddenSystems, setShowHiddenSystems] = useState(false)
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
    const [{ data: detailData }, { data: systemData }, { data: jobData }, { data: scoreData }, { data: taskData }, { data: memberData }, { data: docData }] = await Promise.all([
      supabase.from('home_details').select('*').eq('home_id', homeId).single(),
      supabase.from('home_systems').select('*').eq('home_id', homeId),
      supabase.from('contractor_jobs').select('*').eq('home_id', homeId).order('job_date', { ascending: false }),
      supabase.from('health_scores').select('*').eq('home_id', homeId).order('calculated_at', { ascending: false }).limit(1),
      supabase.from('home_tasks').select('*').eq('home_id', homeId).order('created_at', { ascending: false }),
      supabase.from('home_members').select('*').eq('home_id', homeId).eq('status', 'active'),
      supabase.from('home_documents').select('*').eq('home_id', homeId).order('created_at', { ascending: false })
    ])
    setDetails(detailData); setSystems(systemData || []); setJobs(jobData || [])
    if (scoreData && scoreData.length > 0) setScore(scoreData[0])
    setTasks(taskData || [])
    setDismissedSmartTasks((taskData || []).filter((t: any) => t.status === 'dismissed').map((t: any) => t.title))
    setMembers(memberData || []); setDocs(docData || [])
    const { data: homeZipData } = await supabase.from('homes').select('zip').eq('id', homeId).single()
    if (homeZipData?.zip) {
      const { data: storms } = await supabase.from('storm_events').select('*').eq('zip', homeZipData.zip).order('event_date', { ascending: false }).limit(20)
      setStormHistory(storms || [])
    }
  }

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const { data: profile } = await supabase.from('user_profiles').select('first_name, last_name, homeowner_type, homeowner_goal').eq('user_id', user.id).single()
      if (profile?.first_name) setDisplayName(profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1))
      if (profile?.homeowner_type) setHomeownerType(profile.homeowner_type)
      if (profile?.homeowner_goal) setUserGoals(profile.homeowner_goal)
      const { data: checklistData } = await supabase.from('homeowner_checklist').select('item_key').eq('user_id', user.id).eq('completed', true)
      setCompletedChecklist((checklistData || []).map((c: any) => c.item_key))
      const { data: homes } = await supabase.from('homes').select('*').eq('user_id', user.id).order('is_primary', { ascending: false }).order('created_at', { ascending: false })
      if (homes && homes.length > 0) {
        setAllHomes(homes)
        const primaryHome = homes.find(h => h.is_primary) || homes[0]
        setHome(primaryHome)
        if (primaryHome.city || primaryHome.zip) {
          fetch(`/api/weather?city=${encodeURIComponent(primaryHome.city || '')}&state=${encodeURIComponent(primaryHome.state || '')}&zip=${encodeURIComponent(primaryHome.zip || '')}`)
            .then(r => r.json()).then(data => { if (!data.error) setWeather(data) }).finally(() => setWeatherLoading(false))
        } else { setWeatherLoading(false) }
        await loadHomeData(primaryHome.id)
        await supabase.rpc('recalculate_community_score', { p_user_id: user.id })
        const { data: csData } = await supabase.from('community_scores').select('*').eq('user_id', user.id).single()
        if (csData) setCommunityScore(csData)
        if (typeof window !== 'undefined' && window.location.search.includes('claimed=true')) { setShowClaimedModal(true); window.history.replaceState({}, '', '/dashboard') }
      } else { window.location.replace('/onboarding'); return }
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!loading && (homeownerType === 'first_time' || homeownerType === 'new_to_home') && jobs.length > 0) {
      const seen = localStorage.getItem('hearth_history_modal_seen')
      if (!seen) { setShowHistoryModal(true); localStorage.setItem('hearth_history_modal_seen', 'true') }
    }
  }, [loading, homeownerType, jobs.length])

  const switchHome = async (selectedHome: any) => {
    setHome(selectedHome); setSystems([]); setJobs([]); setTasks([]); setScore(null)
    setDetails(null); setMembers([]); setDocs([]); setWeather(null); setWeatherLoading(true); setLoading(true); setStormHistory([])
    if (selectedHome.city || selectedHome.zip) {
      fetch(`/api/weather?city=${encodeURIComponent(selectedHome.city || '')}&state=${encodeURIComponent(selectedHome.state || '')}&zip=${encodeURIComponent(selectedHome.zip || '')}`)
        .then(r => r.json()).then(data => { if (!data.error) setWeather(data) }).finally(() => setWeatherLoading(false))
    } else { setWeatherLoading(false) }
    await loadHomeData(selectedHome.id); setLoading(false)
  }

  const setPrimaryHome = async (homeId: string) => {
    await supabase.from('homes').update({ is_primary: false }).eq('user_id', user.id)
    await supabase.from('homes').update({ is_primary: true }).eq('id', homeId)
    setAllHomes(prev => prev.map(h => ({ ...h, is_primary: h.id === homeId }))); setPropertyMenuOpen(null)
  }

  const markForTransfer = async (homeId: string) => {
    await supabase.from('homes').update({ status: 'for_transfer' }).eq('id', homeId)
    setAllHomes(prev => prev.map(h => h.id === homeId ? { ...h, status: 'for_transfer' } : h)); setPropertyMenuOpen(null)
  }

  const recalculateScore = async () => {
    await supabase.rpc('recalculate_health_score', { p_home_id: home.id })
    const { data: updatedScore } = await supabase.from('health_scores').select('*').eq('home_id', home.id).order('calculated_at', { ascending: false }).limit(1)
    if (updatedScore && updatedScore.length > 0) setScore(updatedScore[0])
  }

  const startEditSection = (section: string) => {
    setHomeEdits({
      address: home?.address || '', city: home?.city || '', state: home?.state || '', zip: home?.zip || '',
      year_built: home?.year_built || '', home_type: details?.home_type || home?.home_type || '',
      sqft: details?.sqft || home?.sqft || '', bedrooms: details?.bedrooms || '',
      bathrooms: details?.bathrooms || '', stories: details?.stories || '', lot_size: details?.lot_size || '',
      foundation_type: details?.foundation_type || '', garage: details?.garage || '',
      has_fireplace: details?.has_fireplace || false, has_sump_pump: details?.has_sump_pump || false,
      has_pool: details?.has_pool || false, has_solar: details?.has_solar || false,
      has_septic: details?.has_septic || false, has_well_water: details?.has_well_water || false,
      has_hoa: details?.has_hoa || false, tree_coverage: details?.tree_coverage || '',
    })
    setEditingHomeSection(section)
  }

  const saveHomeSection = async (section: string) => {
    setSaving(true)
    if (section === 'about') {
      const { data: updatedHome } = await supabase.from('homes').update({ address: homeEdits.address, city: homeEdits.city, state: homeEdits.state, zip: homeEdits.zip, year_built: parseInt(homeEdits.year_built) || null }).eq('id', home.id).select().single()
      if (updatedHome) setHome(updatedHome)
    }
    const detailUpdate: any = {}
    if (section === 'about') { detailUpdate.home_type = homeEdits.home_type; detailUpdate.sqft = parseInt(homeEdits.sqft) || null; detailUpdate.bedrooms = parseInt(homeEdits.bedrooms) || null; detailUpdate.bathrooms = parseFloat(homeEdits.bathrooms) || null; detailUpdate.stories = parseInt(homeEdits.stories) || null; detailUpdate.lot_size = homeEdits.lot_size || null }
    if (section === 'features') { detailUpdate.foundation_type = homeEdits.foundation_type || null; detailUpdate.garage = homeEdits.garage || null; detailUpdate.has_fireplace = homeEdits.has_fireplace || false; detailUpdate.has_sump_pump = homeEdits.has_sump_pump || false; detailUpdate.has_pool = homeEdits.has_pool || false; detailUpdate.has_solar = homeEdits.has_solar || false; detailUpdate.has_septic = homeEdits.has_septic || false; detailUpdate.has_well_water = homeEdits.has_well_water || false; detailUpdate.has_hoa = homeEdits.has_hoa || false; detailUpdate.tree_coverage = homeEdits.tree_coverage || null }
    if (Object.keys(detailUpdate).length > 0) {
      if (details) { const { data: ud } = await supabase.from('home_details').update(detailUpdate).eq('home_id', home.id).select().single(); if (ud) setDetails(ud) }
      else { const { data: nd } = await supabase.from('home_details').insert({ home_id: home.id, ...detailUpdate }).select().single(); if (nd) setDetails(nd) }
    }
    await recalculateScore(); setEditingHomeSection(null); setSaving(false)
  }

  const startEditSystem = (sys: any) => {
    const edits: any = {}
    Object.keys(sys).forEach(k => { edits[k] = sys[k] })
    const fields = SYSTEM_FIELDS[sys.system_type] || []
    fields.forEach(f => { const key = f.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''); if (!(key in edits)) edits[key] = '' })
    setSystemEdits(edits); setEditingSystemId(sys.id)
    setExpandedSystems(prev => { const n = new Set(prev); n.add(sys.id); return n })
  }

  const saveSystem = async (sysId: string) => {
    setSaving(true)
    const effectiveYear = systemEdits.replacement_year || systemEdits.install_year
    const age = effectiveYear ? new Date().getFullYear() - parseInt(effectiveYear) : null
    const { data: updated } = await supabase.from('home_systems').update({ ...systemEdits, age_years: age, install_year: systemEdits.install_year ? parseInt(systemEdits.install_year) : null, replacement_year: systemEdits.replacement_year ? parseInt(systemEdits.replacement_year) : null }).eq('id', sysId).select().single()
    if (updated) setSystems(prev => prev.map(s => s.id === sysId ? updated : s))
    await recalculateScore(); setEditingSystemId(null); setSaving(false)
  }

  const addSystem = async (systemType: string) => {
    const { data } = await supabase.from('home_systems').insert({ home_id: home.id, system_type: systemType, not_applicable: false }).select().single()
    if (data) { setSystems(prev => [...prev, data]); startEditSystem(data) }
  }

  const toggleChecklistItem = async (itemKey: string) => {
    const isCompleted = completedChecklist.includes(itemKey)
    if (isCompleted) {
      await supabase.from('homeowner_checklist').update({ completed: false, completed_at: null }).eq('user_id', user.id).eq('item_key', itemKey)
      setCompletedChecklist(prev => prev.filter(k => k !== itemKey))
    } else {
      await supabase.from('homeowner_checklist').upsert({ user_id: user.id, item_key: itemKey, completed: true, completed_at: new Date().toISOString() }, { onConflict: 'user_id,item_key' })
      setCompletedChecklist(prev => [...prev, itemKey])
    }
  }

  const saveGoals = async () => {
    const goalsArray = Array.from(draftGoals)
    await supabase.from('user_profiles').upsert({ user_id: user.id, homeowner_goal: goalsArray, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    setUserGoals(goalsArray); setEditingGoals(false)
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return
    const { data } = await supabase.from('home_tasks').insert({ home_id: home.id, created_by: user.id, title: newTaskTitle, description: newTaskDesc || null, source: 'custom', status: 'todo', due_date: newTaskDue || null }).select().single()
    if (data) setTasks(prev => [data, ...prev])
    setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskDue(''); setShowAddTask(false)
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    await supabase.from('home_tasks').update({ status, completed_at: status === 'done' ? new Date().toISOString() : null }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    if (home?.id) await recalculateScore()
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from('home_tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const allowed = ['application/pdf','image/jpeg','image/png','image/webp']
    if (!allowed.includes(f.type)) { setUploadError('Only PDF, JPG, and PNG files are accepted.'); return }
    if (f.size > 10 * 1024 * 1024) { setUploadError('File must be under 10MB.'); return }
    setUploadError(''); setUploadFile(f)
    if (!uploadName) setUploadName(f.name.replace(/\.[^/.]+$/, ''))
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) { setUploadError('Please select a file and enter a name.'); return }
    setUploading(true); setUploadError('')
    try {
      const ext = uploadFile.name.split('.').pop()
      const filePath = `${user.id}/${home.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('home-documents').upload(filePath, uploadFile, { contentType: uploadFile.type })
      if (uploadErr) throw uploadErr
      const { data: doc } = await supabase.from('home_documents').insert({ home_id: home.id, user_id: user.id, name: uploadName.trim(), description: uploadDesc.trim() || null, category: uploadCategory, system_type: uploadSystem || null, file_path: filePath, file_size: uploadFile.size, file_type: uploadFile.type, expires_at: uploadExpires || null }).select().single()
      if (doc) setDocs(prev => [doc, ...prev])
      setUploadFile(null); setUploadName(''); setUploadDesc(''); setUploadCategory('other'); setUploadSystem(''); setUploadExpires(''); setShowUploadForm(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e: any) { setUploadError(e.message) }
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
    if (!window.confirm('Are you sure? This cannot be undone.')) return
    if (!window.confirm('Last chance — permanent and irreversible.')) return
    setDeletingAccount(true)
    const { error } = await supabase.rpc('delete_user_account')
    if (error) { alert('Error: ' + error.message); setDeletingAccount(false) }
    else { await supabase.auth.signOut(); window.location.href = '/' }
  }

  const formatSize = (bytes: number) => { if (!bytes) return ''; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB` }

  const renderSystemField = (field: { label: string; type: string; options?: string[] }) => {
    const key = field.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const val = systemEdits[key] ?? systemEdits[field.label] ?? ''
    const onChange = (v: any) => setSystemEdits((p: any) => ({ ...p, [key]: v, [field.label]: v }))
    if (field.type === 'boolean') return <label key={field.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}><input type="checkbox" checked={!!val} onChange={e => onChange(e.target.checked)} style={{ accentColor: '#1E3A2F' }} />{field.label}</label>
    if (field.type === 'select') return <div key={field.label}><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>{field.label}</label><select value={val} onChange={e => onChange(e.target.value)} style={inputStyle}><option value="">Unknown</option>{field.options?.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
    if (field.type === 'date') return <div key={field.label}><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>{field.label}</label><input type="date" value={val} onChange={e => onChange(e.target.value)} style={inputStyle} /></div>
    if (field.type === 'number') return <div key={field.label}><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>{field.label}</label><input type="number" value={val} onChange={e => onChange(e.target.value)} style={inputStyle} /></div>
    return <div key={field.label}><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>{field.label}</label><input value={val} onChange={e => onChange(e.target.value)} style={inputStyle} placeholder={field.type === 'year' ? 'e.g. 2018' : ''} /></div>
  }

  const renderSystemCard = (sys: any) => {
    const condition = getCondition(sys)
    const effectiveYear = sys.replacement_year || sys.install_year
    const age = effectiveYear ? new Date().getFullYear() - effectiveYear : null
    const lifespan = SYSTEM_LIFESPANS[sys.system_type] || 20
    const pct = age ? Math.min(100, Math.round((age / lifespan) * 100)) : 0
    const isEditing = editingSystemId === sys.id
    const isExpanded = expandedSystems.has(sys.id)
    const fields = SYSTEM_FIELDS[sys.system_type] || []
    const boolFields = fields.filter(f => f.type === 'boolean')
    const otherFields = fields.filter(f => f.type !== 'boolean')
    return (
      <div key={sys.id} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', cursor: 'pointer' }} onClick={() => setExpandedSystems(prev => { const n = new Set(prev); if (n.has(sys.id)) n.delete(sys.id); else n.add(sys.id); return n })}>
          <div style={{ fontSize: '22px', flexShrink: 0 }}>{SYSTEM_ICONS[sys.system_type] || '🔧'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>{SYSTEM_DISPLAY_NAMES[sys.system_type] || sys.system_type}</span>
              <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '20px', background: condition.bg, color: condition.textColor }}>{condition.label}</span>
              {sys.ever_replaced && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>Replaced {sys.replacement_year}</span>}
            </div>
            <div style={{ fontSize: '12px', color: '#8A8A82' }}>{sys.not_applicable ? 'Not applicable' : age ? `${age} yr old${sys.material ? ` · ${sys.material}` : ''}` : 'Tap to add details'}</div>
          </div>
          {age !== null && !sys.not_applicable && <div style={{ width: '60px', flexShrink: 0 }}><div style={{ height: '4px', background: '#EDE8E0', borderRadius: '2px' }}><div style={{ width: `${pct}%`, height: '100%', background: condition.color, borderRadius: '2px' }} /></div><div style={{ fontSize: '10px', color: '#8A8A82', textAlign: 'right', marginTop: '2px' }}>{pct}%</div></div>}
          <span style={{ fontSize: '12px', color: '#8A8A82', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
        </div>
        {isExpanded && (
          <div style={{ borderTop: '1px solid rgba(30,58,47,0.08)', padding: '16px 18px', background: '#F8F4EE' }}>
            {!isEditing ? (
              <div>
                {sys.known_issues && <div style={{ fontSize: '12px', color: '#8B3A2A', marginBottom: '10px' }}>⚠️ {sys.known_issues}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                  {[{ label: 'Install year', value: sys.install_year }, { label: 'Material', value: sys.material }, { label: 'Under warranty', value: sys.under_warranty ? 'Yes' : null }].filter(f => f.value).map(f => (
                    <div key={f.label} style={{ fontSize: '12px' }}><span style={{ color: '#8A8A82' }}>{f.label}: </span><span style={{ fontWeight: 500 }}>{f.value}</span></div>
                  ))}
                </div>
                <button onClick={e => { e.stopPropagation(); startEditSystem(sys) }} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '7px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Edit details</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  {otherFields.map(f => renderSystemField(f))}
                  <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Known issues</label><input value={systemEdits.known_issues || ''} onChange={e => setSystemEdits((p: any) => ({ ...p, known_issues: e.target.value }))} style={inputStyle} placeholder="Any known problems?" /></div>
                  <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Notes</label><input value={systemEdits.notes || ''} onChange={e => setSystemEdits((p: any) => ({ ...p, notes: e.target.value }))} style={inputStyle} placeholder="Anything else?" /></div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  {boolFields.map(f => renderSystemField(f))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}><input type="checkbox" checked={systemEdits.ever_replaced || false} onChange={e => setSystemEdits((p: any) => ({ ...p, ever_replaced: e.target.checked }))} style={{ accentColor: '#1E3A2F' }} />Ever replaced?</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}><input type="checkbox" checked={systemEdits.under_warranty || false} onChange={e => setSystemEdits((p: any) => ({ ...p, under_warranty: e.target.checked }))} style={{ accentColor: '#1E3A2F' }} />Under warranty</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}><input type="checkbox" checked={systemEdits.not_applicable || false} onChange={e => setSystemEdits((p: any) => ({ ...p, not_applicable: e.target.checked }))} style={{ accentColor: '#1E3A2F' }} />Not applicable</label>
                </div>
                {systemEdits.ever_replaced && <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Year replaced</label><input value={systemEdits.replacement_year || ''} onChange={e => setSystemEdits((p: any) => ({ ...p, replacement_year: e.target.value }))} style={{ ...inputStyle, maxWidth: '160px' }} placeholder="e.g. 2022" /></div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => saveSystem(sys.id)} disabled={saving} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{saving ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setEditingSystemId(null)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) return <div style={{ background: '#F8F4EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}><p style={{ color: '#8A8A82' }}>Loading your home...</p></div>

  const scoreValue = score?.total_score || 0
  const tabs = ['overview','home_details','financial','projects','maintenance','log','report','documents']
  const tabLabels: Record<string,string> = { overview: 'Overview', home_details: 'Home Details', financial: '💰 Financial', projects: '✨ Projects', maintenance: '📅 Maintenance', log: 'Contractor Log', report: 'Report Card', documents: 'Documents' }
  const alertSystems = systems.filter(s => ['Inspect','Priority'].includes(getCondition(s).label))
  const displayNameFinal = displayName || user?.email?.split('@')[0]?.split('.')[0]?.replace(/^\w/, (c: string) => c.toUpperCase()) || 'there'
  const smartTasks = getSmartTasks(systems, score, weather).filter(t => !dismissedSmartTasks.includes(t.id))
  const customTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'dismissed' && t.source !== 'smart' && t.source !== 'seasonal')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const communityLevel = getCommunityLevel(communityScore?.total_points || 0)
  const expiringDocs = docs.filter(d => { if (!d.expires_at) return false; const days = Math.ceil((new Date(d.expires_at).getTime() - Date.now()) / (1000*60*60*24)); return days <= 90 && days > 0 })
  const filteredDocs = docs.filter(d => docFilter === 'all' || d.category === docFilter)
  const docsByCategory = DOC_CATEGORIES.map(cat => ({ ...cat, docs: filteredDocs.filter(d => d.category === cat.key) })).filter(cat => cat.docs.length > 0)
  const stormDate = weather?.recentStorm ? new Date(weather.recentStorm.date) : null
  const stormIsFuture = stormDate ? stormDate.getTime() > Date.now() : false
  const showActiveStorm = stormDate !== null && (stormIsFuture || (Date.now() - stormDate.getTime()) < 21*24*60*60*1000)
  const deferredLiability = getDeferredLiability(systems)
  const isNewHomeowner = homeownerType === 'first_time' || homeownerType === 'new_to_home'
  const totalChecklistItems = FIRST_30_DAYS_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0)
  const checklistPct = Math.round((completedChecklist.length / totalChecklistItems) * 100)
  const thisMonthTasks = getThisMonthTasks(systems)
  const scoreDetails = [
    { label: 'Systems', icon: '🏠', value: score?.system_risk_score || 0, insight: (score?.system_risk_score || 0) >= 80 ? 'All systems in good shape' : 'Systems need attention', action: 'View', onClick: () => setActiveTab('home_details') },
    { label: 'Maintenance', icon: '🔧', value: score?.maintenance_score || 0, insight: (score?.maintenance_score || 0) >= 70 ? 'Great maintenance history' : 'Log more jobs to improve', action: 'Log', href: '/log' },
    { label: 'Value', icon: '💰', value: score?.value_protection_score || 0, insight: (score?.value_protection_score || 0) >= 70 ? 'Home value well protected' : 'See financial breakdown', action: 'View', onClick: () => setActiveTab('financial') },
    { label: 'Seasonal', icon: '🌿', value: score?.seasonal_readiness_score || 0, insight: (score?.seasonal_readiness_score || 0) >= 70 ? 'Ready for the season' : 'Check seasonal tasks', action: 'View', onClick: () => setActiveTab('maintenance') },
  ]

  const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid rgba(30,58,47,0.2)', borderRadius: '6px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff', color: '#1A1A18', boxSizing: 'border-box' }

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />
      <div style={{ background: '#1E3A2F', padding: '28px 28px 0' }}>
        <div style={{ paddingBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '4px' }}>Welcome back</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#F8F4EE', fontWeight: 400 }}>{displayNameFinal}</div>
          {allHomes.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', alignItems: 'center' }}>
              {allHomes.map(h => (
                <div key={h.id} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button onClick={() => switchHome(h)} style={{ background: h.id === home?.id ? '#C47B2B' : 'rgba(248,244,238,0.1)', border: `1px solid ${h.id === home?.id ? '#C47B2B' : 'rgba(248,244,238,0.2)'}`, borderRight: 'none', color: h.id === home?.id ? '#fff' : 'rgba(248,244,238,0.7)', padding: '6px 12px', borderRadius: '20px 0 0 20px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: h.id === home?.id ? 500 : 400, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {h.is_primary && <span style={{ fontSize: '10px' }}>⭐</span>}
                      {h.address}{h.city ? `, ${h.city}` : ''}
                    </button>
                    <button onClick={() => setPropertyMenuOpen(propertyMenuOpen === h.id ? null : h.id)} style={{ background: h.id === home?.id ? '#B36B20' : 'rgba(248,244,238,0.08)', border: `1px solid ${h.id === home?.id ? '#C47B2B' : 'rgba(248,244,238,0.2)'}`, color: h.id === home?.id ? '#fff' : 'rgba(248,244,238,0.7)', padding: '6px 8px', borderRadius: '0 20px 20px 0', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>•••</button>
                  </div>
                  {propertyMenuOpen === h.id && (
                    <div style={{ position: 'absolute', top: '36px', left: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid rgba(30,58,47,0.11)', overflow: 'hidden', zIndex: 300, minWidth: '220px' }}>
                      {!h.is_primary && <button onClick={() => setPrimaryHome(h.id)} style={{ display: 'block', width: '100%', padding: '11px 16px', background: 'none', border: 'none', borderBottom: '1px solid rgba(30,58,47,0.06)', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", color: '#1E3A2F' }}>⭐ Set as primary residence</button>}
                      {h.status !== 'for_transfer' && <button onClick={() => markForTransfer(h.id)} style={{ display: 'block', width: '100%', padding: '11px 16px', background: 'none', border: 'none', borderBottom: '1px solid rgba(30,58,47,0.06)', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", color: '#C47B2B' }}>🔑 Mark as former property</button>}
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
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'none', border: 'none', color: activeTab === tab ? '#F8F4EE' : 'rgba(248,244,238,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', padding: '9px 14px 13px', cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: activeTab === tab ? '2px solid #C47B2B' : '2px solid transparent', fontWeight: activeTab === tab ? 500 : 400, position: 'relative', bottom: '-1px', transition: 'color 0.2s' }}>{tabLabels[tab]}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 28px 48px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
            <div>
              {deferredLiability > 0 && (
                <div style={{ background: '#FDECEA', border: '1px solid rgba(139,58,42,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#9B2C2C', marginBottom: '2px' }}>💸 ${deferredLiability.toLocaleString()} in deferred maintenance identified</div>
                    <div style={{ fontSize: '12px', color: '#7A3A2A', lineHeight: 1.5 }}>If left unaddressed, this could grow significantly and impact your home value at sale.</div>
                  </div>
                  <button onClick={() => setActiveTab('financial')} style={{ background: '#9B2C2C', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>See breakdown →</button>
                </div>
              )}

              {alertSystems.length > 0 && (
                <div style={{ background: '#FBF0DC', border: '1px solid rgba(196,123,43,0.2)', borderRadius: '12px', padding: '12px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#7A4A10', marginBottom: '2px' }}>⚠️ {alertSystems.length} system{alertSystems.length > 1 ? 's' : ''} need attention</div>
                    <div style={{ fontSize: '12px', color: '#8A6A30' }}>{alertSystems.map(s => SYSTEM_DISPLAY_NAMES[s.system_type] || s.system_type).join(', ')}</div>
                  </div>
                  <button onClick={() => setActiveTab('home_details')} style={{ background: 'none', border: '1px solid rgba(122,74,16,0.3)', color: '#7A4A10', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>View →</button>
                </div>
              )}

              {isNewHomeowner && checklistPct < 100 && (
                <div style={{ background: '#fff', border: '2px solid #1E3A2F', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                  <div style={{ background: '#1E3A2F', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#F8F4EE', fontWeight: 400, marginBottom: '2px' }}>Your First 30 Days</h4>
                      <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.55)' }}>{completedChecklist.length} of {totalChecklistItems} complete · {checklistPct}%</div>
                    </div>
                    <button onClick={() => setShowFullChecklist(!showFullChecklist)} style={{ background: 'rgba(248,244,238,0.1)', border: '1px solid rgba(248,244,238,0.2)', color: '#F8F4EE', fontSize: '12px', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{showFullChecklist ? 'Collapse' : 'View all'}</button>
                  </div>
                  <div style={{ padding: '12px 20px' }}>
                    <div style={{ height: '6px', background: '#EDE8E0', borderRadius: '3px', marginBottom: '14px' }}><div style={{ width: `${checklistPct}%`, height: '100%', background: '#3D7A5A', borderRadius: '3px', transition: 'width 0.3s' }} /></div>
                    {!showFullChecklist ? (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {FIRST_30_DAYS_CATEGORIES.flatMap(cat => cat.items).filter(item => !completedChecklist.includes(item.key)).slice(0, 3).map(item => (
                          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button onClick={() => toggleChecklistItem(item.key)} style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #1E3A2F', background: 'none', cursor: 'pointer', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: '#1A1A18' }}>{item.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {FIRST_30_DAYS_CATEGORIES.map(cat => (
                          <div key={cat.key}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }} onClick={() => setExpandedChecklistCategories(prev => { const n = new Set(prev); if (n.has(cat.key)) n.delete(cat.key); else n.add(cat.key); return n })}>
                              <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{cat.label}</span>
                              <span style={{ fontSize: '11px', color: '#8A8A82', marginLeft: 'auto' }}>{cat.items.filter(i => completedChecklist.includes(i.key)).length}/{cat.items.length}</span>
                              <span style={{ fontSize: '11px', color: '#8A8A82' }}>{expandedChecklistCategories.has(cat.key) ? '▲' : '▼'}</span>
                            </div>
                            {expandedChecklistCategories.has(cat.key) && (
                              <div style={{ display: 'grid', gap: '8px', paddingLeft: '28px' }}>
                                {cat.items.map(item => { const done = completedChecklist.includes(item.key); return (
                                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <button onClick={() => toggleChecklistItem(item.key)} style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${done ? '#3D7A5A' : '#1E3A2F'}`, background: done ? '#3D7A5A' : 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {done && <span style={{ color: '#fff', fontSize: '11px' }}>✓</span>}
                                    </button>
                                    <span style={{ fontSize: '13px', color: done ? '#8A8A82' : '#1A1A18', textDecoration: done ? 'line-through' : 'none' }}>{item.title}</span>
                                  </div>
                                )})}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Health score card */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
                  <div style={{ width: '72px', height: '72px', flexShrink: 0, position: 'relative' }}>
                    <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="36" cy="36" r="28" fill="none" stroke="#EDE8E0" strokeWidth="8" />
                      <circle cx="36" cy="36" r="28" fill="none" stroke={scoreValue >= 80 ? '#3D7A5A' : scoreValue >= 60 ? '#C47B2B' : '#9B2C2C'} strokeWidth="8" strokeDasharray="176" strokeDashoffset={176 - (176 * scoreValue / 100)} strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#1E3A2F', fontWeight: 600 }}>{scoreValue}</div>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, marginBottom: '2px', color: '#1E3A2F' }}>{scoreValue >= 80 ? 'Your home is in great shape' : scoreValue >= 60 ? 'Your home is doing well' : 'Your home needs attention'}</h3>
                    <p style={{ fontSize: '12px', color: '#8A8A82' }}>Home health score · Tap a category to take action</p>
                  </div>
                </div>
                {scoreDetails.map((dim, i) => (
                  <div key={dim.label} style={{ padding: '12px 22px', borderBottom: i < scoreDetails.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => dim.onClick ? dim.onClick() : dim.href ? window.location.href = dim.href : null}>
                    <div style={{ fontSize: '20px', width: '28px', flexShrink: 0 }}>{dim.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{dim.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: dim.value >= 80 ? '#3D7A5A' : dim.value >= 60 ? '#C47B2B' : '#9B2C2C' }}>{dim.value}</span>
                      </div>
                      <div style={{ height: '6px', background: '#EDE8E0', borderRadius: '3px', marginBottom: '4px' }}><div style={{ width: `${dim.value}%`, height: '100%', background: dim.value >= 80 ? '#3D7A5A' : dim.value >= 60 ? '#C47B2B' : '#9B2C2C', borderRadius: '3px' }} /></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#8A8A82' }}>{dim.insight}</span>
                        <span style={{ fontSize: '11px', color: '#3D7A5A', fontWeight: 500 }}>{dim.action} →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* To-Do */}
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
                      <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} style={{ ...inputStyle, maxWidth: '200px' }} />
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
                        <option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done ✓</option>
                      </select>
                      <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#8A8A82', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
                    </div>
                  </div>
                ))}
                {smartTasks.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '13px 20px', borderBottom: '1px solid rgba(30,58,47,0.06)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, background: item.urgency === 'high' ? '#FDECEA' : item.urgency === 'medium' ? '#FBF0DC' : '#EAF2EC' }}>{item.source === 'smart' ? '🧠' : '📋'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', marginBottom: '2px' }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: '#8A8A82' }}>{item.description}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px', background: item.urgency === 'high' ? '#FDECEA' : item.urgency === 'medium' ? '#FBF0DC' : '#EAF2EC', color: item.urgency === 'high' ? '#9B2C2C' : item.urgency === 'medium' ? '#7A4A10' : '#3D7A5A' }}>{item.source === 'smart' ? 'Smart' : 'Seasonal'}</span>
                      <select defaultValue="todo" onChange={async e => { if (e.target.value === 'done' || e.target.value === 'dismiss') { setDismissedSmartTasks(prev => [...prev, item.id]); await supabase.from('home_tasks').insert({ home_id: home.id, created_by: user.id, title: item.id, source: item.source, status: 'dismissed', dismissed_at: new Date().toISOString() }) } }} style={{ fontSize: '11px', padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(30,58,47,0.2)', background: '#fff', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>
                        <option value="todo">To do</option><option value="done">Done ✓</option><option value="dismiss">Dismiss</option>
                      </select>
                    </div>
                  </div>
                ))}
                {customTasks.length === 0 && smartTasks.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: '#8A8A82', fontSize: '13px' }}>No tasks right now — add your own or they&apos;ll appear based on your home data.</div>}
                {doneTasks.length > 0 && <div style={{ padding: '10px 20px', background: '#F8F4EE', borderTop: '1px solid rgba(30,58,47,0.06)' }}><div style={{ fontSize: '12px', color: '#8A8A82' }}>✓ {doneTasks.length} completed task{doneTasks.length !== 1 ? 's' : ''}</div></div>}
              </div>

              {/* Systems preview */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(30,58,47,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 500 }}>Home Systems</h4>
                  <button onClick={() => setActiveTab('home_details')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#3D7A5A', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>View all →</button>
                </div>
                {systems.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center' }}><p style={{ fontSize: '13px', color: '#8A8A82' }}>No systems logged yet. <button onClick={() => setActiveTab('home_details')} style={{ background: 'none', border: 'none', color: '#1E3A2F', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }}>Add yours →</button></p></div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(30,58,47,0.08)' }}>
                    {systems.slice(0, 6).map(sys => { const condition = getCondition(sys); return (
                      <div key={sys.id} style={{ background: '#fff', padding: '16px 14px', cursor: 'pointer' }} onClick={() => { setActiveTab('home_details'); setExpandedSystems(prev => { const n = new Set(prev); n.add(sys.id); return n }) }}>
                        <div style={{ fontSize: '20px', marginBottom: '6px' }}>{SYSTEM_ICONS[sys.system_type] || '🔧'}</div>
                        <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '3px' }}>{SYSTEM_DISPLAY_NAMES[sys.system_type] || sys.system_type}</div>
                        <div style={{ fontSize: '11px', color: condition.textColor, fontWeight: 500 }}>{condition.label}</div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div>
              {/* Goals card */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>Your goals</h4>
                  <button onClick={() => { setEditingGoals(!editingGoals); setDraftGoals(new Set(userGoals)) }} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#3D7A5A', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{editingGoals ? 'Cancel' : 'Edit'}</button>
                </div>
                {!editingGoals ? (
                  userGoals.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {userGoals.map(key => { const goal = GOALS.find(g => g.key === key); return goal ? <span key={key} style={{ background: '#1E3A2F', color: '#F8F4EE', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>{goal.emoji} {goal.label}</span> : null })}
                    </div>
                  ) : <button onClick={() => { setEditingGoals(true); setDraftGoals(new Set()) }} style={{ width: '100%', background: '#F8F4EE', border: '1px dashed rgba(30,58,47,0.2)', color: '#8A8A82', fontSize: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Set your goals</button>
                ) : (
                  <div>
                    <p style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '10px' }}>Select up to 3</p>
                    <div style={{ display: 'grid', gap: '6px', marginBottom: '12px' }}>
                      {GOALS.map(goal => { const selected = draftGoals.has(goal.key); const atMax = draftGoals.size >= 3 && !selected; return (
                        <div key={goal.key} onClick={() => { if (atMax) return; setDraftGoals(prev => { const n = new Set(prev); if (n.has(goal.key)) n.delete(goal.key); else n.add(goal.key); return n }) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', border: `1px solid ${selected ? '#1E3A2F' : 'rgba(30,58,47,0.15)'}`, borderRadius: '8px', cursor: atMax ? 'not-allowed' : 'pointer', background: selected ? '#F0F5F2' : '#fff', opacity: atMax ? 0.5 : 1 }}>
                          <span style={{ fontSize: '16px' }}>{goal.emoji}</span>
                          <span style={{ fontSize: '12px', fontWeight: selected ? 500 : 400, color: '#1E3A2F', flex: 1 }}>{goal.label}</span>
                          {selected && <span style={{ fontSize: '11px', color: '#3D7A5A' }}>✓</span>}
                        </div>
                      )})}
                    </div>
                    <button onClick={saveGoals} style={{ width: '100%', background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Save goals</button>
                  </div>
                )}
              </div>

              {/* This month */}
              <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '12px' }}>This Month</div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {thisMonthTasks.map((task, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <span style={{ color: task.urgency === 'high' ? '#E57373' : task.urgency === 'medium' ? '#C47B2B' : '#6AAF8A' }}>●</span>
                      <span style={{ color: 'rgba(248,244,238,0.7)', flex: 1, lineHeight: 1.4 }}>{task.title}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab('maintenance')} style={{ marginTop: '14px', width: '100%', background: 'rgba(248,244,238,0.1)', border: '1px solid rgba(248,244,238,0.15)', color: 'rgba(248,244,238,0.8)', padding: '8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>View full calendar →</button>
              </div>

              {/* Community score */}
              {communityScore && (
                <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '24px' }}>{communityLevel.emoji}</div>
                    <div><div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{communityLevel.label}</div><div style={{ fontSize: '11px', color: '#8A8A82' }}>Community score</div></div>
                    <div style={{ marginLeft: 'auto', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#C47B2B', fontWeight: 600 }}>{communityScore.total_points}</div>
                  </div>
                  <a href="/neighbors" style={{ display: 'block', background: '#F8F4EE', border: '1px solid rgba(30,58,47,0.11)', color: '#1E3A2F', textAlign: 'center', padding: '8px', borderRadius: '8px', fontSize: '12px', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>View neighbor contributions →</a>
                </div>
              )}

              {/* Weather */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
                {weatherLoading ? (
                  <div style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ fontSize: '32px' }}>⛅</div><div style={{ fontSize: '13px', color: '#8A8A82' }}>Loading weather...</div></div>
                ) : weather ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px' }}>
                      <div style={{ fontSize: '32px' }}>{weather.emoji}</div>
                      <div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#1E3A2F' }}>{weather.temp}°</div><div style={{ fontSize: '12px', color: '#8A8A82' }}>{home?.city}, {home?.state} · {weather.desc}</div></div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#7A4A10', background: '#FBF0DC', padding: '9px 16px', borderTop: '1px solid rgba(196,123,43,0.14)' }}>{weather.tip}</div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px' }}><div style={{ fontSize: '32px' }}>⛅</div><div style={{ fontSize: '13px', color: '#8A8A82' }}>Weather unavailable</div></div>
                )}
              </div>

              {showActiveStorm && (
                <div style={{ background: '#FBF0DC', border: '1px solid rgba(196,123,43,0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#7A4A10', marginBottom: '3px' }}>{stormIsFuture ? '🌨️ Incoming storm forecast' : `⚠️ ${weather.recentStorm.label} recorded`}</div>
                  <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '6px' }}>{stormIsFuture ? `Expected ${new Date(weather.recentStorm.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : new Date(weather.recentStorm.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}{weather.recentStorm.windspeed > 0 && ` · ${Math.round(weather.recentStorm.windspeed)} mph winds`}</div>
                  <button onClick={() => setShowStormDetail(!showStormDetail)} style={{ background: 'none', border: '1px solid rgba(122,74,16,0.3)', color: '#7A4A10', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{showStormDetail ? 'Hide guide' : 'What to check →'}</button>
                  {showStormDetail && weather.inspectionGuides && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(196,123,43,0.2)' }}>
                      {weather.inspectionGuides.map((guide: any, i: number) => (
                        <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F', marginBottom: '4px' }}>{guide.what}</div>
                          <div style={{ fontSize: '11px', color: '#8A8A82', lineHeight: 1.6 }}>{guide.look_for}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {stormHistory.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <button onClick={() => setShowStormHistory(!showStormHistory)} style={{ width: '100%', background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: showStormHistory ? '10px 10px 0 0' : '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F' }}>🌩️ Storm history · {stormHistory.length} event{stormHistory.length !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: '11px', color: '#8A8A82' }}>{showStormHistory ? '▲ Hide' : '▼ Show'}</span>
                  </button>
                  {showStormHistory && (
                    <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                      {stormHistory.map((storm, i) => { const daysAgo = Math.round((Date.now() - new Date(storm.event_date).getTime()) / (1000*60*60*24)); const isForecast = daysAgo < 0; return (
                        <div key={storm.id} style={{ padding: '10px 14px', borderBottom: i < stormHistory.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>{storm.notes || storm.event_type?.replace(/_/g, ' ')}</div>
                              <div style={{ fontSize: '11px', color: '#8A8A82' }}>{new Date(storm.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{storm.max_windspeed > 0 && ` · ${Math.round(storm.max_windspeed)} mph`}</div>
                            </div>
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', flexShrink: 0, background: isForecast ? '#E6F2F8' : daysAgo <= 21 ? '#FBF0DC' : '#F5F5F5', color: isForecast ? '#3A7CA8' : daysAgo <= 21 ? '#7A4A10' : '#8A8A82', fontWeight: 500 }}>{isForecast ? `In ${Math.abs(daysAgo)}d` : daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>
              )}

              {/* Quick actions */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '14px' }}>Quick actions</h4>
                {[
                  { label: '+ Log a contractor job', href: '/log' },
                  { label: '✨ Add a project to wish list', onClick: () => setActiveTab('projects') },
                  { label: '💰 View financial breakdown', onClick: () => setActiveTab('financial') },
                  { label: '📅 View maintenance calendar', onClick: () => setActiveTab('maintenance') },
                  { label: '👥 Browse neighbor reviews', href: '/neighbors' },
                  { label: '📖 Browse guides', href: '/guides' },
                  { label: '+ Add another property', href: '/onboarding' },
                  { label: '🔑 Claim a home', href: '/claim' },
                ].map(action => action.href
                  ? <a key={action.label} href={action.href} style={{ display: 'block', padding: '9px 0', fontSize: '13px', color: '#1E3A2F', textDecoration: 'none', borderBottom: '1px solid rgba(30,58,47,0.07)' }}>{action.label}</a>
                  : <button key={action.label} onClick={action.onClick} style={{ display: 'block', width: '100%', padding: '9px 0', fontSize: '13px', color: '#1E3A2F', background: 'none', border: 'none', borderBottom: '1px solid rgba(30,58,47,0.07)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>{action.label}</button>
                )}
              </div>

              <div style={{ background: '#fff', border: '1px solid rgba(155,44,44,0.15)', borderRadius: '16px', padding: '18px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 500, color: '#9B2C2C', marginBottom: '8px' }}>Danger zone</h4>
                <p style={{ fontSize: '12px', color: '#8A8A82', lineHeight: 1.6, marginBottom: '12px' }}>Deleting your account permanently removes all your homes, systems, contractor jobs, and health scores.</p>
                <button onClick={handleDeleteAccount} disabled={deletingAccount} style={{ background: 'none', border: '1px solid rgba(155,44,44,0.3)', color: '#9B2C2C', fontSize: '12px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%' }}>{deletingAccount ? 'Deleting...' : 'Delete my account'}</button>
              </div>
            </div>
          </div>
        )}

        {/* HOME DETAILS TAB */}
        {activeTab === 'home_details' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '20px' }}>Home Details</h2>

            {/* About */}
            <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ padding: '16px 20px', borderBottom: expandedSections.has('about') ? '1px solid rgba(30,58,47,0.08)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setExpandedSections(prev => { const n = new Set(prev); if (n.has('about')) n.delete('about'); else n.add('about'); return n })}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1E3A2F' }}>About This Home</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {editingHomeSection !== 'about' && <button onClick={e => { e.stopPropagation(); startEditSection('about') }} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Edit</button>}
                  <span style={{ fontSize: '12px', color: '#8A8A82' }}>{expandedSections.has('about') ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandedSections.has('about') && (
                <div style={{ padding: '20px' }}>
                  {editingHomeSection === 'about' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[{ label: 'Street address', key: 'address' }, { label: 'City', key: 'city' }, { label: 'State', key: 'state' }, { label: 'ZIP', key: 'zip' }, { label: 'Year built', key: 'year_built' }, { label: 'Square footage', key: 'sqft' }, { label: 'Bedrooms', key: 'bedrooms' }, { label: 'Bathrooms', key: 'bathrooms' }, { label: 'Stories', key: 'stories' }, { label: 'Lot size', key: 'lot_size' }].map(field => (
                        <div key={field.key}><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>{field.label}</label><input value={homeEdits[field.key] || ''} onChange={e => setHomeEdits((p: any) => ({ ...p, [field.key]: e.target.value }))} style={inputStyle} /></div>
                      ))}
                      <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Home type</label><select value={homeEdits.home_type || ''} onChange={e => setHomeEdits((p: any) => ({ ...p, home_type: e.target.value }))} style={inputStyle}><option value="">Unknown</option><option value="single_family">Single family</option><option value="townhouse">Townhouse</option><option value="condo">Condo</option><option value="multi_family">Multi-family</option><option value="mobile_home">Mobile home</option></select></div>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button onClick={() => saveHomeSection('about')} disabled={saving} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{saving ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => setEditingHomeSection(null)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[{ label: 'Address', value: home?.address }, { label: 'City / State / ZIP', value: `${home?.city || ''}${home?.state ? `, ${home.state}` : ''}${home?.zip ? ` ${home.zip}` : ''}` }, { label: 'Year built', value: home?.year_built }, { label: 'Home type', value: (details?.home_type || home?.home_type)?.replace('_', ' ') }, { label: 'Sq ft', value: details?.sqft ? `${details.sqft.toLocaleString()} sq ft` : null }, { label: 'Beds / Baths', value: details?.bedrooms ? `${details.bedrooms} bd · ${details.bathrooms || '?'} ba` : null }, { label: 'Stories', value: details?.stories }, { label: 'Lot size', value: details?.lot_size }].filter(s => s.value).map(stat => (
                        <div key={stat.label} style={{ fontSize: '13px' }}><span style={{ color: '#8A8A82' }}>{stat.label}: </span><span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{stat.value}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Structure & Features */}
            <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ padding: '16px 20px', borderBottom: expandedSections.has('features') ? '1px solid rgba(30,58,47,0.08)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setExpandedSections(prev => { const n = new Set(prev); if (n.has('features')) n.delete('features'); else n.add('features'); return n })}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1E3A2F' }}>Structure & Features</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {editingHomeSection !== 'features' && <button onClick={e => { e.stopPropagation(); startEditSection('features') }} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Edit</button>}
                  <span style={{ fontSize: '12px', color: '#8A8A82' }}>{expandedSections.has('features') ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandedSections.has('features') && (
                <div style={{ padding: '20px' }}>
                  {editingHomeSection === 'features' ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Foundation</label><select value={homeEdits.foundation_type || ''} onChange={e => setHomeEdits((p: any) => ({ ...p, foundation_type: e.target.value }))} style={inputStyle}><option value="">Unknown</option><option value="full_basement">Full basement</option><option value="partial_basement">Partial basement</option><option value="crawl_space">Crawl space</option><option value="slab">Slab</option><option value="pier_beam">Pier and beam</option></select></div>
                        <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Garage</label><select value={homeEdits.garage || ''} onChange={e => setHomeEdits((p: any) => ({ ...p, garage: e.target.value }))} style={inputStyle}><option value="">None</option><option value="attached">Attached</option><option value="detached">Detached</option><option value="carport">Carport</option></select></div>
                        <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Tree coverage</label><select value={homeEdits.tree_coverage || ''} onChange={e => setHomeEdits((p: any) => ({ ...p, tree_coverage: e.target.value }))} style={inputStyle}><option value="">Unknown</option><option value="heavy">Heavy</option><option value="moderate">Moderate</option><option value="light">Light</option><option value="none">None</option></select></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                        {[{ label: 'Fireplace', key: 'has_fireplace' }, { label: 'Sump pump', key: 'has_sump_pump' }, { label: 'Pool / hot tub', key: 'has_pool' }, { label: 'Solar panels', key: 'has_solar' }, { label: 'Septic system', key: 'has_septic' }, { label: 'Well water', key: 'has_well_water' }, { label: 'HOA', key: 'has_hoa' }].map(cb => (
                          <label key={cb.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}><input type="checkbox" checked={homeEdits[cb.key] || false} onChange={e => setHomeEdits((p: any) => ({ ...p, [cb.key]: e.target.checked }))} style={{ accentColor: '#1E3A2F', width: '16px', height: '16px' }} />{cb.label}</label>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => saveHomeSection('features')} disabled={saving} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{saving ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => setEditingHomeSection(null)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {[{ label: details?.foundation_type?.replace('_', ' '), show: !!details?.foundation_type }, { label: `${details?.garage} garage`, show: !!details?.garage }, { label: `${details?.tree_coverage} tree coverage`, show: !!details?.tree_coverage }, { label: '🔥 Fireplace', show: details?.has_fireplace }, { label: '💦 Sump pump', show: details?.has_sump_pump }, { label: '🏊 Pool', show: details?.has_pool }, { label: '☀️ Solar', show: details?.has_solar }, { label: '🪣 Septic', show: details?.has_septic }, { label: '💧 Well water', show: details?.has_well_water }, { label: '🏘️ HOA', show: details?.has_hoa }].filter(f => f.show).map(f => (
                        <span key={f.label} style={{ background: '#F8F4EE', border: '1px solid rgba(30,58,47,0.15)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', color: '#1E3A2F', textTransform: 'capitalize' }}>{f.label}</span>
                      ))}
                      {!details?.foundation_type && !details?.has_fireplace && !details?.garage && <span style={{ fontSize: '13px', color: '#8A8A82' }}>No features added yet — tap Edit to add yours.</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auto-Detected */}
            <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: expandedSections.has('auto') ? '1px solid rgba(30,58,47,0.08)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setExpandedSections(prev => { const n = new Set(prev); if (n.has('auto')) n.delete('auto'); else n.add('auto'); return n })}>
                <div><h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1E3A2F' }}>Auto-Detected from ZIP</h3><p style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>Based on {home?.zip || 'your address'}</p></div>
                <span style={{ fontSize: '12px', color: '#8A8A82' }}>{expandedSections.has('auto') ? '▲' : '▼'}</span>
              </div>
              {expandedSections.has('auto') && (
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[{ label: `Climate Zone ${details?.climate_zone || 'detecting...'}`, icon: '🌡️', bg: '#E6F2F8', color: '#3A7CA8' }, { label: details?.hard_water_zone ? 'Hard water area' : 'Standard water', icon: '💧', bg: '#E6F2F8', color: '#3A7CA8' }, { label: details?.wildfire_zone ? '⚠️ Wildfire zone' : 'Low wildfire risk', icon: '🔥', bg: details?.wildfire_zone ? '#FDECEA' : '#EAF2EC', color: details?.wildfire_zone ? '#9B2C2C' : '#3D7A5A' }, { label: details?.coastal_zone ? 'Coastal / high wind' : 'Inland', icon: '🌊', bg: '#E6F2F8', color: '#3A7CA8' }].map(badge => (
                      <span key={badge.label} style={{ background: badge.bg, color: badge.color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>{badge.icon} {badge.label}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: '#8A8A82', marginTop: '10px' }}>These signals affect your maintenance recommendations and storm alerts. Contact us if something looks wrong.</p>
                </div>
              )}
            </div>

            {/* Systems */}
            <div style={{ marginBottom: '8px' }}><h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>Home Systems</h3></div>
            {ALL_SYSTEMS.map(systemType => {
              const existing = systems.find(s => s.system_type === systemType)
              if (existing) { if (existing.not_applicable && !showHiddenSystems) return null; return renderSystemCard(existing) }
              return <div key={systemType} style={{ background: '#fff', border: '1px dashed rgba(30,58,47,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', opacity: 0.6 }} onClick={() => addSystem(systemType)}><div style={{ fontSize: '22px' }}>{SYSTEM_ICONS[systemType] || '🔧'}</div><span style={{ fontSize: '14px', color: '#1E3A2F' }}>+ Add {SYSTEM_DISPLAY_NAMES[systemType] || systemType}</span></div>
            })}
            {systems.some(s => s.not_applicable) && <button onClick={() => setShowHiddenSystems(!showHiddenSystems)} style={{ background: 'none', border: 'none', color: '#8A8A82', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: '8px 0', marginBottom: '20px' }}>{showHiddenSystems ? 'Hide not applicable systems' : `Show ${systems.filter(s => s.not_applicable).length} hidden systems`}</button>}

            {/* Appliances */}
            <div style={{ marginTop: '8px', marginBottom: '8px' }}><h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>Appliances</h3></div>
            {APPLIANCES.map(appType => {
              const existing = systems.find(s => s.system_type === appType)
              if (existing) return renderSystemCard(existing)
              return <div key={appType} style={{ background: '#fff', border: '1px dashed rgba(30,58,47,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', opacity: 0.6 }} onClick={() => addSystem(appType)}><div style={{ fontSize: '22px' }}>{SYSTEM_ICONS[appType] || '🔧'}</div><span style={{ fontSize: '14px', color: '#1E3A2F' }}>+ Add {SYSTEM_DISPLAY_NAMES[appType] || appType}</span></div>
            })}
          </div>
        )}

        {/* FINANCIAL TAB */}
        {activeTab === 'financial' && (
          <div>
            <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '28px 32px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(196,123,43,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '16px' }}>Financial Intelligence</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '20px' }}>
                  {[
                    { label: 'Maintenance Spent (this year)', value: `$${jobs.filter(j => j.final_price && new Date(j.job_date).getFullYear() === new Date().getFullYear()).reduce((a: number, j: any) => a + Number(j.final_price), 0).toLocaleString()}`, sub: `${jobs.filter(j => new Date(j.job_date).getFullYear() === new Date().getFullYear()).length} job${jobs.length !== 1 ? 's' : ''} logged this year`, color: '#F8F4EE' },
                    { label: 'Deferred Maintenance Liability', value: deferredLiability > 0 ? `~$${deferredLiability.toLocaleString()}` : '$0', sub: deferredLiability > 0 ? 'Cost grows if left unaddressed' : 'No deferred maintenance identified', color: deferredLiability > 0 ? '#E57373' : '#6AAF8A' },
                    { label: 'Home Value at Risk', value: deferredLiability > 0 ? `~$${Math.round(deferredLiability * 2.1).toLocaleString()}` : '$0', sub: 'Estimated buyer negotiation impact at sale', color: deferredLiability > 0 ? '#E57373' : '#6AAF8A' },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.45)', marginBottom: '6px' }}>{stat.label}</div>
                      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 600, color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.5)' }}>{stat.sub}</div>
                    </div>
                  ))}
                </div>
                {deferredLiability > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.5)', marginBottom: '6px' }}>Most impactful: Address {systems.filter(s => ['Inspect','Priority'].includes(getCondition(s).label))[0]?.system_type?.replace(/_/g, ' ') || 'flagged systems'} first</div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '4px' }}><div style={{ width: `${Math.min(100, (deferredLiability / 15000) * 100)}%`, height: '100%', background: deferredLiability > 8000 ? '#E57373' : deferredLiability > 4000 ? '#C47B2B' : '#6AAF8A', borderRadius: '4px' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(248,244,238,0.35)' }}><span>$0 deferred</span><span>Your home</span><span>$15,000+ critical</span></div>
                  </div>
                )}
              </div>
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '6px' }}>Cost of Action vs. Inaction</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px', lineHeight: 1.6 }}>Each system shows what it costs to address now vs. what happens if you wait — and the impact on your home value at sale.</p>

            <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
              {systems.filter(s => !s.not_applicable && getCondition(s).label !== 'Good').map(sys => {
                const condition = getCondition(sys)
                const cd = COST_DATA[sys.system_type]
                if (!cd) return null
                return (
                  <div key={sys.id} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '24px' }}>{SYSTEM_ICONS[sys.system_type]}</div>
                        <div><div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F' }}>{SYSTEM_DISPLAY_NAMES[sys.system_type]}</div><div style={{ fontSize: '12px', color: '#8A8A82' }}>{sys.material || 'Material unknown'}{sys.install_year ? ` · ${new Date().getFullYear() - sys.install_year} yr old` : ''}</div></div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '20px', background: condition.bg, color: condition.textColor }}>{condition.label}</span>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
                        {[{ label: 'Maintain now', amount: cd.maintain, icon: '✅', bg: '#EAF2EC', color: '#3D7A5A' }, { label: 'Repair if ignored', amount: cd.repair, icon: '⏳', bg: '#FBF0DC', color: '#7A4A10' }, { label: 'Emergency cost', amount: cd.emergency, icon: '🚨', bg: '#FDECEA', color: '#9B2C2C' }].map(tier => (
                          <div key={tier.label} style={{ background: tier.bg, borderRadius: '10px', padding: '12px' }}>
                            <div style={{ fontSize: '16px', marginBottom: '4px' }}>{tier.icon}</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: tier.color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tier.label}</div>
                            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: tier.color, fontWeight: 600 }}>{tier.amount}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F4EE', borderRadius: '8px', padding: '10px 14px' }}>
                        <span style={{ fontSize: '12px', color: '#1E3A2F' }}>🏠 Home value impact at sale</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#9B2C2C' }}>–{cd.valueAtRisk}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {systems.filter(s => !s.not_applicable && getCondition(s).label !== 'Good').length === 0 && (
                <div style={{ background: '#EAF2EC', border: '1px solid rgba(61,122,90,0.2)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '6px' }}>All systems in good shape</h3>
                  <p style={{ fontSize: '13px', color: '#8A8A82' }}>No deferred maintenance identified. Keep logging jobs to maintain your score.</p>
                </div>
              )}
            </div>

            <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>Neighborhood Benchmark</h3>
                {home?.zip && <span style={{ fontSize: '12px', background: '#EAF2EC', color: '#3D7A5A', padding: '3px 10px', borderRadius: '20px', fontWeight: 500 }}>ZIP {home.zip}</span>}
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {[{ label: 'You spent (this year)', value: `$${jobs.filter(j => j.final_price && new Date(j.job_date).getFullYear() === new Date().getFullYear()).reduce((a: number, j: any) => a + Number(j.final_price), 0).toLocaleString()}`, bg: '#F8F4EE', color: '#1E3A2F' }, { label: 'Neighbor pricing', value: 'See neighbors', bg: '#EAF2EC', color: '#3D7A5A' }, { label: 'Jobs logged', value: String(jobs.length), bg: '#FBF0DC', color: '#7A4A10' }].map(stat => (
                    <div key={stat.label} style={{ background: stat.bg, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: stat.color, fontWeight: 600, marginBottom: '4px' }}>{stat.value}</div>
                      <div style={{ fontSize: '12px', color: '#8A8A82' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#FBF0DC', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#7A4A10', lineHeight: 1.6 }}>💡 Homes that stay current on maintenance typically sell 8–12 days faster and closer to asking price. <a href="/neighbors" style={{ color: '#C47B2B', fontWeight: 500 }}>See neighbor jobs →</a></div>
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && <ProjectsTab homeId={home?.id} userId={user?.id} jobs={jobs} />}

        {/* MAINTENANCE TAB */}
        {activeTab === 'maintenance' && <MaintenanceTab systems={systems} home={home} jobs={jobs} onTabChange={setActiveTab} />}

        {/* LOG TAB */}
        {activeTab === 'log' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F' }}>Contractor History</h2>
              <a href="/log" style={{ background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}>+ Log a job</a>
            </div>
            {jobs.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid rgba(30,58,47,0.11)' }}><div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div><p style={{ color: '#8A8A82' }}>No jobs logged yet. <a href="/log" style={{ color: '#1E3A2F', fontWeight: 500 }}>Log your first job →</a></p></div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {jobs.map(job => (
                  <div key={job.id} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>{job.company_name}</h4>
                      <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '6px' }}>{job.service_description} · {job.system_type?.replace(/_/g, ' ')}{job.job_date ? ` · ${new Date(job.job_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''}</p>
                      <a href="/log" style={{ fontSize: '11px', color: '#3D7A5A', textDecoration: 'none', border: '1px solid rgba(30,58,47,0.2)', padding: '3px 10px', borderRadius: '20px' }}>Edit →</a>
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
        {activeTab === 'report' && <ReportCardInline home={home} details={details} systems={systems} jobs={jobs} score={score} onTabChange={setActiveTab} />}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div><h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>Document Vault</h2><p style={{ fontSize: '13px', color: '#8A8A82' }}>{docs.length} document{docs.length !== 1 ? 's' : ''} · Transfers with your home</p></div>
              <button onClick={() => setShowUploadForm(!showUploadForm)} style={{ background: '#C47B2B', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Upload</button>
            </div>
            <div style={{ background: '#EAF2EC', border: '1px solid rgba(61,122,90,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>🔒</span>
              <div style={{ fontSize: '12px', color: '#3D7A5A', lineHeight: 1.6 }}><strong>Private and secure.</strong> Only you and approved co-owners can access these. Store home-related files only — warranties, permits, inspection reports, manuals.</div>
            </div>
            {expiringDocs.length > 0 && (
              <div style={{ background: '#FBF0DC', border: '1px solid rgba(196,123,43,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#7A4A10', marginBottom: '6px' }}>⚠️ {expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''} expiring within 90 days</div>
                {expiringDocs.map(d => { const days = Math.ceil((new Date(d.expires_at).getTime() - Date.now()) / (1000*60*60*24)); return <div key={d.id} style={{ fontSize: '12px', color: '#8A8A82' }}>{d.name} — expires in {days} days</div> })}
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
                  <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Document name *</label><input value={uploadName} onChange={e => setUploadName(e.target.value)} style={inputStyle} placeholder="e.g. Roof warranty 2021" /></div>
                  <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Description (optional)</label><input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} style={inputStyle} placeholder="e.g. 10-year workmanship warranty" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Category *</label><select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} style={inputStyle}>{DOC_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div>
                    <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Related system</label><select value={uploadSystem} onChange={e => setUploadSystem(e.target.value)} style={inputStyle}><option value="">None</option>{DOC_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  </div>
                  <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Expiration date (optional)</label><input type="date" value={uploadExpires} onChange={e => setUploadExpires(e.target.value)} style={inputStyle} /></div>
                </div>
                {uploadError && <div style={{ background: '#FDECEA', color: '#9B2C2C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '12px' }}>{uploadError}</div>}
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button onClick={handleUpload} disabled={uploading || !uploadFile} style={{ flex: 2, background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: uploading || !uploadFile ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: uploading || !uploadFile ? 0.6 : 1 }}>{uploading ? 'Uploading...' : 'Upload document'}</button>
                  <button onClick={() => { setShowUploadForm(false); setUploadFile(null); setUploadError('') }} style={{ flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '10px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                </div>
              </div>
            )}
            {docs.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button onClick={() => setDocFilter('all')} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: docFilter === 'all' ? '#1E3A2F' : '#fff', color: docFilter === 'all' ? '#F8F4EE' : '#1E3A2F', outline: '1px solid rgba(30,58,47,0.15)' }}>All ({docs.length})</button>
                {DOC_CATEGORIES.filter(c => docs.some(d => d.category === c.key)).map(cat => <button key={cat.key} onClick={() => setDocFilter(cat.key)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: docFilter === cat.key ? cat.textColor : cat.color, color: docFilter === cat.key ? '#fff' : cat.textColor, outline: `1px solid ${cat.textColor}33` }}>{cat.icon} {cat.label} ({docs.filter(d => d.category === cat.key).length})</button>)}
              </div>
            )}
            {docs.length === 0 && !showUploadForm && (
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '44px', marginBottom: '14px' }}>📂</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>No documents yet</h3>
                <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto 20px' }}>Store warranties, permits, inspection reports, and manuals here. They transfer automatically when you pass ownership.</p>
                <button onClick={() => setShowUploadForm(true)} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '11px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Upload your first document</button>
              </div>
            )}
            {docsByCategory.map(cat => (
              <div key={cat.key} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)', display: 'flex', alignItems: 'center', gap: '10px', background: cat.color }}><span style={{ fontSize: '16px' }}>{cat.icon}</span><h4 style={{ fontSize: '13px', fontWeight: 500, color: cat.textColor }}>{cat.label}</h4><span style={{ fontSize: '11px', color: cat.textColor, opacity: 0.7, marginLeft: 'auto' }}>{cat.docs.length} file{cat.docs.length !== 1 ? 's' : ''}</span></div>
                {cat.docs.map((doc: any, i: number) => { const isPdf = doc.file_type === 'application/pdf'; const isImage = doc.file_type?.startsWith('image/'); const isExpiring = doc.expires_at && Math.ceil((new Date(doc.expires_at).getTime() - Date.now()) / (1000*60*60*24)) <= 90; return (
                  <div key={doc.id} style={{ padding: '12px 20px', borderBottom: i < cat.docs.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '20px', flexShrink: 0 }}>{isPdf ? '📄' : isImage ? '🖼️' : '📎'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{doc.name}</span>
                        {doc.system_type && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: '#EDE8E0', color: '#8A8A82' }}>{doc.system_type}</span>}
                        {isExpiring && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: '#FBF0DC', color: '#C47B2B' }}>⏰ Expiring soon</span>}
                      </div>
                      {doc.description && <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '2px' }}>{doc.description}</div>}
                      <div style={{ fontSize: '11px', color: '#8A8A82' }}>{formatSize(doc.file_size)}{doc.expires_at && ` · Expires ${new Date(doc.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}{` · Added ${new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => handleDownload(doc)} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{isImage ? 'View' : 'Download'}</button>
                      <button onClick={() => handleDeleteDoc(doc)} style={{ background: 'none', border: '1px solid rgba(155,44,44,0.2)', color: '#9B2C2C', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
                    </div>
                  </div>
                )})}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showHistoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>This home has a history</h2>
            <p style={{ fontSize: '14px', color: '#8A8A82', lineHeight: 1.7, marginBottom: '24px' }}>There are {jobs.length} contractor job{jobs.length !== 1 ? 's' : ''} already logged for this home. Want to review the history first or jump into your new homeowner guide?</p>
            <div style={{ display: 'grid', gap: '10px' }}>
              <button onClick={() => { setShowHistoryModal(false); setActiveTab('log') }} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>See this home&apos;s history first</button>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '12px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Start my new homeowner guide</button>
            </div>
          </div>
        </div>
      )}
      {showClaimedModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>This home is now yours</h2>
            <p style={{ fontSize: '14px', color: '#8A8A82', lineHeight: 1.7, marginBottom: '24px' }}>You now have full access to this home&apos;s complete history. Would you like to update the home details now?</p>
            <div style={{ display: 'grid', gap: '10px' }}>
              <button onClick={() => { setShowClaimedModal(false); setActiveTab('home_details') }} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Update home details now</button>
              <button onClick={() => setShowClaimedModal(false)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '12px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>I&apos;ll do it later</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

// ── PROJECTS TAB ────────────────────────────────────────────

function ProjectsTab({ homeId, userId, jobs }: any) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', system_type: '', description: '', timeline: 'within_2_years', estimated_cost_low: '', estimated_cost_high: '', notes: '' })

  useEffect(() => {
    if (!homeId) return
    supabase.from('home_projects').select('*').eq('home_id', homeId).order('created_at', { ascending: false })
      .then(({ data }) => { setProjects(data || []); setLoading(false) })
  }, [homeId])

  const addProject = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('home_projects').insert({ home_id: homeId, user_id: userId, title: form.title, system_type: form.system_type || null, description: form.description || null, timeline: form.timeline, estimated_cost_low: parseInt(form.estimated_cost_low) || null, estimated_cost_high: parseInt(form.estimated_cost_high) || null, notes: form.notes || null }).select().single()
    if (data) setProjects(prev => [data, ...prev])
    setForm({ title: '', system_type: '', description: '', timeline: 'within_2_years', estimated_cost_low: '', estimated_cost_high: '', notes: '' })
    setShowAdd(false); setSaving(false)
  }

  const deleteProject = async (id: string) => {
    if (!window.confirm('Remove this project?')) return
    await supabase.from('home_projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const TIMELINE_LABELS: Record<string, string> = { within_1_year: 'Within 1 year', within_2_years: 'Within 2 years', '3_5_years': '3–5 years', someday: 'Someday' }
  const TIMELINE_COLORS: Record<string, { bg: string; color: string }> = { within_1_year: { bg: '#FDECEA', color: '#9B2C2C' }, within_2_years: { bg: '#FBF0DC', color: '#7A4A10' }, '3_5_years': { bg: '#E6F2F8', color: '#3A7CA8' }, someday: { bg: '#F5F5F5', color: '#8A8A82' } }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid rgba(30,58,47,0.2)', borderRadius: '6px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff', color: '#1A1A18', boxSizing: 'border-box' }

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '6px' }}>Project Wish List</h2>
          <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.6 }}>Add projects you&apos;re planning — Hearth will show you costs, best timing, and neighbor prices to help you prepare.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: '#C47B2B', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>+ Add project</button>
      </div>

      {showAdd && (
        <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F', marginBottom: '16px' }}>New project</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Project name *</label><input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} placeholder="e.g. Deck replacement, Kitchen renovation" /></div>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Timeline</label><select value={form.timeline} onChange={e => setForm(p => ({ ...p, timeline: e.target.value }))} style={inputStyle}><option value="within_1_year">Within 1 year</option><option value="within_2_years">Within 2 years</option><option value="3_5_years">3–5 years</option><option value="someday">Someday</option></select></div>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Related system</label><select value={form.system_type} onChange={e => setForm(p => ({ ...p, system_type: e.target.value }))} style={inputStyle}><option value="">None / general</option>{Object.entries(SYSTEM_DISPLAY_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Est. cost low ($)</label><input type="number" value={form.estimated_cost_low} onChange={e => setForm(p => ({ ...p, estimated_cost_low: e.target.value }))} style={inputStyle} placeholder="e.g. 12000" /></div>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Est. cost high ($)</label><input type="number" value={form.estimated_cost_high} onChange={e => setForm(p => ({ ...p, estimated_cost_high: e.target.value }))} style={inputStyle} placeholder="e.g. 18000" /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Notes</label><input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={inputStyle} placeholder="Any details, preferences, or inspiration" /></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={addProject} disabled={saving} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{saving ? 'Saving...' : 'Add project'}</button>
            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', color: '#8A8A82', padding: '40px' }}>Loading projects...</div> : projects.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '44px', marginBottom: '14px' }}>✨</div>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>No projects yet</h3>
          <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto 20px' }}>Add projects you&apos;re dreaming about or planning. Hearth will help you understand costs, timing, and what neighbors have paid.</p>
          <button onClick={() => setShowAdd(true)} style={{ background: '#C47B2B', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Add your first project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {projects.map(project => {
            const tl = TIMELINE_COLORS[project.timeline] || TIMELINE_COLORS.someday
            const neighborJobs = jobs.filter((j: any) => j.system_type === project.system_type && j.final_price)
            const neighborAvg = neighborJobs.length > 0 ? Math.round(neighborJobs.reduce((a: number, j: any) => a + Number(j.final_price), 0) / neighborJobs.length) : null
            return (
              <div key={project.id} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(30,58,47,0.08)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ fontSize: '28px', flexShrink: 0 }}>{SYSTEM_ICONS[project.system_type] || '🏗️'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>{project.title}</h3>
                      <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: tl.bg, color: tl.color }}>{TIMELINE_LABELS[project.timeline]}</span>
                    </div>
                    {project.notes && <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.6 }}>{project.notes}</p>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {project.estimated_cost_low && <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#1E3A2F', fontWeight: 600 }}>${project.estimated_cost_low.toLocaleString()}–${project.estimated_cost_high?.toLocaleString() || '?'}</div>}
                    <button onClick={() => deleteProject(project.id)} style={{ background: 'none', border: 'none', color: '#8A8A82', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: '4px' }}>Remove</button>
                  </div>
                </div>
                <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'Neighbors paid', value: neighborAvg ? `$${neighborAvg.toLocaleString()} avg` : 'No data yet', sub: neighborAvg ? `${neighborJobs.length} job${neighborJobs.length !== 1 ? 's' : ''} nearby` : 'Be first to log this' },
                    { label: 'Best time to hire', value: 'Spring / Fall', sub: 'Less busy, better rates' },
                    { label: 'Your estimate', value: project.estimated_cost_low ? `$${project.estimated_cost_low.toLocaleString()}+` : 'Not set', sub: 'Edit to update' },
                  ].map(insight => (
                    <div key={insight.label} style={{ background: '#F8F4EE', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{insight.label}</div>
                      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#1E3A2F', fontWeight: 600, marginBottom: '2px' }}>{insight.value}</div>
                      <div style={{ fontSize: '11px', color: '#8A8A82' }}>{insight.sub}</div>
                    </div>
                  ))}
                </div>
                {project.system_type && (
                  <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(30,58,47,0.08)', background: '#F8F4EE' }}>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#8A8A82', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Related guides</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <a href="/guides" style={{ fontSize: '12px', color: '#1E3A2F', background: '#fff', border: '1px solid rgba(30,58,47,0.2)', padding: '5px 12px', borderRadius: '20px', textDecoration: 'none' }}>📖 {SYSTEM_DISPLAY_NAMES[project.system_type]} guide</a>
                      <a href="/guides" style={{ fontSize: '12px', color: '#1E3A2F', background: '#fff', border: '1px solid rgba(30,58,47,0.2)', padding: '5px 12px', borderRadius: '20px', textDecoration: 'none' }}>🔑 How to hire a contractor</a>
                      <a href="/neighbors" style={{ fontSize: '12px', color: '#1E3A2F', background: '#fff', border: '1px solid rgba(30,58,47,0.2)', padding: '5px 12px', borderRadius: '20px', textDecoration: 'none' }}>👥 See neighbor prices</a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── MAINTENANCE TAB ──────────────────────────────────────────

function MaintenanceTab({ systems, home, jobs, onTabChange }: any) {
  const MAINTENANCE_ITEMS = [
    { key: 'hvac_filter', title: 'Replace HVAC filter', system: 'hvac', interval: 'Every 1–3 months', cost: '$15–40 DIY', difficulty: 'Easy DIY', months: [1,4,7,10], urgency: 'high' },
    { key: 'gutter_cleaning', title: 'Clean gutters', system: 'gutters', interval: 'Twice yearly', cost: '$120–200', difficulty: 'Moderate DIY', months: [3,10], urgency: 'medium' },
    { key: 'dryer_vent', title: 'Clean dryer vent', system: null, interval: 'Annually', cost: '$100–150', difficulty: 'Moderate DIY', months: [3], urgency: 'high' },
    { key: 'smoke_detector', title: 'Test smoke and CO detectors', system: null, interval: 'Monthly', cost: 'Free', difficulty: 'Easy DIY', months: [1,2,3,4,5,6,7,8,9,10,11,12], urgency: 'medium' },
    { key: 'water_heater_flush', title: 'Flush water heater', system: 'water_heater', interval: 'Annually', cost: '$0–100', difficulty: 'Moderate DIY', months: [9], urgency: 'medium' },
    { key: 'sump_pump_test', title: 'Test sump pump', system: 'sump_pump', interval: 'Every spring', cost: 'Free', difficulty: 'Easy DIY', months: [3,4], urgency: 'medium' },
    { key: 'exterior_caulk', title: 'Inspect and re-caulk exterior', system: null, interval: 'Annually', cost: '$20–60', difficulty: 'Easy DIY', months: [4,9], urgency: 'low' },
    { key: 'roof_inspection', title: 'Professional roof inspection', system: 'roof', interval: 'Every 3–5 years', cost: '$150–400', difficulty: 'Professional', months: [4,9], urgency: 'medium' },
    { key: 'hose_bib', title: 'Disconnect hose bibs before freeze', system: null, interval: 'Every fall', cost: 'Free', difficulty: 'Easy DIY', months: [10,11], urgency: 'high' },
    { key: 'chimney_sweep', title: 'Chimney sweep and inspection', system: 'chimney', interval: 'Annually if used', cost: '$150–300', difficulty: 'Professional', months: [8,9], urgency: 'medium' },
    { key: 'deck_seal', title: 'Seal / stain deck', system: 'deck', interval: 'Every 2–3 years', cost: '$200–600', difficulty: 'Easy DIY', months: [4,5], urgency: 'low' },
  ]

  const currentMonth = new Date().getMonth() + 1
  const monthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const relevantItems = MAINTENANCE_ITEMS.filter(item => {
    if (item.system) return systems.some((s: any) => s.system_type === item.system && !s.not_applicable)
    return true
  })

  const thisMonthItems = relevantItems.filter(item => item.months.includes(currentMonth))
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
  const upcomingItems = relevantItems.filter(item => item.months.includes(nextMonth) && !item.months.includes(currentMonth))
  const overdueItems = relevantItems.filter(item => {
    const lastJob = jobs.filter((j: any) => j.system_type === item.system).sort((a: any, b: any) => new Date(b.job_date).getTime() - new Date(a.job_date).getTime())[0]
    return !lastJob && item.urgency === 'high'
  })

  const urgencyStyle = (u: string) => u === 'high' ? { bg: '#FDECEA', color: '#9B2C2C', dot: '#E57373', badge: 'High priority' } : u === 'medium' ? { bg: '#FBF0DC', color: '#7A4A10', dot: '#C47B2B', badge: 'This month' } : { bg: '#EAF2EC', color: '#3D7A5A', dot: '#6AAF8A', badge: 'When ready' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>Maintenance Calendar</h2>
          <p style={{ fontSize: '13px', color: '#8A8A82' }}>Personalized based on your home systems and maintenance history.</p>
        </div>
      </div>

      {overdueItems.length > 0 && (
        <div style={{ background: '#FDECEA', border: '1px solid rgba(155,44,44,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🚨</span>
          <div><div style={{ fontSize: '13px', fontWeight: 500, color: '#9B2C2C', marginBottom: '2px' }}>{overdueItems.length} item{overdueItems.length !== 1 ? 's' : ''} likely overdue</div><div style={{ fontSize: '12px', color: '#7A3A2A' }}>{overdueItems.map(i => i.title).join(' · ')}</div></div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ background: '#1E3A2F', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#F8F4EE', fontWeight: 400 }}>{monthName}</h3>
          <span style={{ fontSize: '12px', background: '#C47B2B', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontWeight: 500 }}>{thisMonthItems.length} task{thisMonthItems.length !== 1 ? 's' : ''}</span>
        </div>
        {thisMonthItems.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8A8A82', fontSize: '13px' }}>Nothing scheduled this month — you&apos;re ahead of the curve.</div>
        ) : thisMonthItems.map((item, i) => {
          const us = urgencyStyle(item.urgency)
          return (
            <div key={item.key} style={{ padding: '16px 20px', borderBottom: i < thisMonthItems.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: us.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{SYSTEM_ICONS[item.system || ''] || '🔧'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '8px' }}>{item.interval} · {item.cost} · {item.difficulty}</div>
                <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: us.bg, color: us.color }}>{us.badge}</span>
              </div>
              <button onClick={() => onTabChange('log')} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>Log done</button>
            </div>
          )
        })}
      </div>

      {upcomingItems.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}><h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1E3A2F' }}>Coming up next month</h3></div>
          {upcomingItems.map((item, i) => (
            <div key={item.key} style={{ padding: '14px 20px', borderBottom: i < upcomingItems.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '20px' }}>{SYSTEM_ICONS[item.system || ''] || '🔧'}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{item.title}</div><div style={{ fontSize: '12px', color: '#8A8A82' }}>{item.cost} · {item.difficulty}</div></div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}><h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1E3A2F' }}>Full year schedule</h3></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(30,58,47,0.08)' }}>
          {Array.from({ length: 12 }, (_, i) => {
            const month = i + 1
            const monthItems = relevantItems.filter(item => item.months.includes(month))
            const mName = new Date(2026, i, 1).toLocaleString('en-US', { month: 'short' })
            const isNow = month === currentMonth
            return (
              <div key={month} style={{ background: isNow ? '#F0F5F2' : '#fff', padding: '12px', minHeight: '80px' }}>
                <div style={{ fontSize: '12px', fontWeight: isNow ? 600 : 500, color: isNow ? '#1E3A2F' : '#8A8A82', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {mName}{isNow && <span style={{ fontSize: '9px', background: '#C47B2B', color: '#fff', padding: '1px 5px', borderRadius: '10px' }}>Now</span>}
                </div>
                {monthItems.slice(0, 3).map(item => (
                  <div key={item.key} style={{ fontSize: '10px', color: urgencyStyle(item.urgency).color, display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '7px' }}>●</span><span style={{ lineHeight: 1.3 }}>{item.title}</span>
                  </div>
                ))}
                {monthItems.length > 3 && <div style={{ fontSize: '10px', color: '#8A8A82' }}>+{monthItems.length - 3} more</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── REPORT CARD ──────────────────────────────────────────────

function ReportCardInline({ home, details, systems, jobs, score, onTabChange }: any) {
  const [copied, setCopied] = useState(false)
  const scoreValue = score?.total_score || 0
  const age = home?.year_built ? new Date().getFullYear() - home.year_built : null
  const alertSystems = systems.filter((s: any) => ['Inspect', 'Priority'].includes(getCondition(s).label))
  const scoreDetails = [
    { label: 'System Risk', icon: '🏠', value: score?.system_risk_score || 0, weight: '35%', insight: (score?.system_risk_score || 0) >= 80 ? 'All systems in good shape' : 'Systems need attention', onClick: () => onTabChange('home_details') },
    { label: 'Maintenance', icon: '🔧', value: score?.maintenance_score || 0, weight: '30%', insight: (score?.maintenance_score || 0) >= 70 ? 'Strong maintenance history' : 'Log more jobs to improve', href: '/log' },
    { label: 'Value Protection', icon: '💰', value: score?.value_protection_score || 0, weight: '20%', insight: (score?.value_protection_score || 0) >= 70 ? 'Home value well protected' : 'Address flagged systems before selling', onClick: () => onTabChange('financial') },
    { label: 'Seasonal Readiness', icon: '🌿', value: score?.seasonal_readiness_score || 0, weight: '15%', insight: (score?.seasonal_readiness_score || 0) >= 70 ? 'Ready for the season' : 'Review seasonal checklist', onClick: () => onTabChange('maintenance') },
  ]

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#8A8A82' }}>{home?.address} · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[{ label: copied ? '✓ Copied!' : '🔗 Copy link', onClick: () => { navigator.clipboard.writeText(window.location.origin + '/report'); setCopied(true); setTimeout(() => setCopied(false), 2000) } }, { label: '🖨️ Print', onClick: () => window.print() }, { label: '↗️ Full page', onClick: () => window.open('/report', '_blank') }].map(btn => (
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
                <div key={stat.label}><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#F8F4EE', fontWeight: 600 }}>{stat.value}</div><div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.5)', marginTop: '2px' }}>{stat.label}</div></div>
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
          <div style={{ fontSize: '12px', color: '#7A3A2A' }}>{alertSystems.map((s: any) => SYSTEM_DISPLAY_NAMES[s.system_type] || s.system_type).join(', ')}</div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)' }}><h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F' }}>Score Breakdown</h3></div>
        {scoreDetails.map((dim, i) => (
          <div key={dim.label} style={{ padding: '14px 20px', borderBottom: i < scoreDetails.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: dim.onClick || dim.href ? 'pointer' : 'default' }} onClick={() => dim.onClick ? dim.onClick() : dim.href ? window.location.href = dim.href : null}>
            <div style={{ fontSize: '20px', width: '26px', flexShrink: 0 }}>{dim.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <div><span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{dim.label}</span><span style={{ fontSize: '11px', color: '#8A8A82', marginLeft: '6px' }}>{dim.weight}</span></div>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 600, color: dim.value >= 80 ? '#3D7A5A' : dim.value >= 60 ? '#C47B2B' : '#9B2C2C' }}>{dim.value}</span>
              </div>
              <div style={{ height: '6px', background: '#EDE8E0', borderRadius: '3px', marginBottom: '4px' }}><div style={{ width: `${dim.value}%`, height: '100%', background: dim.value >= 80 ? '#3D7A5A' : dim.value >= 60 ? '#C47B2B' : '#9B2C2C', borderRadius: '3px' }} /></div>
              <div style={{ fontSize: '11px', color: '#8A8A82' }}>{dim.insight}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {[{ emoji: '🏠', title: 'For Buyers', color: '#3D7A5A', items: ['Request maintenance records before closing', 'Flag systems past 80% of expected lifespan', 'Use deferred maintenance as negotiation leverage', 'Ask for contractor warranties on recent work', 'Get independent inspection of flagged systems'] }, { emoji: '🔑', title: 'For Sellers', color: '#C47B2B', items: ['Address Inspect and Priority items before listing', 'Document all recent contractor work', 'Share this report card with serious buyers', 'Systems in Good condition are a selling advantage', 'Recent maintenance history builds buyer confidence'] }].map(section => (
          <div key={section.title} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderTop: `3px solid ${section.color}`, borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{section.emoji}</div>
            <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1E3A2F', marginBottom: '12px' }}>{section.title}</h4>
            {section.items.map(item => <div key={item} style={{ display: 'flex', gap: '6px', marginBottom: '6px', fontSize: '12px', color: '#4A4A44', lineHeight: 1.5 }}><span style={{ color: section.color, flexShrink: 0 }}>✓</span>{item}</div>)}
          </div>
        ))}
      </div>
    </div>
  )
}
