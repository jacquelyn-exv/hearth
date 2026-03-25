'use client'

import Nav from '@/components/Nav'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SYSTEMS = [
  'All systems',
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

function avg(arr: number[]) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0
}

function groupByContractor(jobs: any[]) {
  const map: Record<string, any[]> = {}
  jobs.forEach(j => {
    const key = j.company_name?.toLowerCase().trim()
    if (!key) return
    if (!map[key]) map[key] = []
    map[key].push(j)
  })
  return map
}

export default function Neighbors() {
  const [user, setUser] = useState<any>(null)
  const [userZip, setUserZip] = useState('')
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [zipSearch, setZipSearch] = useState('')
  const [filterSystem, setFilterSystem] = useState('All systems')
  const [expandedContractor, setExpandedContractor] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: homes } = await supabase.from('homes').select('zip').eq('user_id', user.id).limit(1)
        if (homes && homes.length > 0) {
          setUserZip(homes[0].zip || '')
          setZipSearch(homes[0].zip || '')
        }
      }

      const { data } = await supabase
        .from('public_contractor_jobs')
        .select('*')
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
    const matchesSystem = filterSystem === 'All systems' ||
      job.system_type?.toLowerCase().replace(/_/g, ' ') === filterSystem.toLowerCase().replace(/ \/ /g, '_').replace(/ /g, '_') ||
      job.system_type?.replace(/_/g, ' ').toLowerCase() === filterSystem.toLowerCase()
    const matchesZip = !zipSearch || job.zip === zipSearch || !job.zip
    return matchesSearch && matchesSystem && matchesZip
  })

  const grouped = groupByContractor(filtered)
  const contractors = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)

  // Trend data for current filter
  const trendJobs = filterSystem === 'All systems' ? filtered : filtered
  const pricesWithData = trendJobs.filter(j => j.final_price).map(j => Number(j.final_price))
  const avgPrice = pricesWithData.length ? Math.round(pricesWithData.reduce((a, b) => a + b, 0) / pricesWithData.length) : null
  const minPrice = pricesWithData.length ? Math.min(...pricesWithData) : null
  const maxPrice = pricesWithData.length ? Math.max(...pricesWithData) : null
  const referYes = trendJobs.filter(j => j.would_refer === 'yes').length
  const referRatio = trendJobs.length ? Math.round((referYes / trendJobs.length) * 100) : null
  const allTags = trendJobs.flatMap(j => j.tags || [])
  const tagCounts: Record<string, number> = {}
  allTags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1 })
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag]) => tag)

  const inputStyle = {
    padding: '10px 14px', border: '1px solid rgba(30,58,47,0.2)',
    borderRadius: '8px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', color: '#1A1A18'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#8A8A82' }}>Loading...</p>
    </div>
  )

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <Nav />

      {/* Header */}
      <div style={{ background: '#1E3A2F', padding: '40px 28px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '8px' }}>Community</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, color: '#F8F4EE', marginBottom: '12px' }}>Neighbor Network</h1>
          <p style={{ fontSize: '14px', color: 'rgba(248,244,238,0.65)', maxWidth: '560px', lineHeight: 1.7, marginBottom: '0' }}>
            Real contractor reviews from verified homeowners. Every review is tied to an actual logged job — no paid placements, no anonymous tips. Use this as one input in your decision — always get multiple quotes and do your own research before hiring.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ background: '#FBF0DC', borderBottom: '1px solid rgba(196,123,43,0.2)', padding: '12px 28px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', fontSize: '12px', color: '#7A4A10', lineHeight: 1.6 }}>
          <strong>Community data disclaimer:</strong> Reviews reflect individual homeowner experiences and are shared anonymously. Hearth does not verify contractor licenses, insurance, or the accuracy of pricing data. Always verify credentials, get multiple bids, and consult licensed professionals before making hiring decisions. Hearth is not responsible for the quality of work performed by any contractor listed here.
        </div>
      </div>

      {/* Search and filters */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(30,58,47,0.11)', padding: '16px 28px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, flex: 2, minWidth: '180px' }}
            placeholder="Search by contractor or service..."
          />
          <input
            value={zipSearch}
            onChange={e => setZipSearch(e.target.value)}
            style={{ ...inputStyle, width: '120px' }}
            placeholder="ZIP code"
          />
          <select value={filterSystem} onChange={e => setFilterSystem(e.target.value)} style={{ ...inputStyle }}>
            {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 28px 64px' }}>

        {/* Trend insights */}
        {filtered.length >= 2 && (
          <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '22px', marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '12px' }}>
              Community insights · {filtered.length} review{filtered.length !== 1 ? 's' : ''}
              {filterSystem !== 'All systems' ? ` · ${filterSystem}` : ''}
              {zipSearch ? ` · ${zipSearch}` : ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              {minPrice !== null && maxPrice !== null && (
                <div>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE', marginBottom: '2px' }}>
                    ${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.5)' }}>Price range logged</div>
                </div>
              )}
              {avgPrice !== null && (
                <div>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE', marginBottom: '2px' }}>
                    ${avgPrice.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.5)' }}>Average price paid</div>
                </div>
              )}
              {referRatio !== null && (
                <div>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE', marginBottom: '2px' }}>
                    {referRatio}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.5)' }}>Would refer their contractor</div>
                </div>
              )}
              {topTags.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.5)', marginBottom: '6px' }}>Most common tags</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {topTags.map(tag => (
                      <span key={tag} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', color: 'rgba(248,244,238,0.8)' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sign up prompt for non-users */}
        {!user && (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px 22px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F', marginBottom: '4px' }}>Want to contribute a review?</div>
              <div style={{ fontSize: '13px', color: '#8A8A82' }}>Set up your home profile to log contractor jobs and share with your neighbors.</div>
            </div>
            <a href="/signup" style={{ background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, flexShrink: 0 }}>Get started — it&apos;s free</a>
          </div>
        )}

        {/* Results */}
        {contractors.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>👥</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>
              {jobs.length === 0 ? 'No shared reviews yet' : 'No results found'}
            </h3>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px' }}>
              {jobs.length === 0 ? 'Be the first to share a contractor review.' : 'Try adjusting your search or filters.'}
            </p>
            {user && (
              <a href="/log" style={{ display: 'inline-block', background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}>Log and share a job</a>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#8A8A82' }}>{contractors.length} contractor{contractors.length !== 1 ? 's' : ''} · {filtered.length} review{filtered.length !== 1 ? 's' : ''}</p>

            {contractors.map(([key, contractorJobs]) => {
              const isExpanded = expandedContractor === key
              const ratings = contractorJobs.filter(j => j.quality_rating).map(j => j.quality_rating)
              const avgRating = avg(ratings)
              const prices = contractorJobs.filter(j => j.final_price).map(j => Number(j.final_price))
              const minP = prices.length ? Math.min(...prices) : null
              const maxP = prices.length ? Math.max(...prices) : null
              const referCount = contractorJobs.filter(j => j.would_refer === 'yes').length
              const allJobTags = contractorJobs.flatMap(j => j.tags || [])
              const jobTagCounts: Record<string, number> = {}
              allJobTags.forEach(t => { jobTagCounts[t] = (jobTagCounts[t] || 0) + 1 })
              const topJobTags = Object.entries(jobTagCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag]) => tag)
              const systems = [...new Set(contractorJobs.map(j => j.system_type?.replace(/_/g, ' ')))]

              return (
                <div key={key} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
                  {/* Contractor summary */}
                  <div style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 500 }}>{contractorJobs[0].company_name}</h4>
                          <span style={{
                            fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px',
                            background: referCount / contractorJobs.length >= 0.7 ? '#EAF2EC' : referCount / contractorJobs.length >= 0.4 ? '#FBF0DC' : '#FDECEA',
                            color: referCount / contractorJobs.length >= 0.7 ? '#3D7A5A' : referCount / contractorJobs.length >= 0.4 ? '#7A4A10' : '#9B2C2C'
                          }}>
                            {referCount} of {contractorJobs.length} would refer
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '8px' }}>
                          {systems.join(', ')} · {contractorJobs.length} job{contractorJobs.length !== 1 ? 's' : ''} logged
                        </div>
                        {topJobTags.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {topJobTags.map(tag => (
                              <span key={tag} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: '#C47B2B', fontSize: '16px', marginBottom: '4px' }}>
                          {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                          <span style={{ fontSize: '13px', color: '#8A8A82', marginLeft: '6px' }}>{avgRating}</span>
                        </div>
                        {minP !== null && (
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>
                            {minP === maxP ? `$${minP.toLocaleString()}` : `$${minP.toLocaleString()} – $${maxP!.toLocaleString()}`}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>
                          {prices.length} price{prices.length !== 1 ? 's' : ''} logged
                        </div>
                      </div>
                    </div>

                    {contractorJobs.length > 1 && (
                      <button
                        onClick={() => setExpandedContractor(isExpanded ? null : key)}
                        style={{ marginTop: '12px', background: 'none', border: '1px solid rgba(30,58,47,0.15)', color: '#1E3A2F', fontSize: '12px', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {isExpanded ? 'Hide reviews' : `View all ${contractorJobs.length} reviews`}
                      </button>
                    )}
                  </div>

                  {/* Individual reviews */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid rgba(30,58,47,0.08)' }}>
                      {contractorJobs.map((job, i) => (
                        <div key={job.id} style={{ padding: '16px 22px', borderBottom: i < contractorJobs.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', background: '#FAFAF8' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '3px' }}>{job.service_description || job.system_type?.replace(/_/g, ' ')}</div>
                              <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '6px' }}>
                                {job.system_type?.replace(/_/g, ' ')}
                                {job.job_date ? ` · ${new Date(job.job_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''}
                              </div>
                              {job.tags && job.tags.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {job.tags.map((tag: string) => (
                                    <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>
                                {job.final_price ? `$${Number(job.final_price).toLocaleString()}` : '—'}
                              </div>
                              {job.quoted_price && job.final_price && Number(job.final_price) > Number(job.quoted_price) && (
                                <div style={{ fontSize: '11px', color: '#8B3A2A' }}>Quoted: ${Number(job.quoted_price).toLocaleString()}</div>
                              )}
                              <div style={{ color: '#C47B2B', fontSize: '13px', marginTop: '2px' }}>{'★'.repeat(job.quality_rating)}</div>
                              <div style={{ fontSize: '11px', marginTop: '2px', color: job.would_refer === 'yes' ? '#3D7A5A' : job.would_refer === 'no' ? '#9B2C2C' : '#7A4A10' }}>
                                {job.would_refer === 'yes' ? '✓ Would refer' : job.would_refer === 'no' ? '✕ Would not refer' : '~ With reservations'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '32px', background: '#1E3A2F', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#F8F4EE', fontWeight: 400, marginBottom: '8px' }}>
            Help your neighbors
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.6)', marginBottom: '16px' }}>
            Every review you share helps the next homeowner make a better decision. Log a job anonymously in under 2 minutes.
          </p>
          {user ? (
            <a href="/log" style={{ display: 'inline-block', background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}>Log and share a job</a>
          ) : (
            <a href="/signup" style={{ display: 'inline-block', background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}>Create a free account to contribute</a>
          )}
        </div>
      </div>
    </main>
  )
}