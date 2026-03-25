'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Neighbors() {
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSystem, setFilterSystem] = useState('all')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)

      const { data } = await supabase
        .from('contractor_jobs')
        .select('*')
        .eq('is_shared', true)
        .order('created_at', { ascending: false })

      setJobs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = jobs.filter(job => {
    const matchesSearch = !search ||
      job.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      job.service_description?.toLowerCase().includes(search.toLowerCase())
    const matchesSystem = filterSystem === 'all' || job.system_type === filterSystem
    return matchesSearch && matchesSystem
  })

  const inputStyle = {
    padding: '10px 14px', border: '1px solid rgba(30,58,47,0.2)',
    borderRadius: '8px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', color: '#1A1A18'
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}><p style={{ color: '#8A8A82' }}>Loading...</p></div>

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: '#1E3A2F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: '58px', position: 'sticky', top: 0, zIndex: 200 }}>
        <a href="/dashboard" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '21px', color: '#F8F4EE', textDecoration: 'none' }}>
          Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
        </a>
        <a href="/dashboard" style={{ color: 'rgba(248,244,238,0.65)', fontSize: '13px', textDecoration: 'none' }}>Dashboard</a>
      </nav>

      {/* Header */}
      <div style={{ background: '#1E3A2F', padding: '28px 28px 32px' }}>
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '4px' }}>Community</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#F8F4EE', fontWeight: 400, marginBottom: '6px' }}>Neighbor Network</div>
        <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.55)', maxWidth: '480px' }}>
          Contractor reviews from verified homeowners in your area. Every review is tied to a real logged job.
        </p>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(30,58,47,0.11)', padding: '16px 28px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
          placeholder="Search by contractor or service..."
        />
        <select value={filterSystem} onChange={e => setFilterSystem(e.target.value)} style={{ ...inputStyle }}>
          <option value="all">All systems</option>
          {['roof', 'hvac', 'water_heater', 'windows', 'deck', 'electrical', 'plumbing', 'siding', 'landscaping'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      <div style={{ padding: '24px 28px 48px', maxWidth: '900px', margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>👥</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>
              {jobs.length === 0 ? 'No shared reviews yet' : 'No results found'}
            </h3>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px' }}>
              {jobs.length === 0
                ? 'Be the first to share a contractor review with your community.'
                : 'Try adjusting your search or filters.'}
            </p>
            {jobs.length === 0 && (
              <a href="/log" style={{
                display: 'inline-block', background: '#C47B2B', color: '#fff',
                textDecoration: 'none', padding: '10px 20px', borderRadius: '10px',
                fontSize: '13px', fontWeight: 500
              }}>Log a job and share it</a>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '4px' }}>{filtered.length} review{filtered.length !== 1 ? 's' : ''} found</p>
            {filtered.map(job => (
              <div key={job.id} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 500 }}>{job.company_name}</h4>
                      <span style={{
                        fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px',
                        background: job.would_refer === 'yes' ? '#EAF2EC' : job.would_refer === 'with_note' ? '#FBF0DC' : '#FDECEA',
                        color: job.would_refer === 'yes' ? '#3D7A5A' : job.would_refer === 'with_note' ? '#7A4A10' : '#9B2C2C'
                      }}>
                        {job.would_refer === 'yes' ? '✓ Would refer' : job.would_refer === 'with_note' ? '~ With reservations' : '✕ Would not refer'}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '8px' }}>
                      {job.service_description} · <span style={{ textTransform: 'capitalize' }}>{job.system_type?.replace('_', ' ')}</span>
                    </p>
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
                      {job.final_price ? `$${Number(job.final_price).toLocaleString()}` : 'Price not shared'}
                    </div>
                    <div style={{ color: '#C47B2B', fontSize: '14px' }}>
                      {'★'.repeat(job.quality_rating)}{'☆'.repeat(5 - job.quality_rating)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '4px' }}>
                      {job.job_date ? new Date(job.job_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA to share */}
        <div style={{ marginTop: '32px', background: '#1E3A2F', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#F8F4EE', fontWeight: 400, marginBottom: '8px' }}>
            Help your neighbors
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.6)', marginBottom: '16px' }}>
            Share a contractor job anonymously to contribute to the community.
          </p>
          <a href="/log" style={{
            display: 'inline-block', background: '#C47B2B', color: '#fff',
            textDecoration: 'none', padding: '10px 20px', borderRadius: '10px',
            fontSize: '13px', fontWeight: 500
          }}>Log and share a job</a>
        </div>
      </div>
    </main>
  )
}