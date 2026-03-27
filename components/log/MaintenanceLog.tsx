'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const SYSTEMS = [
  'Roof','Siding','Gutters & Trim','Windows','Entry Door','Sliding Door',
  'HVAC','Water Heater','Deck / Patio','Driveway','Fencing','Chimney',
  'Sump Pump','Landscaping','Plumbing','Electrical','Refrigerator','Dishwasher','Other',
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
  repair: { bg: '#FBF0DC', color: '#7A4A10', border: 'rgba(196,123,43,0.2)' },
  maintenance: { bg: '#E6F2F8', color: '#3A7CA8', border: 'rgba(58,124,168,0.2)' },
  inspection: { bg: '#F5EAE7', color: '#8B3A2A', border: 'rgba(139,58,42,0.2)' },
}

function EntryCard({ job, onEdit, onDelete, onToggleShare }: { job: any; onEdit: () => void; onDelete: () => void; onToggleShare: () => void }) {
  const tc = TYPE_COLORS[job.log_type] || TYPE_COLORS.upgrade_replacement
  const lt = LOG_TYPES.find(t => t.key === job.log_type)
  const isDIY = job.performed_by === 'diy'

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '18px 20px' }}>
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          <span style={{ fontSize: '20px' }}>{lt?.emoji || '📋'}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>
                  {job.company_name || (isDIY ? 'DIY' : 'Unknown')}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                  {lt?.label}
                </span>
                {isDIY && <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: '#F0EEF8', color: '#5A4A8A' }}>DIY</span>}
              </div>
              <div style={{ fontSize: '13px', color: '#8A8A82' }}>
                {job.service_description}
                {job.system_type && ` · ${job.system_type.replace(/_/g, ' ')}`}
                {job.job_date && ` · ${new Date(job.job_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {job.final_price && <div style={{ fontSize: '16px', fontWeight: 600, color: '#1E3A2F' }}>${Number(job.final_price).toLocaleString()}</div>}
              {job.material_cost && !job.final_price && <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>${Number(job.material_cost).toLocaleString()} materials</div>}
              {job.hours_spent && <div style={{ fontSize: '11px', color: '#8A8A82' }}>{job.hours_spent}h labor</div>}
              {job.quality_rating > 0 && <div style={{ color: '#C47B2B', fontSize: '13px', marginTop: '2px' }}>{'★'.repeat(job.quality_rating)}{'☆'.repeat(5 - job.quality_rating)}</div>}
            </div>
          </div>
          {job.tags && job.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {job.tags.map((t: string) => <span key={t} style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{t}</span>)}
            </div>
          )}
          {job.notes && <div style={{ fontSize: '12px', color: '#8A8A82', fontStyle: 'italic', marginBottom: '8px' }}>{job.notes}</div>}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {!isDIY && job.log_type !== 'inspection' && (
              <button onClick={onToggleShare} style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${job.is_shared ? 'rgba(30,58,47,0.2)' : 'rgba(30,58,47,0.1)'}`, background: job.is_shared ? '#EAF2EC' : '#F5F5F5', color: job.is_shared ? '#3D7A5A' : '#8A8A82', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                {job.is_shared ? '✓ Shared with neighbors' : 'Share with neighbors'}
              </button>
            )}
            <button onClick={onEdit} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(30,58,47,0.2)', background: 'none', color: '#1E3A2F', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
            <button onClick={onDelete} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(155,44,44,0.2)', background: 'none', color: '#9B2C2C', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MaintenanceLog({ homeId, userId, userName }: { homeId: string; userId: string; userName: string }) {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('all')

  // Form state
  const [logType, setLogType] = useState('upgrade_replacement')
  const [performedBy, setPerformedBy] = useState('contractor')
  const [company, setCompany] = useState('')
  const [system, setSystem] = useState('')
  const [description, setDescription] = useState('')
  const [jobMonth, setJobMonth] = useState('')
  const [jobYear, setJobYear] = useState(new Date().getFullYear().toString())
  const [quotedPrice, setQuotedPrice] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [materialCost, setMaterialCost] = useState('')
  const [hoursSpent, setHoursSpent] = useState('')
  const [rating, setRating] = useState(0)
  const [wouldRefer, setWouldRefer] = useState('yes')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [isShared, setIsShared] = useState(true)

  useEffect(() => {
    if (!homeId) return
    supabase.from('contractor_jobs').select('*').eq('home_id', homeId).order('job_date', { ascending: false }).then(({ data }) => {
      setJobs(data || [])
      setLoading(false)
    })
  }, [homeId])

  const resetForm = () => {
    setLogType('upgrade_replacement'); setPerformedBy('contractor'); setCompany(''); setSystem('')
    setDescription(''); setJobMonth(''); setJobYear(new Date().getFullYear().toString())
    setQuotedPrice(''); setFinalPrice(''); setMaterialCost(''); setHoursSpent('')
    setRating(0); setWouldRefer('yes'); setSelectedTags([]); setNotes(''); setIsShared(true)
    setEditingId(null)
  }

  const openEdit = (job: any) => {
    setLogType(job.log_type || 'upgrade_replacement')
    setPerformedBy(job.performed_by || 'contractor')
    setCompany(job.company_name || '')
    setSystem(SYSTEMS.find(s => s.toLowerCase().replace(/ \/ /g,'_').replace(/ /g,'_') === job.system_type || s.toLowerCase().replace(/ /g,'_') === job.system_type) || '')
    setDescription(job.service_description || '')
    if (job.job_date) { const d = new Date(job.job_date); setJobMonth(MONTHS[d.getMonth()]); setJobYear(d.getFullYear().toString()) }
    setQuotedPrice(job.quoted_price ? String(job.quoted_price) : '')
    setFinalPrice(job.final_price ? String(job.final_price) : '')
    setMaterialCost(job.material_cost ? String(job.material_cost) : '')
    setHoursSpent(job.hours_spent ? String(job.hours_spent) : '')
    setRating(job.quality_rating || 0)
    setWouldRefer(job.would_refer || 'yes')
    setSelectedTags(job.tags || [])
    setNotes(job.notes || '')
    setIsShared(job.is_shared ?? true)
    setEditingId(job.id)
    setShowModal(true)
  }

  const save = async () => {
    setSaving(true)
    const sysValue = system.toLowerCase().replace(/ \/ /g,'_').replace(/ /g,'_')
    const jobDate = jobMonth && jobYear ? `${jobYear}-${(MONTHS.indexOf(jobMonth)+1).toString().padStart(2,'0')}-01` : null
    const isDIY = performedBy === 'diy'
    const payload: any = {
      log_type: logType,
      performed_by: performedBy,
      company_name: isDIY ? null : (company || null),
      system_type: sysValue || null,
      service_description: description || null,
      job_date: jobDate,
      quoted_price: quotedPrice ? parseFloat(quotedPrice) : null,
      final_price: finalPrice ? parseFloat(finalPrice) : null,
      material_cost: materialCost ? parseFloat(materialCost) : null,
      hours_spent: hoursSpent ? parseFloat(hoursSpent) : null,
      quality_rating: isDIY ? null : (rating || null),
      would_refer: isDIY ? null : wouldRefer,
      tags: selectedTags,
      notes: notes || null,
      is_shared: isDIY ? false : isShared,
      shared_radius: (!isDIY && isShared) ? 'zip' : null,
    }

    if (editingId) {
      const { data } = await supabase.from('contractor_jobs').update(payload).eq('id', editingId).select().single()
      if (data) setJobs(prev => prev.map(j => j.id === editingId ? data : j))
    } else {
      const { data } = await supabase.from('contractor_jobs').insert({ home_id: homeId, user_id: userId, ...payload }).select().single()
      if (data) setJobs(prev => [data, ...prev])
    }

    await fetch('/api/recalculate-score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ home_id: homeId }) })
    setSaving(false); setShowModal(false); resetForm()
  }

  const deleteJob = async (id: string) => {
    if (!window.confirm('Delete this entry?')) return
    await supabase.from('contractor_jobs').delete().eq('id', id)
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  const toggleShare = async (id: string, current: boolean) => {
    await supabase.from('contractor_jobs').update({ is_shared: !current, shared_radius: !current ? 'zip' : null }).eq('id', id)
    setJobs(prev => prev.map(j => j.id === id ? { ...j, is_shared: !current } : j))
  }

  const filtered = filterType === 'all' ? jobs : jobs.filter(j => j.log_type === filterType)
  const isDIY = performedBy === 'diy'
  const iS: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff', color: '#1A1A18', boxSizing: 'border-box' }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#8A8A82', fontSize: '13px' }}>Loading...</div>

  return (
    <div>
      <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '22px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#F8F4EE', marginBottom: '4px' }}>Home Maintenance Log</h2>
          <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.55)' }}>{jobs.length} {jobs.length === 1 ? 'entry' : 'entries'} · Complete history of work done on this home</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} style={{ background: '#C47B2B', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>+ Log entry</button>
      </div>

      {jobs.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button onClick={() => setFilterType('all')} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: filterType === 'all' ? '#1E3A2F' : '#fff', color: filterType === 'all' ? '#F8F4EE' : '#1E3A2F', outline: '1px solid rgba(30,58,47,0.15)' }}>All ({jobs.length})</button>
          {LOG_TYPES.filter(t => jobs.some(j => j.log_type === t.key)).map(t => (
            <button key={t.key} onClick={() => setFilterType(t.key)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: filterType === t.key ? '#1E3A2F' : '#fff', color: filterType === t.key ? '#F8F4EE' : '#1E3A2F', outline: '1px solid rgba(30,58,47,0.15)' }}>{t.emoji} {t.label} ({jobs.filter(j => j.log_type === t.key).length})</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>No entries yet</h3>
          <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px', lineHeight: 1.7 }}>Log everything done to this home — repairs, maintenance, upgrades, and inspections. It builds your home's permanent record.</p>
          <button onClick={() => { resetForm(); setShowModal(true) }} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '11px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Log your first entry</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filtered.map(job => (
            <EntryCard key={job.id} job={job} onEdit={() => openEdit(job)} onDelete={() => deleteJob(job.id)} onToggleShare={() => toggleShare(job.id, job.is_shared)} />
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F' }}>{editingId ? 'Edit entry' : 'Log an entry'}</h3>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#8A8A82' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>

              {/* Entry type */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '8px' }}>Type of entry</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {LOG_TYPES.map(t => (
                    <button key={t.key} onClick={() => setLogType(t.key)} style={{ padding: '10px 12px', borderRadius: '10px', border: `2px solid ${logType === t.key ? '#1E3A2F' : 'rgba(30,58,47,0.15)'}`, background: logType === t.key ? '#1E3A2F' : '#fff', color: logType === t.key ? '#F8F4EE' : '#1E3A2F', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>
                      <div style={{ fontSize: '16px', marginBottom: '2px' }}>{t.emoji}</div>
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>{t.label}</div>
                      <div style={{ fontSize: '10px', opacity: 0.7, lineHeight: 1.3 }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DIY or contractor — not for inspection */}
              {logType !== 'inspection' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '8px' }}>Who did the work?</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ v: 'contractor', l: '🏢 Hired a contractor' }, { v: 'diy', l: '🙋 I did it myself (DIY)' }].map(opt => (
                      <button key={opt.v} onClick={() => setPerformedBy(opt.v)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${performedBy === opt.v ? '#1E3A2F' : 'rgba(30,58,47,0.15)'}`, background: performedBy === opt.v ? '#1E3A2F' : '#fff', color: performedBy === opt.v ? '#F8F4EE' : '#1E3A2F', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{opt.l}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* System */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>System / Area</label>
                <select value={system} onChange={e => setSystem(e.target.value)} style={iS}>
                  <option value="">Select a system...</option>
                  {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Description of work</label>
                <input value={description} onChange={e => setDescription(e.target.value)} style={iS} placeholder={logType === 'maintenance' ? 'e.g. Cleaned gutters, replaced HVAC filter' : logType === 'inspection' ? 'e.g. Annual HVAC tune-up, chimney sweep' : 'e.g. Full roof replacement, architectural shingles'} />
              </div>

              {/* Contractor fields */}
              {!isDIY && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Company name</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} style={iS} placeholder="e.g. Smith Roofing" />
                </div>
              )}

              {/* Date */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Date completed</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select value={jobMonth} onChange={e => setJobMonth(e.target.value)} style={iS}>
                    <option value="">Month</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={jobYear} onChange={e => setJobYear(e.target.value)} style={iS}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Contractor pricing */}
              {!isDIY && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Quoted price</label>
                    <input value={quotedPrice} onChange={e => setQuotedPrice(e.target.value)} style={iS} placeholder="$0" type="number" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Final price paid</label>
                    <input value={finalPrice} onChange={e => setFinalPrice(e.target.value)} style={iS} placeholder="$0" type="number" />
                  </div>
                </div>
              )}

              {/* DIY cost + hours */}
              {isDIY && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Cost of materials</label>
                    <input value={materialCost} onChange={e => setMaterialCost(e.target.value)} style={iS} placeholder="$0" type="number" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Hours to complete</label>
                    <input value={hoursSpent} onChange={e => setHoursSpent(e.target.value)} style={iS} placeholder="e.g. 4" type="number" />
                  </div>
                </div>
              )}

              {/* Contractor rating + refer */}
              {!isDIY && logType !== 'inspection' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '8px' }}>Quality rating</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setRating(n)} style={{ flex: 1, padding: '10px 0', borderRadius: '8px', fontSize: '20px', border: `2px solid ${rating >= n ? '#C47B2B' : 'rgba(30,58,47,0.15)'}`, background: rating >= n ? '#FBF0DC' : '#fff', cursor: 'pointer' }}>★</button>
                      ))}
                    </div>
                    {rating > 0 && <p style={{ fontSize: '11px', color: '#8A8A82', marginTop: '4px' }}>{['','Poor','Fair','Good','Very good','Excellent'][rating]}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '8px' }}>Would you refer them?</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[{ v: 'yes', l: 'Yes' }, { v: 'with_note', l: 'With reservations' }, { v: 'no', l: 'No' }].map(opt => (
                        <button key={opt.v} onClick={() => setWouldRefer(opt.v)} style={{ flex: 1, padding: '9px 4px', borderRadius: '8px', fontSize: '12px', border: `2px solid ${wouldRefer === opt.v ? '#1E3A2F' : 'rgba(30,58,47,0.15)'}`, background: wouldRefer === opt.v ? '#1E3A2F' : '#fff', color: wouldRefer === opt.v ? '#F8F4EE' : '#1A1A18', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{opt.l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '8px' }}>Tags</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {PRESET_TAGS.map(tag => (
                        <button key={tag} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', border: `1px solid ${selectedTags.includes(tag) ? '#1E3A2F' : 'rgba(30,58,47,0.2)'}`, background: selectedTags.includes(tag) ? '#1E3A2F' : '#fff', color: selectedTags.includes(tag) ? '#F8F4EE' : '#1A1A18', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{tag}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...iS, minHeight: '72px', resize: 'vertical' }} placeholder="Anything else worth remembering..." />
              </div>

              {/* Share toggle — contractor only */}
              {!isDIY && logType !== 'inspection' && (
                <div style={{ background: '#F8F4EE', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }} onClick={() => setIsShared(!isShared)}>
                  <div style={{ position: 'relative', width: '36px', height: '20px', flexShrink: 0, marginTop: '2px' }}>
                    <div style={{ position: 'absolute', inset: 0, background: isShared ? '#3D7A5A' : '#D4C9B8', borderRadius: '10px' }} />
                    <div style={{ position: 'absolute', width: '14px', height: '14px', background: '#fff', borderRadius: '50%', top: '3px', left: isShared ? '19px' : '3px', transition: '0.15s' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A18', marginBottom: '2px' }}>{isShared ? 'Sharing anonymously with neighbors' : 'Not sharing — private only'}</div>
                    <div style={{ fontSize: '11px', color: '#8A8A82' }}>{isShared ? 'Your name is never shown. Only zip code, contractor, price, and rating are shared.' : 'Toggle on to help your neighbors.'}</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '11px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ flex: 2, background: '#C47B2B', color: '#fff', border: 'none', padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Save entry'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
