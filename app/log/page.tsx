'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SYSTEMS = ['roof', 'hvac', 'water_heater', 'windows', 'deck', 'electrical', 'plumbing', 'siding', 'landscaping']
const TAGS = ['Quality work', 'Fair pricing', 'On time', 'Clean', 'Overpriced', 'Late', 'Upsell attempt', 'Would hire again']

export default function ContractorLog() {
  const [user, setUser] = useState<any>(null)
  const [home, setHome] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [company, setCompany] = useState('')
  const [system, setSystem] = useState('roof')
  const [description, setDescription] = useState('')
  const [jobDate, setJobDate] = useState('')
  const [quotedPrice, setQuotedPrice] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [rating, setRating] = useState(5)
  const [wouldRefer, setWouldRefer] = useState('yes')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)

      const { data: homes } = await supabase.from('homes').select('*').eq('user_id', user.id).limit(1)
      if (homes && homes.length > 0) {
        setHome(homes[0])
        const { data: jobData } = await supabase
          .from('contractor_jobs')
          .select('*')
          .eq('home_id', homes[0].id)
          .order('job_date', { ascending: false })
        setJobs(jobData || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const saveJob = async () => {
    if (!home) return
    setSaving(true)
    const { data, error } = await supabase.from('contractor_jobs').insert({
      home_id: home.id,
      user_id: user.id,
      company_name: company,
      system_type: system,
      service_description: description,
      job_date: jobDate || null,
      quoted_price: quotedPrice ? parseFloat(quotedPrice) : null,
      final_price: finalPrice ? parseFloat(finalPrice) : null,
      quality_rating: rating,
      would_refer: wouldRefer,
      tags: selectedTags,
      notes,
      is_shared: false
    }).select().single()

    if (!error && data) {
      setJobs(prev => [data, ...prev])
      setShowModal(false)
      setCompany(''); setDescription(''); setJobDate(''); setQuotedPrice('')
      setFinalPrice(''); setRating(5); setWouldRefer('yes'); setSelectedTags([]); setNotes('')
    }
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px',
    fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', boxSizing: 'border-box' as const,
    color: '#1A1A18'
  }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}><p style={{ color: '#8A8A82' }}>Loading...</p></div>

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: '#1E3A2F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: '58px', position: 'sticky', top: 0, zIndex: 200 }}>
        <a href="/dashboard" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '21px', color: '#F8F4EE', textDecoration: 'none' }}>
          Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
        </a>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a href="/dashboard" style={{ color: 'rgba(248,244,238,0.65)', fontSize: '13px', textDecoration: 'none' }}>Dashboard</a>
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
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '3px' }}>{job.company_name}</h4>
                    <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '8px' }}>{job.service_description} · {job.system_type}</p>
                    {job.tags && job.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {job.tags.map((tag: string) => (
                          <span key={tag} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 500, color: '#1E3A2F', marginBottom: '4px' }}>
                      {job.final_price ? `$${job.final_price.toLocaleString()}` : 'No price logged'}
                    </div>
                    {job.quoted_price && job.final_price && job.final_price > job.quoted_price && (
                      <div style={{ fontSize: '11px', color: '#8B3A2A' }}>Quoted: ${job.quoted_price.toLocaleString()}</div>
                    )}
                    <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '4px' }}>{job.job_date}</div>
                    <div style={{ marginTop: '6px' }}>
                      {'★'.repeat(job.quality_rating)}{'☆'.repeat(5 - job.quality_rating)}
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
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#8A8A82' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Company name</label>
                <input value={company} onChange={e => setCompany(e.target.value)} style={inputStyle} placeholder="e.g. Smith Roofing" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>System / Area</label>
                  <select value={system} onChange={e => setSystem(e.target.value)} style={inputStyle}>
                    {SYSTEMS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Job date</label>
                  <input type="date" value={jobDate} onChange={e => setJobDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description of work</label>
                <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="e.g. Full roof replacement, architectural shingles" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Quoted price</label>
                  <input value={quotedPrice} onChange={e => setQuotedPrice(e.target.value)} style={inputStyle} placeholder="0.00" type="number" />
                </div>
                <div>
                  <label style={labelStyle}>Final price</label>
                  <input value={finalPrice} onChange={e => setFinalPrice(e.target.value)} style={inputStyle} placeholder="0.00" type="number" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Quality rating</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRating(n)} style={{
                      flex: 1, padding: '8px', borderRadius: '8px',
                      border: `2px solid ${rating >= n ? '#C47B2B' : 'rgba(30,58,47,0.15)'}`,
                      background: rating >= n ? '#FBF0DC' : '#fff',
                      color: rating >= n ? '#C47B2B' : '#8A8A82',
                      cursor: 'pointer', fontSize: '16px'
                    }}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Would you refer them?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{v:'yes',l:'Yes'},{v:'with_note',l:'With reservations'},{v:'no',l:'No'}].map(opt => (
                    <button key={opt.v} onClick={() => setWouldRefer(opt.v)} style={{
                      flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '12px',
                      border: `2px solid ${wouldRefer === opt.v ? '#1E3A2F' : 'rgba(30,58,47,0.15)'}`,
                      background: wouldRefer === opt.v ? '#1E3A2F' : '#fff',
                      color: wouldRefer === opt.v ? '#F8F4EE' : '#1A1A18',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
                    }}>{opt.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Tags</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {TAGS.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)} style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                      border: `1px solid ${selectedTags.includes(tag) ? '#1E3A2F' : 'rgba(30,58,47,0.2)'}`,
                      background: selectedTags.includes(tag) ? '#1E3A2F' : '#fff',
                      color: selectedTags.includes(tag) ? '#F8F4EE' : '#1A1A18',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
                    }}>{tag}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Any additional details..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)',
                color: '#1E3A2F', padding: '12px', borderRadius: '10px',
                fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>Cancel</button>
              <button onClick={saveJob} disabled={saving} style={{
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