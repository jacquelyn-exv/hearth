'use client'

import Nav from '@/components/Nav'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SYSTEMS = [
  'Deck / Patio',
  'Doors',
  'Driveway',
  'Electrical',
  'Fencing',
  'Gutters',
  'HVAC',
  'Landscaping',
  'Plumbing',
  'Roof',
  'Siding',
  'Sump Pump',
  'Water Heater',
  'Windows',
  'Other',
]

const PRESET_TAGS = ['Quality work', 'Fair pricing', 'On time', 'Clean', 'Overpriced', 'Late', 'Upsell attempt', 'Would hire again']

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const YEARS = Array.from({ length: 20 }, (_, i) => (new Date().getFullYear() - i).toString())

export default function ContractorLog() {
  const [user, setUser] = useState<any>(null)
  const [home, setHome] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [company, setCompany] = useState('')
  const [system, setSystem] = useState('')
  const [systemOther, setSystemOther] = useState('')
  const [description, setDescription] = useState('')
  const [jobMonth, setJobMonth] = useState('')
  const [jobYear, setJobYear] = useState(new Date().getFullYear().toString())
  const [quotedPrice, setQuotedPrice] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [rating, setRating] = useState(0)
  const [wouldRefer, setWouldRefer] = useState('yes')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTagInput, setCustomTagInput] = useState('')
  const [notes, setNotes] = useState('')
  const [isShared, setIsShared] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const { data: homes } = await supabase.from('homes').select('*').eq('user_id', user.id).limit(1)
      if (homes && homes.length > 0) {
        setHome(homes[0])
        const { data: jobData } = await supabase
          .from('contractor_jobs').select('*')
          .eq('home_id', homes[0].id)
          .order('created_at', { ascending: false })
        setJobs(jobData || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const addCustomTag = () => {
    const tag = customTagInput.trim()
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag])
    }
    setCustomTagInput('')
  }

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

  const resetForm = () => {
    setCompany(''); setSystem(''); setSystemOther(''); setDescription('')
    setJobMonth(''); setJobYear(new Date().getFullYear().toString())
    setQuotedPrice(''); setFinalPrice(''); setRating(0)
    setWouldRefer('yes'); setSelectedTags([]); setCustomTagInput('')
    setNotes(''); setIsShared(true)
  }

  const saveJob = async () => {
    if (!home || !company) return
    setSaving(true)
    const systemValue = system === 'Other'
      ? systemOther.toLowerCase().replace(/ /g, '_')
      : system.toLowerCase().replace(/ \/ /g, '_').replace(/ /g, '_')
    const jobDate = jobMonth && jobYear
      ? `${jobYear}-${(MONTHS.indexOf(jobMonth) + 1).toString().padStart(2, '0')}-01`
      : null

    const { data, error } = await supabase.from('contractor_jobs').insert({
      home_id: home.id,
      user_id: user.id,
      company_name: company,
      system_type: systemValue,
      service_description: description,
      job_date: jobDate,
      quoted_price: quotedPrice ? parseFloat(quotedPrice) : null,
      final_price: finalPrice ? parseFloat(finalPrice) : null,
      quality_rating: rating || 3,
      would_refer: wouldRefer,
      tags: selectedTags,
      notes,
      is_shared: isShared,
      shared_radius: isShared ? 'zip' : null
    }).select().single()

    if (!error && data) {
      setJobs(prev => [data, ...prev])
      setShowModal(false)
      resetForm()
    }
    setSaving(false)
  }

  const toggleShare = async (jobId: string, currentShared: boolean) => {
    const { error } = await supabase.from('contractor_jobs')
      .update({ is_shared: !currentShared, shared_radius: !currentShared ? 'zip' : null })
      .eq('id', jobId)
    if (!error) setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_shared: !currentShared } : j))
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px',
    fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', color: '#1A1A18',
    boxSizing: 'border-box' as const
  }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#8A8A82' }}>Loading...</p>
    </div>
  )

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: '#1E3A2F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: '58px', position: 'sticky', top: 0, zIndex: 200 }}>
        <a href="/dashboard" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '21px', color: '#F8F4EE', textDecoration: 'none' }}>
          Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
        </a>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a href="/neighbors" style={{ color: 'rgba(248,244,238,0.65)', fontSize: '13px', textDecoration: 'none', padding: '6px 11px' }}>Neighbors</a>
          <a href="/dashboard" style={{ color: 'rgba(248,244,238,0.65)', fontSize: '13px', textDecoration: 'none', padding: '6px 11px' }}>Dashboard</a>
        </div>
      </nav>

      {/* Header */}
      <div style={{ background: '#1E3A2F', padding: '28px 28px 32px' }}>
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '4px' }}>My Records</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#F8F4EE', fontWeight: 400, marginBottom: '16px' }}>Contractor Log</div>
        <button onClick={() => setShowModal(true)} style={{
          background: '#C47B2B', color: '#fff', border: 'none',
          padding: '10px 20px', borderRadius: '10px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
          fontWeight: 500, cursor: 'pointer'
        }}>+ Log a job</button>
      </div>

      {/* Job list */}
      <div style={{ padding: '24px 28px 48px', maxWidth: '900px', margin: '0 auto' }}>
        {jobs.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>No jobs logged yet</h3>
            <p style={{ fontSize: '13px', color: '#8A8A82' }}>Start recording contractor work to track pricing and build your home history.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {jobs.map(job => (
              <div key={job.id} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '3px' }}>{job.company_name}</h4>
                    <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '8px' }}>
                      {job.service_description} · {job.system_type?.replace(/_/g, ' ')}
                      {job.job_date ? ` · ${new Date(job.job_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''}
                    </p>
                    {job.tags && job.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {job.tags.map((tag: string) => (
                          <span key={tag} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => toggleShare(job.id, job.is_shared)}
                      style={{
                        background: job.is_shared ? '#EAF2EC' : '#F5F5F5',
                        border: `1px solid ${job.is_shared ? 'rgba(30,58,47,0.2)' : 'rgba(30,58,47,0.1)'}`,
                        color: job.is_shared ? '#3D7A5A' : '#8A8A82',
                        fontSize: '11px', fontWeight: 500, padding: '4px 10px',
                        borderRadius: '20px', cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif"
                      }}
                    >
                      {job.is_shared ? '✓ Shared with community' : 'Share with neighbors'}
                    </button>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 500, color: '#1E3A2F', marginBottom: '4px' }}>
                      {job.final_price ? `$${Number(job.final_price).toLocaleString()}` : 'No price logged'}
                    </div>
                    {job.quoted_price && job.final_price && Number(job.final_price) > Number(job.quoted_price) && (
                      <div style={{ fontSize: '11px', color: '#8B3A2A' }}>Quoted: ${Number(job.quoted_price).toLocaleString()}</div>
                    )}
                    <div style={{ marginTop: '6px', color: '#C47B2B', fontSize: '14px' }}>
                      {'★'.repeat(job.quality_rating)}{'☆'.repeat(5 - job.quality_rating)}
                    </div>
                    <div style={{ fontSize: '11px', color: job.would_refer === 'yes' ? '#3D7A5A' : job.would_refer === 'no' ? '#9B2C2C' : '#7A4A10', marginTop: '4px' }}>
                      {job.would_refer === 'yes' ? '✓ Would refer' : job.would_refer === 'no' ? '✕ Would not refer' : '~ With reservations'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F' }}>Log a job</h3>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#8A8A82' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>

              {/* Company */}
              <div>
                <label style={labelStyle}>Company name</label>
                <input value={company} onChange={e => setCompany(e.target.value)} style={inputStyle} placeholder="e.g. Smith Roofing" />
              </div>

              {/* System */}
              <div>
                <label style={labelStyle}>System / Area</label>
                <select value={system} onChange={e => setSystem(e.target.value)} style={inputStyle}>
                  <option value="">Select a system...</option>
                  {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {system === 'Other' && (
                <div>
                  <label style={labelStyle}>Describe the system or area</label>
                  <input value={systemOther} onChange={e => setSystemOther(e.target.value)} style={inputStyle} placeholder="e.g. Sunroom, basement waterproofing..." />
                </div>
              )}

              {/* Description */}
              <div>
                <label style={labelStyle}>Description of work</label>
                <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="e.g. Full roof replacement, architectural shingles" />
              </div>

              {/* Date */}
              <div>
                <label style={labelStyle}>Job date</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select value={jobMonth} onChange={e => setJobMonth(e.target.value)} style={inputStyle}>
                    <option value="">Month</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={jobYear} onChange={e => setJobYear(e.target.value)} style={inputStyle}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Prices */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Quoted price</label>
                  <input value={quotedPrice} onChange={e => setQuotedPrice(e.target.value)} style={inputStyle} placeholder="$0.00" type="number" />
                </div>
                <div>
                  <label style={labelStyle}>Final price</label>
                  <input value={finalPrice} onChange={e => setFinalPrice(e.target.value)} style={inputStyle} placeholder="$0.00" type="number" />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label style={labelStyle}>Quality rating</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: '8px', fontSize: '20px',
                        border: `2px solid ${rating >= n ? '#C47B2B' : 'rgba(30,58,47,0.15)'}`,
                        background: rating >= n ? '#FBF0DC' : '#fff',
                        cursor: 'pointer', lineHeight: 1
                      }}
                    >★</button>
                  ))}
                </div>
                {rating > 0 && (
                  <p style={{ fontSize: '12px', color: '#8A8A82', marginTop: '6px' }}>
                    {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very good' : 'Excellent'}
                  </p>
                )}
              </div>

              {/* Would refer */}
              <div>
                <label style={labelStyle}>Would you refer them?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ v: 'yes', l: 'Yes' }, { v: 'with_note', l: 'With reservations' }, { v: 'no', l: 'No' }].map(opt => (
                    <button key={opt.v} type="button" onClick={() => setWouldRefer(opt.v)} style={{
                      flex: 1, padding: '9px 4px', borderRadius: '8px', fontSize: '13px',
                      border: `2px solid ${wouldRefer === opt.v ? '#1E3A2F' : 'rgba(30,58,47,0.15)'}`,
                      background: wouldRefer === opt.v ? '#1E3A2F' : '#fff',
                      color: wouldRefer === opt.v ? '#F8F4EE' : '#1A1A18',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
                    }}>{opt.l}</button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={labelStyle}>Tags</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {PRESET_TAGS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                      border: `1px solid ${selectedTags.includes(tag) ? '#1E3A2F' : 'rgba(30,58,47,0.2)'}`,
                      background: selectedTags.includes(tag) ? '#1E3A2F' : '#fff',
                      color: selectedTags.includes(tag) ? '#F8F4EE' : '#1A1A18',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
                    }}>{tag}</button>
                  ))}
                </div>

                {selectedTags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {selectedTags.filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                      <span key={tag} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                        background: '#1E3A2F', color: '#F8F4EE'
                      }}>
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'rgba(248,244,238,0.7)', cursor: 'pointer', padding: '0', fontSize: '14px', lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={customTagInput}
                    onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Add your own tag..."
                  />
                  <button type="button" onClick={addCustomTag} style={{
                    background: '#1E3A2F', color: '#F8F4EE', border: 'none',
                    padding: '10px 16px', borderRadius: '8px', fontSize: '13px',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0
                  }}>Add</button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Any additional details..." />
              </div>

              {/* Share toggle */}
              <div
                style={{ background: '#F8F4EE', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}
                onClick={() => setIsShared(!isShared)}
              >
                <div style={{ position: 'relative', width: '36px', height: '20px', flexShrink: 0, marginTop: '2px' }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: isShared ? '#3D7A5A' : '#D4C9B8',
                    borderRadius: '10px', transition: '0.2s'
                  }} />
                  <div style={{
                    position: 'absolute', width: '14px', height: '14px',
                    background: '#fff', borderRadius: '50%', top: '3px',
                    left: isShared ? '19px' : '3px', transition: '0.2s'
                  }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A18', marginBottom: '2px' }}>
                    {isShared ? 'Sharing anonymously with neighbors' : 'Not sharing — private only'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8A8A82' }}>
                    {isShared ? 'Your name is never shown. Only zip code, contractor, price, and rating are shared.' : 'Toggle on to help your neighbors with this job data.'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button type="button" onClick={() => { setShowModal(false); resetForm() }} style={{
                flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)',
                color: '#1E3A2F', padding: '12px', borderRadius: '10px',
                fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>Cancel</button>
              <button type="button" onClick={saveJob} disabled={saving} style={{
                flex: 2, background: '#C47B2B', color: '#fff',
                border: 'none', padding: '12px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>{saving ? 'Saving...' : 'Save job'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}