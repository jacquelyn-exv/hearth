'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const SYSTEMS = [
  // Core systems
  'Roof','Siding','Gutters & Trim','Windows','Entry Door','Sliding Door',
  'Garage Door','HVAC','Water Heater','Plumbing','Electrical',
  'Deck / Patio','Driveway','Fencing','Chimney','Sump Pump','Foundation',
  // Situational
  'Septic System','Well','Solar Panels','Generator','Pool / Hot Tub',
  'Crawl Space','Water Softener','Irrigation',
  // Appliances
  'Refrigerator','Dishwasher','Washer','Dryer','Oven / Range',
  // Project types only
  'Interior Painting','Exterior Painting','Flooring','Insulation',
  'Pest Control','Landscaping','Basement Waterproofing',
  'Bathroom Remodel','Kitchen Remodel','Addition / New Space',
  'Security System','General Repair','Other',
]
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const YEARS = Array.from({ length: 20 }, (_, i) => (new Date().getFullYear() - i).toString())
const PRESET_TAGS = ['Quality work','Fair pricing','On time','Clean','Overpriced','Late','Upsell attempt','Would hire again']
const LOG_TYPES = [
  { key: 'upgrade_replacement', label: 'Upgrade / Replacement', emoji: '🔨', desc: 'New install, full replacement, or major upgrade' },
  { key: 'repair', label: 'Repair', emoji: '🔧', desc: 'Something broke or needed fixing' },
  { key: 'maintenance', label: 'Maintenance', emoji: '🛠️', desc: 'Routine upkeep — cleaning, servicing, adjusting' },
  { key: 'inspection', label: 'Inspection / Service', emoji: '🔍', desc: 'Professional came out, assessment or tune-up' },
]
const TYPE_COLORS: Record<string,{bg:string;color:string;border:string}> = {
  upgrade_replacement: { bg: '#EAF2EC', color: '#3D7A5A', border: 'rgba(61,122,90,0.2)' },
  repair:              { bg: '#FBF0DC', color: '#7A4A10', border: 'rgba(196,123,43,0.2)' },
  maintenance:         { bg: '#E6F2F8', color: '#3A7CA8', border: 'rgba(58,124,168,0.2)' },
  inspection:          { bg: '#F5EAE7', color: '#8B3A2A', border: 'rgba(139,58,42,0.2)' },
}
const urgencyOrder: Record<string,number> = { high: 0, medium: 1, low: 2 }
const iS: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff', color: '#1A1A18', boxSizing: 'border-box' }

// ─── Job Log Modal ────────────────────────────────────────────────────────────
function JobModal({ homeId, userId, zip, entry, onSave, onClose }: {
  homeId: string; userId: string; zip?: string; entry?: any; onSave: (entry: any) => void; onClose: () => void
}) {
  const [logType, setLogType] = useState(entry?.log_type || 'upgrade_replacement')
  const [performedBy, setPerformedBy] = useState(entry?.performed_by || 'contractor')
  const [company, setCompany] = useState(entry?.company_name || '')
  const [website, setWebsite] = useState(entry?.contractor_website || '')
  const [system, setSystem] = useState(() => {
    if (!entry?.system_type) return ''
    return SYSTEMS.find(s => s.toLowerCase().replace(/ \/ /g,'_').replace(/ /g,'_') === entry.system_type) || ''
  })
  const [description, setDescription] = useState(entry?.service_description || '')
  const [jobMonth, setJobMonth] = useState(() => entry?.job_date ? MONTHS[new Date(entry.job_date).getMonth()] : '')
  const [jobYear, setJobYear] = useState(() => entry?.job_date ? String(new Date(entry.job_date).getFullYear()) : String(new Date().getFullYear()))
  const [quotedPrice, setQuotedPrice] = useState(entry?.quoted_price ? String(entry.quoted_price) : '')
  const [finalPrice, setFinalPrice] = useState(entry?.final_price ? String(entry.final_price) : '')
  const [materialCost, setMaterialCost] = useState(entry?.material_cost ? String(entry.material_cost) : '')
  const [hoursSpent, setHoursSpent] = useState(entry?.hours_spent ? String(entry.hours_spent) : '')
  const [rating, setRating] = useState(entry?.quality_rating || 0)
  const [wouldRefer, setWouldRefer] = useState(entry?.would_refer || 'yes')
  const [selectedTags, setSelectedTags] = useState<string[]>(entry?.tags || [])
  const [notes, setNotes] = useState(entry?.notes || '')
  const [isShared, setIsShared] = useState(entry?.is_shared ?? true)
  const [saving, setSaving] = useState(false)
  const isDIY = performedBy === 'diy'

  const save = async () => {
    setSaving(true)
    const sysValue = system.toLowerCase().replace(/ \/ /g,'_').replace(/ /g,'_')
    const jobDate = jobMonth && jobYear ? `${jobYear}-${(MONTHS.indexOf(jobMonth)+1).toString().padStart(2,'0')}-01` : null
    const payload: any = {
      entry_type: 'job', status: 'done', source: 'manual',
      log_type: logType, performed_by: performedBy,
      company_name: isDIY ? null : (company || null),
      contractor_website: isDIY ? null : (website || null),
      system_type: sysValue || null,
      service_description: description || null,
      title: description || null,
      job_date: jobDate,
      completed_at: jobDate ? new Date(jobDate).toISOString() : new Date().toISOString(),
      quoted_price: quotedPrice ? parseFloat(quotedPrice) : null,
      final_price: finalPrice ? parseFloat(finalPrice) : null,
      material_cost: materialCost ? parseFloat(materialCost) : null,
      hours_spent: hoursSpent ? parseFloat(hoursSpent) : null,
      quality_rating: isDIY ? null : (rating || null),
      would_refer: isDIY ? null : wouldRefer,
      tags: selectedTags, notes: notes || null,
      is_shared: isDIY ? false : isShared,
      shared_radius: (!isDIY && isShared) ? 'zip' : null,
      zip: (!isDIY && isShared && zip) ? zip : null,
    }
    let data: any
    if (entry?.id) {
      const res = await supabase.from('home_activity').update(payload).eq('id', entry.id).select().single()
      data = res.data
    } else {
      const res = await supabase.from('home_activity').insert({ home_id: homeId, user_id: userId, ...payload }).select().single()
      data = res.data
    }
    await fetch('/api/recalculate-score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ home_id: homeId }) })
    setSaving(false)
    if (data) onSave(data)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F' }}>{entry?.id ? 'Edit entry' : 'Log a job'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#8A8A82' }}>×</button>
        </div>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '8px' }}>Type of entry</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {LOG_TYPES.map(t => (
                <button key={t.key} onClick={() => setLogType(t.key)} style={{ padding: '10px 12px', borderRadius: '10px', border: `2px solid ${logType===t.key?'#1E3A2F':'rgba(30,58,47,0.15)'}`, background: logType===t.key?'#1E3A2F':'#fff', color: logType===t.key?'#F8F4EE':'#1E3A2F', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>{t.emoji}</div>
                  <div style={{ fontSize: '12px', fontWeight: 500 }}>{t.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, lineHeight: 1.3 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {logType !== 'inspection' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '8px' }}>Who did the work?</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{v:'contractor',l:'🏢 Hired a contractor'},{v:'diy',l:'🙋 I did it myself'}].map(opt => (
                  <button key={opt.v} onClick={() => setPerformedBy(opt.v)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${performedBy===opt.v?'#1E3A2F':'rgba(30,58,47,0.15)'}`, background: performedBy===opt.v?'#1E3A2F':'#fff', color: performedBy===opt.v?'#F8F4EE':'#1E3A2F', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{opt.l}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>System / Area</label>
            <select value={system} onChange={e => setSystem(e.target.value)} style={iS}>
              <option value="">Select a system...</option>
              {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Description of work</label>
            <input value={description} onChange={e => setDescription(e.target.value)} style={iS} placeholder={logType==='maintenance'?'e.g. Cleaned gutters, replaced HVAC filter':'e.g. Full roof replacement, architectural shingles'} />
          </div>
          {!isDIY && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Company name</label><input value={company} onChange={e => setCompany(e.target.value)} style={iS} placeholder="e.g. Smith Roofing" /></div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Website (optional)</label><input value={website} onChange={e => setWebsite(e.target.value)} style={iS} placeholder="e.g. smithroofing.com" /></div>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Date completed</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <select value={jobMonth} onChange={e => setJobMonth(e.target.value)} style={iS}><option value="">Month</option>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
              <select value={jobYear} onChange={e => setJobYear(e.target.value)} style={iS}>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
            </div>
          </div>
          {!isDIY ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Quoted price</label><input value={quotedPrice} onChange={e => setQuotedPrice(e.target.value)} style={iS} placeholder="$0" type="number" /></div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Final price paid</label><input value={finalPrice} onChange={e => setFinalPrice(e.target.value)} style={iS} placeholder="$0" type="number" /></div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Cost of materials</label><input value={materialCost} onChange={e => setMaterialCost(e.target.value)} style={iS} placeholder="$0" type="number" /></div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Hours to complete</label><input value={hoursSpent} onChange={e => setHoursSpent(e.target.value)} style={iS} placeholder="e.g. 4" type="number" /></div>
            </div>
          )}
          {!isDIY && logType !== 'inspection' && (<>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '8px' }}>Quality rating</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1,2,3,4,5].map(n => <button key={n} onClick={() => setRating(n)} style={{ flex: 1, padding: '10px 0', borderRadius: '8px', fontSize: '20px', border: `2px solid ${rating>=n?'#C47B2B':'rgba(30,58,47,0.15)'}`, background: rating>=n?'#FBF0DC':'#fff', cursor: 'pointer' }}>★</button>)}
              </div>
              {rating > 0 && <p style={{ fontSize: '11px', color: '#8A8A82', marginTop: '4px' }}>{['','Poor','Fair','Good','Very good','Excellent'][rating]}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '8px' }}>Would you refer them?</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{v:'yes',l:'Yes'},{v:'with_note',l:'With reservations'},{v:'no',l:'No'}].map(opt => (
                  <button key={opt.v} onClick={() => setWouldRefer(opt.v)} style={{ flex: 1, padding: '9px 4px', borderRadius: '8px', fontSize: '12px', border: `2px solid ${wouldRefer===opt.v?'#1E3A2F':'rgba(30,58,47,0.15)'}`, background: wouldRefer===opt.v?'#1E3A2F':'#fff', color: wouldRefer===opt.v?'#F8F4EE':'#1A1A18', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{opt.l}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '8px' }}>Tags</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {PRESET_TAGS.map(tag => <button key={tag} onClick={() => setSelectedTags(prev => prev.includes(tag)?prev.filter(t=>t!==tag):[...prev,tag])} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', border: `1px solid ${selectedTags.includes(tag)?'#1E3A2F':'rgba(30,58,47,0.2)'}`, background: selectedTags.includes(tag)?'#1E3A2F':'#fff', color: selectedTags.includes(tag)?'#F8F4EE':'#1A1A18', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{tag}</button>)}
              </div>
            </div>
          </>)}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...iS, minHeight: '72px', resize: 'vertical' }} placeholder="Anything else worth remembering..." />
          </div>
          {!isDIY && logType !== 'inspection' && (
            <div style={{ background: '#F8F4EE', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }} onClick={() => setIsShared(!isShared)}>
              <div style={{ position: 'relative', width: '36px', height: '20px', flexShrink: 0, marginTop: '2px' }}>
                <div style={{ position: 'absolute', inset: 0, background: isShared?'#3D7A5A':'#D4C9B8', borderRadius: '10px' }} />
                <div style={{ position: 'absolute', width: '14px', height: '14px', background: '#fff', borderRadius: '50%', top: '3px', left: isShared?'19px':'3px', transition: '0.15s' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A18', marginBottom: '2px' }}>{isShared?'Sharing anonymously with neighbors':'Not sharing — private only'}</div>
                <div style={{ fontSize: '11px', color: '#8A8A82' }}>{isShared?'Your name is never shown. Only zip, contractor, price, and rating are shared.':'Toggle on to help your neighbors.'}</div>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '11px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, background: '#C47B2B', color: '#fff', border: 'none', padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving?0.6:1 }}>{saving?'Saving...':entry?.id?'Save changes':'Save entry'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Log Done Modal (from calendar) ──────────────────────────────────────────
function LogDoneModal({ task, homeId, userId, onSave, onSkip, onClose }: {
  task: { task: string; systemType: string; systemIcon: string; month: number }
  homeId: string; userId: string
  onSave: (entry: any) => void; onSkip: () => void; onClose: () => void
}) {
  const [company, setCompany] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (toLog: boolean) => {
    setSaving(true)
    if (toLog) {
      const { data } = await supabase.from('home_activity').insert({
        home_id: homeId, user_id: userId,
        entry_type: 'calendar', status: 'done', source: 'calendar',
        system_type: task.systemType,
        title: task.task,
        service_description: task.task,
        company_name: company || null,
        job_date: date,
        completed_at: new Date(date).toISOString(),
        final_price: cost ? parseFloat(cost) : null,
        notes: notes || null,
        log_type: 'maintenance',
      }).select().single()
      if (data) onSave(data)
    } else {
      onSkip()
    }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <span style={{ fontSize: '22px' }}>{task.systemIcon}</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F' }}>Mark as done</div>
            <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>{task.task} · Want to save this to your Home Log?</div>
          </div>
        </div>
        <div style={{ height: '0.5px', background: 'rgba(30,58,47,0.1)', margin: '16px 0' }} />
        <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
          <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Who did the work?</label><input value={company} onChange={e => setCompany(e.target.value)} style={{ ...iS }} placeholder="Company name or Self" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Date completed</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={iS} /></div>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Cost (optional)</label><input type="number" value={cost} onChange={e => setCost(e.target.value)} style={iS} placeholder="e.g. 250" /></div>
          </div>
          <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Notes (optional)</label><input value={notes} onChange={e => setNotes(e.target.value)} style={iS} placeholder="e.g. Replaced two downspout sections" /></div>
        </div>
        <div style={{ padding: '8px 12px', background: '#F8F4EE', borderRadius: '8px', fontSize: '11px', color: '#4A4A44', lineHeight: 1.6, marginBottom: '16px' }}>Saving to Home Log counts this toward your maintenance health score and home history.</div>
        <div style={{ display: 'grid', gap: '8px' }}>
          <button onClick={() => save(true)} disabled={saving} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving?0.6:1 }}>{saving?'Saving...':'Save to Home Log'}</button>
          <button onClick={() => save(false)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '11px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Mark done without logging</button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8A8A82', padding: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main HomeLog Component ───────────────────────────────────────────────────
export function HomeLog({ homeId, userId, userName, zip, systems, jobs: initialJobs, onActivityUpdate }: {
  homeId: string; userId: string; userName: string; zip?: string
  systems: any[]; jobs: any[]; onActivityUpdate: () => void
}) {
  const [view, setView] = useState<'todo'|'history'>('todo')
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showJobModal, setShowJobModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [logDoneTask, setLogDoneTask] = useState<any>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [newTaskUrgency, setNewTaskUrgency] = useState('medium')
  const [showNoDueDate, setShowNoDueDate] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('all')
  const [dismissedSmartIds, setDismissedSmartIds] = useState<string[]>([])
  const [loggedCalendarKeys, setLoggedCalendarKeys] = useState<Set<string>>(new Set())

  const curMonth = new Date().getMonth()
  const curYear = new Date().getFullYear()

  useEffect(() => {
    if (!homeId) return
    supabase.from('home_activity').select('*').eq('home_id', homeId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setEntries(data || []); setLoading(false) })
  }, [homeId])

  const refresh = async () => {
    const { data } = await supabase.from('home_activity').select('*').eq('home_id', homeId).order('created_at', { ascending: false })
    if (data) { setEntries(data); onActivityUpdate() }
  }

  // ── Calendar tasks generation (same logic as MaintenanceTab) ────────────────
  const TASK_SCHEDULE: Record<string, { month: number; task: string; urgency: 'high'|'medium'|'low'; icon: string }[]> = {
    roof:         [{month:4,task:'Inspect roof for winter damage',urgency:'high',icon:'🏠'},{month:10,task:'Clear debris from roof',urgency:'medium',icon:'🏠'}],
    hvac:         [{month:3,task:'HVAC filter change',urgency:'medium',icon:'🌡️'},{month:6,task:'HVAC filter change',urgency:'medium',icon:'🌡️'},{month:9,task:'HVAC filter change',urgency:'medium',icon:'🌡️'},{month:12,task:'HVAC filter change',urgency:'medium',icon:'🌡️'}],
    gutters:      [{month:3,task:'Inspect gutters',urgency:'medium',icon:'🌧️'},{month:10,task:'Clean gutters',urgency:'high',icon:'🌧️'},{month:11,task:'Final gutter clear',urgency:'medium',icon:'🌧️'}],
    windows:      [{month:4,task:'Inspect window seals',urgency:'low',icon:'🪟'},{month:10,task:'Check weatherstripping',urgency:'medium',icon:'🪟'}],
    deck:         [{month:4,task:'Inspect deck for winter damage',urgency:'medium',icon:'🪵'},{month:5,task:'Clean and seal deck',urgency:'low',icon:'🪵'}],
    siding:       [{month:4,task:'Inspect siding for damage',urgency:'medium',icon:'🏡'},{month:9,task:'Clean siding',urgency:'low',icon:'🏡'}],
    water_heater: [{month:1,task:'Flush water heater',urgency:'low',icon:'💧'},{month:7,task:'Check water heater anode rod',urgency:'low',icon:'💧'}],
    chimney:      [{month:9,task:'Schedule chimney sweep',urgency:'high',icon:'🔥'},{month:10,task:'Inspect chimney cap and flashing',urgency:'medium',icon:'🔥'}],
    sump_pump:    [{month:3,task:'Test sump pump',urgency:'high',icon:'⚙️'},{month:10,task:'Test sump pump before winter',urgency:'high',icon:'⚙️'}],
    driveway:     [{month:4,task:'Inspect driveway for cracks',urgency:'low',icon:'🛣️'},{month:10,task:'Seal driveway before winter',urgency:'medium',icon:'🛣️'}],
    fencing:      [{month:4,task:'Inspect fence for winter damage',urgency:'low',icon:'🪚'},{month:9,task:'Treat or paint fence',urgency:'low',icon:'🪚'}],
  }
  const SAFETY_TASKS = [
    {month:1,task:'Test smoke detectors',urgency:'medium' as const,icon:'🔥',systemType:'safety'},
    {month:4,task:'Test smoke detectors',urgency:'medium' as const,icon:'🔥',systemType:'safety'},
    {month:7,task:'Test smoke detectors',urgency:'medium' as const,icon:'🔥',systemType:'safety'},
    {month:10,task:'Test smoke detectors',urgency:'medium' as const,icon:'🔥',systemType:'safety'},
    {month:3,task:'Replace smoke detector batteries',urgency:'low' as const,icon:'🔋',systemType:'safety'},
    {month:9,task:'Replace smoke detector batteries',urgency:'low' as const,icon:'🔋',systemType:'safety'},
  ]

  const calendarTasks = (() => {
    const active = systems.filter(s => !s.not_applicable)
    const tasks: any[] = []
    active.forEach(sys => {
      const key = sys.system_type?.toLowerCase().replace(/ \/ /g,'_').replace(/ /g,'_')
      const schedule = TASK_SCHEDULE[key] || []
      schedule.forEach(t => {
        tasks.push({ ...t, systemType: key, calKey: `${key}-${t.month}-${t.task}` })
      })
    })
    SAFETY_TASKS.forEach(t => tasks.push({ ...t, calKey: `${t.systemType}-${t.month}-${t.task}` }))
    return tasks
  })()

  const isDoneByJob = (calKey: string, month: number) => {
    const sysType = calKey.split('-')[0]
    return entries.some(e =>
      e.entry_type === 'calendar' && e.system_type === sysType &&
      e.job_date && new Date(e.job_date).getMonth() === month - 1 &&
      new Date(e.job_date).getFullYear() === curYear
    ) || loggedCalendarKeys.has(calKey)
  }

  // ── Smart suggestions ────────────────────────────────────────────────────────
  const smartSuggestions = (() => {
    const sugg: any[] = []
    systems.forEach(sys => {
      if (sys.not_applicable) return
      const age = sys.install_year ? curYear - sys.install_year : null
      const key = sys.system_type
      if (key === 'roof' && age && age >= 15) sugg.push({ id: `smart-roof-age`, title: `Roof is ${age} years old — inspection recommended`, desc: 'Average lifespan 20–25 yrs · a good time to get eyes on it before issues develop', urgency: 'medium' })
      if (key === 'water_heater' && age && age >= 10) sugg.push({ id: `smart-wh-age`, title: `Water heater is ${age} years old — consider replacement`, desc: 'Average lifespan 10–12 yrs · proactive replacement avoids emergency costs', urgency: 'high' })
      if (key === 'hvac' && age && age >= 12) sugg.push({ id: `smart-hvac-age`, title: `HVAC is ${age} years old — service recommended`, desc: 'Average lifespan 15–20 yrs · annual service extends life and efficiency', urgency: 'medium' })
    })
    const hasInsurance = entries.some(e => e.title?.toLowerCase().includes('insurance'))
    if (!hasInsurance) sugg.push({ id: 'smart-insurance', title: 'No homeowners insurance document on file', desc: 'Upload your policy for quick access in an emergency', urgency: 'low' })
    return sugg.filter(s => !dismissedSmartIds.includes(s.id))
  })()

  // ── To Do buckets ────────────────────────────────────────────────────────────
  const openTasks = entries.filter(e => e.entry_type === 'task' && e.status !== 'done' && e.status !== 'dismissed')
  const overdueCal = calendarTasks.filter(t => t.month - 1 < curMonth && !isDoneByJob(t.calKey, t.month))
  const thisMonthCal = calendarTasks.filter(t => t.month - 1 === curMonth && !isDoneByJob(t.calKey, t.month))
  const upcomingCal = calendarTasks.filter(t => t.month - 1 === curMonth + 1 || t.month - 1 === curMonth + 2).filter(t => !isDoneByJob(t.calKey, t.month))

  const thisMonthTasks = openTasks.filter(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return d.getMonth() === curMonth && d.getFullYear() === curYear
  })
  const overdueTasks = openTasks.filter(t => {
    if (!t.due_date) return false
    return new Date(t.due_date) < new Date(new Date().toDateString())
  })
  const upcomingTasks = openTasks.filter(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    const future = new Date(); future.setDate(future.getDate() + 60)
    return d > new Date() && d <= future && d.getMonth() !== curMonth
  })
  const noDueDateTasks = openTasks.filter(t => !t.due_date)

  const allOverdue = [
    ...overdueTasks.map(t => ({ ...t, _type: 'task' })),
    ...overdueCal.map(t => ({ ...t, _type: 'cal' })),
  ].sort((a,b) => urgencyOrder[a.urgency||'low'] - urgencyOrder[b.urgency||'low'])

  const allThisMonth = [
    ...thisMonthTasks.map(t => ({ ...t, _type: 'task' })),
    ...thisMonthCal.map(t => ({ ...t, _type: 'cal' })),
  ].sort((a,b) => urgencyOrder[a.urgency||'low'] - urgencyOrder[b.urgency||'low'])

  const allUpcoming = [
    ...upcomingTasks.map(t => ({ ...t, _type: 'task' })),
    ...upcomingCal.map(t => ({ ...t, _type: 'cal' })),
  ].sort((a,b) => (a.month||0) - (b.month||0))

  // ── History entries ──────────────────────────────────────────────────────────
  const historyEntries = entries.filter(e =>
    e.status === 'done' || e.entry_type === 'job'
  )
  const filteredHistory = historyFilter === 'all' ? historyEntries
    : historyFilter === 'jobs' ? historyEntries.filter(e => e.entry_type === 'job' && e.log_type !== 'maintenance')
    : historyFilter === 'maintenance' ? historyEntries.filter(e => e.log_type === 'maintenance' || e.entry_type === 'calendar')
    : historyFilter === 'tasks' ? historyEntries.filter(e => e.entry_type === 'task')
    : historyEntries.filter(e => e.job_date && new Date(e.job_date).getFullYear() === parseInt(historyFilter) || e.completed_at && new Date(e.completed_at).getFullYear() === parseInt(historyFilter))

  const groupedHistory = filteredHistory.reduce((acc: any, e: any) => {
    const d = e.job_date || e.completed_at || e.created_at
    const key = d ? new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown date'
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  const histYears = [...new Set(historyEntries.map(e => {
    const d = e.job_date || e.completed_at || e.created_at
    return d ? String(new Date(d).getFullYear()) : null
  }).filter(Boolean))].sort((a,b) => parseInt(b!)-parseInt(a!))

  // ── Actions ──────────────────────────────────────────────────────────────────
  const addTask = async () => {
    if (!newTaskTitle.trim()) return
    const { data } = await supabase.from('home_activity').insert({
      home_id: homeId, user_id: userId,
      entry_type: 'task', status: 'todo', source: 'custom',
      title: newTaskTitle.trim(),
      due_date: newTaskDue || null,
      urgency: newTaskUrgency,
    }).select().single()
    if (data) setEntries(prev => [data, ...prev])
    setNewTaskTitle(''); setNewTaskDue(''); setNewTaskUrgency('medium'); setShowAddTask(false)
  }

  const markTaskDone = async (id: string) => {
    await supabase.from('home_activity').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id)
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'done', completed_at: new Date().toISOString() } : e))
    onActivityUpdate()
  }

  const deleteEntry = async (id: string) => {
    if (!window.confirm('Delete this entry?')) return
    await supabase.from('home_activity').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    onActivityUpdate()
  }

  const toggleShare = async (id: string, current: boolean) => {
    await supabase.from('home_activity').update({ is_shared: !current, shared_radius: !current ? 'zip' : null }).eq('id', id)
    setEntries(prev => prev.map(e => e.id === id ? { ...e, is_shared: !current } : e))
  }

  const totalSpend = entries.filter(e => e.entry_type === 'job' && e.job_date && new Date(e.job_date).getFullYear() === curYear).reduce((s,e) => s + (Number(e.final_price)||0), 0)
  const fmt = (n: number) => '$' + Math.round(n).toLocaleString()

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#8A8A82' }}>Loading...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '22px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'rgba(248,244,238,0.4)', marginBottom: '4px' }}>Home Log</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE', fontWeight: 400, marginBottom: '3px' }}>{entries.filter(e=>e.entry_type==='job').length} entries · {fmt(totalSpend)} this year</div>
            <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.5)' }}>{allOverdue.length > 0 ? `${allOverdue.length} overdue · ` : ''}{allThisMonth.length} due this month</div>
          </div>
          <button onClick={() => { setEditingEntry(null); setShowJobModal(true) }} style={{ background: '#C47B2B', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>+ Log a job</button>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setView('todo')} style={{ padding: '5px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: view==='todo'?'rgba(248,244,238,0.15)':'rgba(248,244,238,0.06)', color: view==='todo'?'#F8F4EE':'rgba(248,244,238,0.45)' }}>To Do {allOverdue.length+allThisMonth.length > 0 ? `(${allOverdue.length+allThisMonth.length})` : ''}</button>
          <button onClick={() => setView('history')} style={{ padding: '5px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: view==='history'?'rgba(248,244,238,0.15)':'rgba(248,244,238,0.06)', color: view==='history'?'#F8F4EE':'rgba(248,244,238,0.45)' }}>History ({historyEntries.length})</button>
        </div>
      </div>

      {/* ── TO DO VIEW ── */}
      {view === 'todo' && (
        <div>
          <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '16px', lineHeight: 1.6 }}>
            Everything due sorted by urgency — calendar tasks, your tasks, and smart reminders all in one list. <span style={{ fontSize: '11px' }}>📅 = from your maintenance calendar · ✏️ = your task</span>
          </div>

          {/* Overdue */}
          {allOverdue.length > 0 && (<>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#9B2C2C', marginBottom: '8px', paddingBottom: '6px', borderBottom: '0.5px solid rgba(163,45,45,0.2)' }}>Overdue</div>
            <div style={{ background: '#fff', border: '0.5px solid rgba(30,58,47,0.11)', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
              {allOverdue.map((item, i) => (
                <div key={item._type==='cal'?item.calKey:item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i<allOverdue.length-1?'0.5px solid rgba(30,58,47,0.06)':'none', background: '#FEF5F5' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #9B2C2C', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#791F1F' }}>{item._type==='cal'?item.task:item.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      {item._type==='cal' && <span style={{ fontSize: '11px', color: '#9B2C2C' }}>Was due {new Date(curYear, item.month-1).toLocaleDateString('en-US',{month:'long'})}</span>}
                      {item.due_date && <span style={{ fontSize: '11px', color: '#9B2C2C' }}>Due {new Date(item.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>}
                      <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 500, padding: '1px 7px', borderRadius: '20px', background: '#FDECEA', color: '#791F1F' }}>{item.urgency}</span>
                      <span style={{ fontSize: '12px', opacity: 0.5 }}>{item._type==='cal'?'📅':'✏️'}</span>
                    </div>
                  </div>
                  {item._type==='cal'
                    ? <button onClick={() => setLogDoneTask(item)} style={{ background: '#9B2C2C', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, flexShrink: 0 }}>Log done</button>
                    : <button onClick={() => markTaskDone(item.id)} style={{ background: '#9B2C2C', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, flexShrink: 0 }}>Mark done</button>
                  }
                </div>
              ))}
            </div>
          </>)}

          {/* This month */}
          {allThisMonth.length > 0 && (<>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#8A8A82', marginBottom: '8px', paddingBottom: '6px', borderBottom: '0.5px solid rgba(30,58,47,0.1)' }}>Due this month — {new Date(curYear, curMonth).toLocaleDateString('en-US',{month:'long'})}</div>
            <div style={{ background: '#fff', border: '0.5px solid rgba(30,58,47,0.11)', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
              {allThisMonth.map((item, i) => {
                const urgBg = item.urgency==='high'?'#FDECEA':item.urgency==='medium'?'#FBF0DC':'#EAF2EC'
                const urgC = item.urgency==='high'?'#791F1F':item.urgency==='medium'?'#633806':'#27500A'
                return (
                  <div key={item._type==='cal'?item.calKey:item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i<allThisMonth.length-1?'0.5px solid rgba(30,58,47,0.06)':'none' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid rgba(30,58,47,0.3)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{item._type==='cal'?item.task:item.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        {item.due_date && <span style={{ fontSize: '11px', color: '#C47B2B' }}>Due {new Date(item.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>}
                        {!item.due_date && item._type==='cal' && <span style={{ fontSize: '11px', color: '#8A8A82' }}>Due this month</span>}
                        <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 500, padding: '1px 7px', borderRadius: '20px', background: urgBg, color: urgC }}>{item.urgency}</span>
                        <span style={{ fontSize: '12px', opacity: 0.5 }}>{item._type==='cal'?'📅':'✏️'}</span>
                        {item.assigned_to && <span style={{ fontSize: '10px', color: '#3D7A5A', background: '#EAF2EC', padding: '1px 7px', borderRadius: '20px' }}>Assigned</span>}
                      </div>
                    </div>
                    {item._type==='cal'
                      ? <button onClick={() => setLogDoneTask(item)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '4px 10px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>Log done</button>
                      : <button onClick={() => markTaskDone(item.id)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '4px 10px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>Mark done</button>
                    }
                  </div>
                )
              })}
            </div>
          </>)}

          {/* Coming up */}
          {allUpcoming.length > 0 && (<>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#8A8A82', marginBottom: '8px', paddingBottom: '6px', borderBottom: '0.5px solid rgba(30,58,47,0.1)' }}>Coming up</div>
            <div style={{ background: '#fff', border: '0.5px solid rgba(30,58,47,0.11)', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
              {allUpcoming.map((item, i) => (
                <div key={item._type==='cal'?item.calKey:item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px', borderBottom: i<allUpcoming.length-1?'0.5px solid rgba(30,58,47,0.06)':'none' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid rgba(30,58,47,0.2)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F' }}>{item._type==='cal'?item.task:item.title}</div>
                    <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '1px' }}>
                      {item._type==='cal' ? new Date(curYear, item.month-1).toLocaleDateString('en-US',{month:'long'}) : item.due_date ? new Date(item.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : ''}
                      {' '}<span style={{ opacity: 0.5 }}>{item._type==='cal'?'📅':'✏️'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>)}

          {/* No due date tasks */}
          {noDueDateTasks.length > 0 && (
            <div style={{ background: '#fff', border: '0.5px solid rgba(30,58,47,0.11)', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
              <button onClick={() => setShowNoDueDate(!showNoDueDate)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                <span style={{ fontSize: '12px', color: '#8A8A82' }}>No due date · {noDueDateTasks.length} task{noDueDateTasks.length!==1?'s':''}</span>
                <span style={{ fontSize: '11px', color: '#8A8A82' }}>{showNoDueDate?'Hide ▲':'Show ▼'}</span>
              </button>
              {showNoDueDate && noDueDateTasks.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px', borderTop: '0.5px solid rgba(30,58,47,0.06)' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid rgba(30,58,47,0.2)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F' }}>{item.title}</div>
                  </div>
                  <button onClick={() => markTaskDone(item.id)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>Done</button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {allOverdue.length === 0 && allThisMonth.length === 0 && allUpcoming.length === 0 && noDueDateTasks.length === 0 && (
            <div style={{ background: '#fff', border: '0.5px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#1E3A2F', marginBottom: '6px' }}>All caught up</div>
              <div style={{ fontSize: '13px', color: '#8A8A82' }}>No tasks due right now. Add systems in Home Details to unlock your maintenance calendar.</div>
            </div>
          )}

          {/* Add task */}
          {!showAddTask ? (
            <button onClick={() => setShowAddTask(true)} style={{ background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: '16px' }}>+ Add a task</button>
          ) : (
            <div style={{ background: '#fff', border: '0.5px solid rgba(30,58,47,0.11)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gap: '10px' }}>
                <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} style={{ ...iS }} placeholder="Task title" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} style={iS} />
                  <select value={newTaskUrgency} onChange={e => setNewTaskUrgency(e.target.value)} style={iS}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={addTask} disabled={!newTaskTitle.trim()} style={{ flex: 1, background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '9px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: !newTaskTitle.trim()?0.5:1 }}>Add</button>
                    <button onClick={() => setShowAddTask(false)} style={{ flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '9px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Smart suggestions */}
          {smartSuggestions.length > 0 && (
            <div style={{ background: '#FAEEDA', border: '0.5px solid rgba(196,123,43,0.15)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#412402' }}>Smart suggestions · based on your home</div>
                <span style={{ fontSize: '11px', color: '#633806' }}>{smartSuggestions.length} new</span>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {smartSuggestions.map(s => (
                  <div key={s.id} style={{ padding: '11px 13px', background: 'rgba(255,255,255,0.65)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#412402', marginBottom: '2px' }}>{s.title}</div>
                      <div style={{ fontSize: '11px', color: '#633806', lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                      <button onClick={async () => {
                        const { data } = await supabase.from('home_activity').insert({ home_id: homeId, user_id: userId, entry_type: 'task', status: 'todo', source: 'smart', title: s.title, urgency: s.urgency }).select().single()
                        if (data) setEntries(prev => [data, ...prev])
                        setDismissedSmartIds(prev => [...prev, s.id])
                      }} style={{ background: '#C47B2B', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Add to list</button>
                      <button onClick={() => setDismissedSmartIds(prev => [...prev, s.id])} style={{ background: 'none', border: '1px solid rgba(196,123,43,0.25)', color: '#633806', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY VIEW ── */}
      {view === 'history' && (
        <div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {['all','jobs','maintenance','tasks'].map(f => (
              <button key={f} onClick={() => setHistoryFilter(f)} style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: historyFilter===f?'#1E3A2F':'#fff', color: historyFilter===f?'#F8F4EE':'#1E3A2F', outline: '1px solid rgba(30,58,47,0.15)' }}>
                {f === 'all' ? `All (${historyEntries.length})` : f === 'jobs' ? 'Jobs' : f === 'maintenance' ? 'Maintenance' : 'Tasks done'}
              </button>
            ))}
            {histYears.map(y => (
              <button key={y} onClick={() => setHistoryFilter(y!)} style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: historyFilter===y?'#1E3A2F':'#fff', color: historyFilter===y?'#F8F4EE':'#1E3A2F', outline: '1px solid rgba(30,58,47,0.15)' }}>{y}</button>
            ))}
          </div>

          {filteredHistory.length === 0 ? (
            <div style={{ background: '#fff', border: '0.5px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#1E3A2F', marginBottom: '6px' }}>No entries yet</div>
              <div style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px', lineHeight: 1.7 }}>Log jobs, repairs, and maintenance to build your home's permanent record.</div>
              <button onClick={() => { setEditingEntry(null); setShowJobModal(true) }} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Log your first entry</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {Object.entries(groupedHistory).map(([month, items]: [string, any]) => (
                <div key={month}>
                  <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#8A8A82', marginBottom: '8px', paddingBottom: '6px', borderBottom: '0.5px solid rgba(30,58,47,0.1)' }}>{month}</div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {items.map((e: any) => {
                      const lt = LOG_TYPES.find(t => t.key === e.log_type)
                      const tc = TYPE_COLORS[e.log_type] || TYPE_COLORS.maintenance
                      const isJob = e.entry_type === 'job' || e.entry_type === 'calendar'
                      return (
                        <div key={e.id} style={{ background: '#fff', border: '0.5px solid rgba(30,58,47,0.11)', borderRadius: '14px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isJob?(tc?.bg||'#EAF2EC'):'#F8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                              {isJob ? (lt?.emoji || '📋') : '✏️'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>{e.service_description || e.title}</div>
                                  <div style={{ fontSize: '11px', color: '#8A8A82' }}>
                                    {e.company_name && `${e.company_name} · `}
                                    {e.system_type && `${e.system_type.replace(/_/g,' ')} · `}
                                    {e.job_date && new Date(e.job_date).toLocaleDateString('en-US',{month:'long',year:'numeric'})}
                                    {!e.job_date && e.completed_at && new Date(e.completed_at).toLocaleDateString('en-US',{month:'long',year:'numeric'})}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  {e.final_price && <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>${Number(e.final_price).toLocaleString()}</div>}
                                  {e.material_cost && !e.final_price && <div style={{ fontSize: '13px', color: '#1E3A2F' }}>${Number(e.material_cost).toLocaleString()} materials</div>}
                                  {isJob && lt && <div style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: tc.bg, color: tc.color, marginTop: '2px', display: 'inline-block' }}>{lt.label}</div>}
                                  {!isJob && <div style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: '#F8F4EE', color: '#8A8A82', marginTop: '2px', display: 'inline-block' }}>Task</div>}
                                </div>
                              </div>
                              {e.quality_rating > 0 && <div style={{ color: '#C47B2B', fontSize: '12px', marginBottom: '4px' }}>{'★'.repeat(e.quality_rating)}{'☆'.repeat(5-e.quality_rating)}</div>}
                              {e.tags && e.tags.length > 0 && <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>{e.tags.map((t:string) => <span key={t} style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{t}</span>)}</div>}
                              {e.notes && <div style={{ fontSize: '11px', color: '#8A8A82', fontStyle: 'italic', marginBottom: '6px' }}>{e.notes}</div>}
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {isJob && e.performed_by !== 'diy' && e.log_type !== 'inspection' && (
                                  <button onClick={() => toggleShare(e.id, e.is_shared)} style={{ fontSize: '11px', fontWeight: 500, padding: '2px 10px', borderRadius: '20px', border: `1px solid ${e.is_shared?'rgba(30,58,47,0.2)':'rgba(30,58,47,0.1)'}`, background: e.is_shared?'#EAF2EC':'#F5F5F5', color: e.is_shared?'#3D7A5A':'#8A8A82', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                                    {e.is_shared?'✓ Shared with neighbors':'Share with neighbors'}
                                  </button>
                                )}
                                {isJob && <button onClick={() => { setEditingEntry(e); setShowJobModal(true) }} style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(30,58,47,0.2)', background: 'none', color: '#1E3A2F', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Edit</button>}
                                <button onClick={() => deleteEntry(e.id)} style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(155,44,44,0.2)', background: 'none', color: '#9B2C2C', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showJobModal && (
        <JobModal
          homeId={homeId} userId={userId} zip={zip}
          entry={editingEntry}
          onSave={data => { setEntries(prev => editingEntry ? prev.map(e=>e.id===editingEntry.id?data:e) : [data,...prev]); setShowJobModal(false); setEditingEntry(null); onActivityUpdate() }}
          onClose={() => { setShowJobModal(false); setEditingEntry(null) }}
        />
      )}
      {logDoneTask && (
        <LogDoneModal
          task={logDoneTask} homeId={homeId} userId={userId}
          onSave={data => { setEntries(prev => [data, ...prev]); setLoggedCalendarKeys(prev => { const n=new Set(prev); n.add(logDoneTask.calKey); return n }); setLogDoneTask(null); onActivityUpdate() }}
          onSkip={() => { setLoggedCalendarKeys(prev => { const n=new Set(prev); n.add(logDoneTask.calKey); return n }); setLogDoneTask(null) }}
          onClose={() => setLogDoneTask(null)}
        />
      )}
    </div>
  )
}
