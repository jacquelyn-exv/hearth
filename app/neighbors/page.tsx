'use client'

import Nav from '@/components/Nav'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Badge system ─────────────────────────────────────────────────────────────
interface Badge {
  id: string
  emoji: string
  name: string
  desc: string
  earnedDesc: string
}

const ALL_BADGES: Badge[] = [
  { id: 'first_brick',       emoji: '🌱', name: 'First Brick',        desc: 'Awarded when you log your very first contractor job.',                        earnedDesc: 'Logged first job' },
  { id: 'handy_neighbor',    emoji: '🔨', name: 'Handy Neighbor',     desc: '5 or more jobs logged. You\'re building a solid home history.',               earnedDesc: '5+ jobs shared' },
  { id: 'block_captain',     emoji: '🏆', name: 'Block Captain',      desc: '10+ jobs logged. You\'re the go-to resource for your neighbors.',             earnedDesc: '10+ jobs shared' },
  { id: 'quality_scout',     emoji: '⭐', name: 'Quality Scout',      desc: 'Average quality rating given is 4.5 or higher. You set a high bar.',          earnedDesc: 'Avg rating ≥ 4.5' },
  { id: 'super_referrer',    emoji: '🤝', name: 'Super Referrer',     desc: '80% or more of your reviewed contractors would be referred to a neighbor.',   earnedDesc: '80%+ referral rate' },
  { id: 'founding_neighbor', emoji: '🏘️', name: 'Founding Neighbor',  desc: 'You joined Hearth in its early days. A permanent mark of your OG status.',   earnedDesc: 'Early adopter' },
  { id: 'price_tracker',     emoji: '💰', name: 'Price Tracker',      desc: 'Logged prices on 5 or more jobs — helping neighbors budget with confidence.', earnedDesc: '5+ prices logged' },
  { id: 'champion',          emoji: '🌟', name: 'Community Champion', desc: 'Reached 1,000 points. The highest honor in the Hearth community.',            earnedDesc: '1,000+ pts' },
]

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  first_brick:       { bg: '#EAF2EC', color: '#2D6A4A' },
  handy_neighbor:    { bg: '#FBF0DC', color: '#7A4A10' },
  block_captain:     { bg: '#FFF3CD', color: '#7A5500' },
  quality_scout:     { bg: '#FBF0DC', color: '#7A4A10' },
  super_referrer:    { bg: '#EAF2EC', color: '#2D6A4A' },
  founding_neighbor: { bg: '#F0EEF8', color: '#4A3A7A' },
  price_tracker:     { bg: '#E6F2F8', color: '#2A5F82' },
  champion:          { bg: '#FFF3CD', color: '#7A5500' },
}

function getCommunityLevel(points: number) {
  if (points >= 1000) return { label: 'Community Champion', emoji: '🏆', next: null, nextPoints: null }
  if (points >= 500)  return { label: 'Neighborhood Expert', emoji: '🌟', next: 'Community Champion', nextPoints: 1000 }
  if (points >= 200)  return { label: 'Active Homeowner',   emoji: '🏡', next: 'Neighborhood Expert', nextPoints: 500 }
  return                     { label: 'New Homeowner',       emoji: '🌱', next: 'Active Homeowner',   nextPoints: 200 }
}

function computeBadges(cs: any, jobs: any[]): string[] {
  const earned: string[] = []
  if (!cs) return earned
  if (cs.first_job_logged || cs.jobs_shared > 0) earned.push('first_brick')
  if (cs.jobs_shared >= 5)  earned.push('handy_neighbor')
  if (cs.jobs_shared >= 10) earned.push('block_captain')
  const ratings = jobs.filter((j: any) => j.quality_rating).map((j: any) => Number(j.quality_rating))
  const avgRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0
  if (avgRating >= 4.5 && ratings.length >= 3) earned.push('quality_scout')
  const referYes = jobs.filter((j: any) => j.would_refer === 'yes').length
  if (jobs.length >= 5 && referYes / jobs.length >= 0.8) earned.push('super_referrer')
  if (cs.created_at && new Date(cs.created_at) < new Date('2025-06-01')) earned.push('founding_neighbor')
  if (jobs.filter((j: any) => j.final_price).length >= 5) earned.push('price_tracker')
  if ((cs.total_points || 0) >= 1000) earned.push('champion')
  return earned
}

const AVATAR_PALETTES = [
  { bg: '#FBF0DC', color: '#7A4A10' },
  { bg: '#EAF2EC', color: '#2D6A4A' },
  { bg: '#E6F2F8', color: '#2A5F82' },
  { bg: '#F0EEF8', color: '#4A3A7A' },
  { bg: '#F5EAE7', color: '#7A2A1A' },
  { bg: '#EDE8E0', color: '#5A5040' },
]

function getPalette(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
const SYSTEMS = [
  'All systems', 'Deck / Patio', 'Doors', 'Driveway', 'Electrical',
  'Fencing', 'Gutters', 'HVAC', 'Landscaping', 'Plumbing',
  'Roof', 'Siding', 'Sump Pump', 'Water Heater', 'Windows', 'Other',
]

const SEASON_TIPS: Record<number, { system: string, tip: string }[]> = {
  0: [{ system: 'Plumbing', tip: 'Inspect pipes for freeze damage' }, { system: 'Roof', tip: 'Check for ice dam damage' }],
  1: [{ system: 'Plumbing', tip: 'Inspect pipes for freeze damage' }, { system: 'Roof', tip: 'Check for ice dam damage' }],
  2: [{ system: 'Gutters', tip: 'Clean winter debris' }, { system: 'HVAC', tip: 'Schedule tune-up before cooling season' }],
  3: [{ system: 'Gutters', tip: 'Clean winter debris' }, { system: 'HVAC', tip: 'Schedule tune-up before cooling season' }],
  4: [{ system: 'Deck / Patio', tip: 'Seal and stain before summer' }, { system: 'Windows', tip: 'Check seals and caulking' }],
  5: [{ system: 'HVAC', tip: 'Check AC performance and filters' }, { system: 'Roof', tip: 'Inspect ventilation and attic heat' }],
  6: [{ system: 'HVAC', tip: 'Check AC performance and filters' }, { system: 'Roof', tip: 'Inspect ventilation and attic heat' }],
  7: [{ system: 'HVAC', tip: 'Check AC performance and filters' }, { system: 'Driveway', tip: 'Seal before winter' }],
  8: [{ system: 'Gutters', tip: 'Clean before leaves fall' }, { system: 'HVAC', tip: 'Service heating system' }],
  9: [{ system: 'Gutters', tip: 'Clean before leaves fall' }, { system: 'HVAC', tip: 'Service heating system' }],
  10: [{ system: 'Plumbing', tip: 'Winterize outdoor faucets' }, { system: 'Roof', tip: 'Check before winter storms' }],
  11: [{ system: 'Plumbing', tip: 'Check pipes in unheated spaces' }, { system: 'Roof', tip: 'Monitor for ice dams' }],
}

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

function getPriceRange(prices: number[]) {
  if (!prices.length) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  if (avg < 500) return { label: '$', desc: 'Budget-friendly', color: '#3D7A5A' }
  if (avg < 3000) return { label: '$$', desc: 'Mid-range', color: '#3A7CA8' }
  return { label: '$$$', desc: 'Premium', color: '#C47B2B' }
}

export default function Neighbors() {
  const [user, setUser] = useState<any>(null)
  const [userZip, setUserZip] = useState('')
  const [userSystems, setUserSystems] = useState<string[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
const [activeView, setActiveView] = useState<'neighborhood' | 'contractors' | 'pricing' | 'reviews' | 'leaderboard'>('neighborhood')
  const [search, setSearch] = useState('')
  const [zipSearch, setZipSearch] = useState('')
  const [filterSystem, setFilterSystem] = useState('All systems')
  const [sortBy, setSortBy] = useState<'reviews' | 'rating' | 'refer' | 'recent'>('reviews')
  const [expandedContractor, setExpandedContractor] = useState<string | null>(null)
  const [myJobs, setMyJobs] = useState<any[]>([])
  const [myCommunityScore, setMyCommunityScore] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [profileModal, setProfileModal] = useState<any>(null)
  const [badgeModal, setBadgeModal] = useState<Badge | null>(null)
  const [badgeModalEarned, setBadgeModalEarned] = useState(false)
  const [badgeModalProgress, setBadgeModalProgress] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: homes } = await supabase.from('homes').select('id, zip').eq('user_id', user.id).limit(1)
        if (homes && homes.length > 0) {
          setUserZip(homes[0].zip || '')
          setZipSearch(homes[0].zip || '')
          const { data: systems } = await supabase.from('home_systems').select('system_type').eq('home_id', homes[0].id)
          setUserSystems(systems?.map(s => s.system_type) || [])
          const { data: myJobData } = await supabase
            .from('contractor_jobs')
            .select('quality_rating, would_refer, final_price, created_at')
            .eq('user_id', user.id)
          setMyJobs(myJobData || [])

          await supabase.rpc('recalculate_community_score', { p_user_id: user.id })
          const { data: csData } = await supabase.from('community_scores').select('*').eq('user_id', user.id).single()
          if (csData) setMyCommunityScore(csData)

          const { data: lbData } = await supabase
            .from('community_scores')
            .select('*')
            .order('total_points', { ascending: false })
            .limit(20)
          if (lbData) {
            const enriched = await Promise.all(lbData.map(async (cs: any) => {
              const { data: theirJobs } = await supabase
                .from('public_contractor_jobs')
                .select('quality_rating, would_refer, final_price')
                .eq('user_id', cs.user_id)
              return { ...cs, theirJobs: theirJobs || [] }
            }))
            setLeaderboard(enriched)
          }
        }
      }

      const { data } = await supabase.from('public_contractor_jobs').select('*').order('created_at', { ascending: false })
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
      job.system_type?.replace(/_/g, ' ').toLowerCase() === filterSystem.toLowerCase().replace(' / ', '/').replace('/', ' ').toLowerCase() ||
      job.system_type?.replace(/_/g, ' ').toLowerCase() === filterSystem.toLowerCase()
    const matchesZip = !zipSearch || job.zip === zipSearch || !job.zip
    return matchesSearch && matchesSystem && matchesZip
  })

  const grouped = groupByContractor(filtered)
  const contractors = Object.entries(grouped).sort((a, b) => {
    if (sortBy === 'rating') return avg(b[1].map(j => j.quality_rating).filter(Boolean)) - avg(a[1].map(j => j.quality_rating).filter(Boolean))
    if (sortBy === 'refer') {
      const aRate = a[1].filter(j => j.would_refer === 'yes').length / a[1].length
      const bRate = b[1].filter(j => j.would_refer === 'yes').length / b[1].length
      return bRate - aRate
    }
    if (sortBy === 'recent') {
      const aDate = Math.max(...a[1].map(j => new Date(j.job_date || j.created_at).getTime()))
      const bDate = Math.max(...b[1].map(j => new Date(j.job_date || j.created_at).getTime()))
      return bDate - aDate
    }
    return b[1].length - a[1].length
  })

  // Neighborhood stats
  const zipJobs = jobs.filter(j => j.zip === userZip)
  const month = new Date().getMonth()
  const seasonTips = SEASON_TIPS[month] || []
  const pricesWithData = filtered.filter(j => j.final_price).map(j => Number(j.final_price))
  const avgPrice = pricesWithData.length ? Math.round(pricesWithData.reduce((a, b) => a + b, 0) / pricesWithData.length) : null
  const minPrice = pricesWithData.length ? Math.min(...pricesWithData) : null
  const maxPrice = pricesWithData.length ? Math.max(...pricesWithData) : null
  const referYes = filtered.filter(j => j.would_refer === 'yes').length
  const referRatio = filtered.length ? Math.round((referYes / filtered.length) * 100) : null

  // Trending systems in zip
  const zipSystemCounts: Record<string, number> = {}
  zipJobs.forEach(j => { if (j.system_type) zipSystemCounts[j.system_type] = (zipSystemCounts[j.system_type] || 0) + 1 })
  const trendingSystems = Object.entries(zipSystemCounts).sort((a, b) => b[1] - a[1]).slice(0, 4)

  // Pricing by system
  const pricingBySystem: Record<string, number[]> = {}
  jobs.filter(j => j.final_price && (j.zip === userZip || !userZip)).forEach(j => {
    const sys = j.system_type?.replace(/_/g, ' ')
    if (!sys) return
    if (!pricingBySystem[sys]) pricingBySystem[sys] = []
    pricingBySystem[sys].push(Number(j.final_price))
  })

  // Smart recommendations based on user systems
  const recommendations = userSystems.slice(0, 4).map(sys => {
    const sysJobs = jobs.filter(j => j.system_type === sys && j.final_price)
    const prices = sysJobs.map(j => Number(j.final_price))
    const sysContractors = Object.entries(groupByContractor(sysJobs)).sort((a, b) => b[1].length - a[1].length).slice(0, 2)
    return { system: sys, jobs: sysJobs.length, avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null, topContractors: sysContractors }
  }).filter(r => r.jobs > 0)

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
      <Nav />

      {/* Header */}
      <div style={{ background: '#1E3A2F', padding: '40px 28px 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '8px' }}>Community</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, color: '#F8F4EE', marginBottom: '10px' }}>Neighbor Network</h1>
          <p style={{ fontSize: '14px', color: 'rgba(248,244,238,0.65)', maxWidth: '560px', lineHeight: 1.7, marginBottom: '24px' }}>
            Real contractor reviews from verified homeowners. No paid placements, no anonymous tips — every review is tied to an actual logged job.
          </p>

          {/* Nav tiles */}
          <div style={{ display: 'flex', gap: '2px' }}>
            {[
            { key: 'neighborhood', label: '🏘️ My Neighborhood' },
            { key: 'contractors',  label: '🔍 Find Contractors' },
            { key: 'pricing',      label: '💰 Pricing Trends' },
            { key: 'reviews',      label: '⭐ Recent Reviews' },
            { key: 'leaderboard',  label: '✦ Top Neighbors' },
          ].map(tab => (
              <button key={tab.key} onClick={() => setActiveView(tab.key as any)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeView === tab.key ? '#F8F4EE' : tab.key === 'leaderboard' ? '#C47B2B' : 'rgba(248,244,238,0.5)',
                fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
                padding: '9px 16px 13px', whiteSpace: 'nowrap',
                borderBottom: activeView === tab.key ? '2px solid #C47B2B' : '2px solid transparent',
                fontWeight: activeView === tab.key ? 500 : 400,
                position: 'relative', bottom: '-1px'
              }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ background: '#FBF0DC', borderBottom: '1px solid rgba(196,123,43,0.2)', padding: '10px 28px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', fontSize: '12px', color: '#7A4A10', lineHeight: 1.6 }}>
          <strong>Community data:</strong> Reviews reflect individual homeowner experiences shared anonymously. Hearth does not verify contractor licenses or pricing accuracy. Always get multiple bids and verify credentials before hiring.
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 28px 64px' }}>

        {/* MY NEIGHBORHOOD VIEW */}
        {activeView === 'neighborhood' && (
          <div>
            {user && myCommunityScore && (() => {
              // ... the block you just pasted
            })()}

          
            {/* ZIP header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>
                  {userZip ? `Your area · ${userZip}` : 'Your neighborhood'}
                </h2>
                <p style={{ fontSize: '13px', color: '#8A8A82' }}>{zipJobs.length} reviews from your zip code</p>
              </div>
              <input value={zipSearch} onChange={e => setZipSearch(e.target.value)} style={{ ...inputStyle, width: '120px', fontSize: '13px' }} placeholder="Change ZIP" />
            </div>

            {/* Trending systems */}
            {trendingSystems.length > 0 && (
              <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '20px 22px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '14px' }}>Trending in your area</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {trendingSystems.map(([sys, count]) => (
                    <div key={sys} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', cursor: 'pointer' }} onClick={() => { setFilterSystem(sys.replace(/_/g, ' ')); setActiveView('contractors') }}>
                      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#C47B2B', fontWeight: 600, marginBottom: '2px' }}>{count}</div>
                      <div style={{ fontSize: '13px', color: '#F8F4EE', marginBottom: '2px', textTransform: 'capitalize' }}>{sys.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.45)' }}>job{count !== 1 ? 's' : ''} logged</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seasonal spotlight */}
            <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px 22px', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1E3A2F', marginBottom: '14px' }}>🌿 This season in your area</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {seasonTips.map((tip, i) => {
                  const tipPrices = jobs.filter(j => j.system_type?.replace(/_/g, ' ').toLowerCase() === tip.system.toLowerCase() && j.final_price && j.zip === userZip).map(j => Number(j.final_price))
                  const tipAvg = tipPrices.length ? Math.round(tipPrices.reduce((a, b) => a + b, 0) / tipPrices.length) : null
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: i < seasonTips.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>{tip.system}</div>
                        <div style={{ fontSize: '12px', color: '#8A8A82' }}>{tip.tip}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {tipAvg && <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>avg ${tipAvg.toLocaleString()}</div>}
                        <button onClick={() => { setFilterSystem(tip.system); setActiveView('contractors') }} style={{ fontSize: '11px', color: '#3D7A5A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0 }}>Find contractors →</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Smart recommendations */}
            {recommendations.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px 22px', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>🧠 Based on your home</h3>
                <p style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '14px' }}>What neighbors paid for systems you track</p>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {recommendations.map((rec, i) => (
                    <div key={rec.system} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: i < recommendations.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px', textTransform: 'capitalize' }}>{rec.system.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '12px', color: '#8A8A82' }}>{rec.jobs} review{rec.jobs !== 1 ? 's' : ''} in the network</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {rec.avgPrice && <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>avg ${rec.avgPrice.toLocaleString()}</div>}
                        <button onClick={() => { setFilterSystem(rec.system.replace(/_/g, ' ')); setActiveView('contractors') }} style={{ fontSize: '11px', color: '#3D7A5A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0 }}>See contractors →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sign up prompt */}
            {!user && (
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px 22px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F', marginBottom: '4px' }}>See personalized recommendations</div>
                  <div style={{ fontSize: '13px', color: '#8A8A82' }}>Set up your home profile to get insights based on your specific systems.</div>
                </div>
                <a href="/signup" style={{ background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, flexShrink: 0 }}>Get started free</a>
              </div>
            )}
          </div>
        )}

        {/* FIND CONTRACTORS VIEW */}
        {activeView === 'contractors' && (
          <div>
            {/* Search and filter */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: '180px' }} placeholder="Search by contractor or service..." />
              <input value={zipSearch} onChange={e => setZipSearch(e.target.value)} style={{ ...inputStyle, width: '110px' }} placeholder="ZIP code" />
              <select value={filterSystem} onChange={e => setFilterSystem(e.target.value)} style={inputStyle}>
                {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={inputStyle}>
                <option value="reviews">Most reviewed</option>
                <option value="rating">Highest rated</option>
                <option value="refer">Most referred</option>
                <option value="recent">Most recent</option>
              </select>
            </div>

            {contractors.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>👥</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>No contractors found</h3>
                <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px' }}>Try adjusting your search or ZIP code.</p>
                <a href={user ? '/log' : '/signup'} style={{ display: 'inline-block', background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}>
                  {user ? 'Log a job' : 'Create account to contribute'}
                </a>
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
                  const referRate = Math.round((referCount / contractorJobs.length) * 100)
                  const priceRange = getPriceRange(prices)
                  const systems = [...new Set(contractorJobs.map(j => j.system_type?.replace(/_/g, ' ')))]
                  const allJobTags = contractorJobs.flatMap(j => j.tags || [])
                  const jobTagCounts: Record<string, number> = {}
                  allJobTags.forEach(t => { jobTagCounts[t] = (jobTagCounts[t] || 0) + 1 })
                  const topJobTags = Object.entries(jobTagCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag]) => tag)
                  const mostRecentJob = contractorJobs.sort((a, b) => new Date(b.job_date || b.created_at).getTime() - new Date(a.job_date || a.created_at).getTime())[0]
                  const website = contractorJobs.find(j => j.contractor_website)?.contractor_website

                  return (
                    <div key={key} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ padding: '20px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              <h4 style={{ fontSize: '16px', fontWeight: 500, color: '#1E3A2F' }}>{contractorJobs[0].company_name}</h4>
                              {priceRange && (
                                <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: '#F8F4EE', color: priceRange.color }}>
                                  {priceRange.label} · {priceRange.desc}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '8px' }}>
                            {systems.filter(Boolean).map(s => s?.replace(/\b\w/g, (l: string) => l.toUpperCase())).join(' · ')}                            </div>

                            {/* Ratings row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#C47B2B', fontSize: '14px' }}>{'★'.repeat(Math.round(avgRating))}</span>
                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{avgRating}</span>
                                <span style={{ fontSize: '12px', color: '#8A8A82' }}>({contractorJobs.length} Hearth review{contractorJobs.length !== 1 ? 's' : ''})</span>
                              </div>
                              <div style={{ fontSize: '12px', color: referRate >= 70 ? '#3D7A5A' : referRate >= 40 ? '#7A4A10' : '#9B2C2C', fontWeight: 500 }}>
                                {referRate}% would refer
                              </div>
                            </div>

                            {topJobTags.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                {topJobTags.map(tag => <span key={tag} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{tag}</span>)}
                              </div>
                            )}

                            {/* Action links */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {website && (
                                <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3A7CA8', textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(58,124,168,0.25)', fontWeight: 500 }}>
                                  🌐 Visit website
                                </a>
                              )}
                              <button onClick={() => setExpandedContractor(isExpanded ? null : key)} style={{ fontSize: '12px', color: '#1E3A2F', background: 'none', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(30,58,47,0.2)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                                {isExpanded ? 'Hide reviews' : `${contractorJobs.length} review${contractorJobs.length !== 1 ? 's' : ''} →`}
                              </button>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {minP !== null && (
                              <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>
                                {minP === maxP ? `$${minP.toLocaleString()}` : `$${minP.toLocaleString()} – $${maxP!.toLocaleString()}`}
                              </div>
                            )}
                            {prices.length > 0 && <div style={{ fontSize: '11px', color: '#8A8A82' }}>{prices.length} price{prices.length !== 1 ? 's' : ''} logged</div>}
                            {mostRecentJob?.job_date && (
                              <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '4px' }}>
                                Last job: {new Date(mostRecentJob.job_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ borderTop: '1px solid rgba(30,58,47,0.08)' }}>
                          {contractorJobs.map((job, i) => (
                            <div key={job.id} style={{ padding: '14px 22px', borderBottom: i < contractorJobs.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', background: '#FAFAF8' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>{job.service_description || job.system_type?.replace(/_/g, ' ')}</div>
                                  <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>
                                    {job.system_type?.replace(/_/g, ' ')}
                                    {job.job_date ? ` · ${new Date(job.job_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''}
                                  </div>
                                  {job.tags?.length > 0 && (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                      {job.tags.map((tag: string) => <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{tag}</span>)}
                                    </div>
                                  )}
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>{job.final_price ? `$${Number(job.final_price).toLocaleString()}` : '—'}</div>
                                  {job.quoted_price && job.final_price && Number(job.final_price) > Number(job.quoted_price) && (
                                    <div style={{ fontSize: '11px', color: '#8B3A2A' }}>Quoted: ${Number(job.quoted_price).toLocaleString()}</div>
                                  )}
                                  <div style={{ color: '#C47B2B', fontSize: '12px' }}>{'★'.repeat(job.quality_rating)}</div>
                                  <div style={{ fontSize: '11px', color: job.would_refer === 'yes' ? '#3D7A5A' : job.would_refer === 'no' ? '#9B2C2C' : '#7A4A10' }}>
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
          </div>
        )}

        {/* PRICING TRENDS VIEW */}
        {activeView === 'pricing' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input value={zipSearch} onChange={e => setZipSearch(e.target.value)} style={{ ...inputStyle, width: '120px' }} placeholder="ZIP code" />
            </div>

            {Object.keys(pricingBySystem).length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                <p style={{ color: '#8A8A82' }}>No pricing data available yet for this area.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: '#8A8A82' }}>Average prices logged by homeowners{userZip ? ` near ${userZip}` : ''}</p>
                {Object.entries(pricingBySystem).sort((a, b) => b[1].length - a[1].length).map(([sys, prices]) => {
                  const sysAvg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
                  const sysMin = Math.min(...prices)
                  const sysMax = Math.max(...prices)
                  const priceRange = getPriceRange(prices)
                  return (
                    <div key={sys} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px', textTransform: 'capitalize' }}>{sys}</div>
                        <div style={{ fontSize: '12px', color: '#8A8A82' }}>{prices.length} job{prices.length !== 1 ? 's' : ''} logged</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#1E3A2F', fontWeight: 600 }}>${sysAvg.toLocaleString()}</div>
                        <div style={{ fontSize: '11px', color: '#8A8A82' }}>avg · ${sysMin.toLocaleString()} – ${sysMax.toLocaleString()}</div>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#EDE8E0', borderRadius: '3px' }}>
                        <div style={{ width: `${Math.min(100, (sysAvg / Math.max(...Object.values(pricingBySystem).map(p => Math.round(p.reduce((a, b) => a + b, 0) / p.length)))) * 100)}%`, height: '100%', background: priceRange?.color || '#3D7A5A', borderRadius: '3px' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* RECENT REVIEWS VIEW */}
        {activeView === 'reviews' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: '180px' }} placeholder="Search reviews..." />
              <input value={zipSearch} onChange={e => setZipSearch(e.target.value)} style={{ ...inputStyle, width: '110px' }} placeholder="ZIP code" />
              <select value={filterSystem} onChange={e => setFilterSystem(e.target.value)} style={inputStyle}>
                {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Trend bar */}
            {filtered.length >= 2 && (
              <div style={{ background: '#1E3A2F', borderRadius: '14px', padding: '18px 22px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '12px' }}>
                  {filtered.length} review{filtered.length !== 1 ? 's' : ''}{filterSystem !== 'All systems' ? ` · ${filterSystem}` : ''}{zipSearch ? ` · ${zipSearch}` : ''}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                  {avgPrice && <div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE' }}>${avgPrice.toLocaleString()}</div><div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.5)' }}>Average price</div></div>}
                  {minPrice && maxPrice && <div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE' }}>${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()}</div><div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.5)' }}>Price range</div></div>}
                  {referRatio !== null && <div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE' }}>{referRatio}%</div><div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.5)' }}>Would refer</div></div>}
                </div>
              </div>
            )}

            {filtered.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>⭐</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>No reviews yet</h3>
                <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px' }}>Be the first to share a contractor review in your area.</p>
                <a href={user ? '/log' : '/signup'} style={{ display: 'inline-block', background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}>
                  {user ? 'Log a job' : 'Create account to contribute'}
                </a>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {filtered.slice(0, 30).map(job => (
                  <div key={job.id} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '14px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>{job.company_name}</span>
                        <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '20px', background: '#EDE8E0', color: '#8A8A82', textTransform: 'capitalize' }}>{job.system_type?.replace(/_/g, ' ')}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '6px' }}>
                        {job.service_description}
                        {job.job_date ? ` · ${new Date(job.job_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''}
                        {job.zip ? ` · ${job.zip}` : ''}
                      </div>
                      {job.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {job.tags.map((tag: string) => <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{tag}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>{job.final_price ? `$${Number(job.final_price).toLocaleString()}` : '—'}</div>
                      <div style={{ color: '#C47B2B', fontSize: '12px' }}>{'★'.repeat(job.quality_rating)}</div>
                      <div style={{ fontSize: '11px', marginTop: '2px', color: job.would_refer === 'yes' ? '#3D7A5A' : job.would_refer === 'no' ? '#9B2C2C' : '#7A4A10' }}>
                        {job.would_refer === 'yes' ? '✓ Would refer' : job.would_refer === 'no' ? '✕ Would not refer' : '~ With reservations'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
{activeView === 'leaderboard' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8A8A82', marginBottom: '14px' }}>Badge directory</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                {ALL_BADGES.map(badge => {
                  const myEarnedBadges = computeBadges(myCommunityScore, myJobs)
                  const earned = myEarnedBadges.includes(badge.id)
                  return (
                    <button key={badge.id} onClick={() => { setBadgeModal(badge); setBadgeModalEarned(earned) }} style={{ background: earned ? '#FFFBF5' : '#fff', border: `1px solid ${earned ? '#C47B2B' : 'rgba(30,58,47,0.11)'}`, borderRadius: '12px', padding: '14px 12px', textAlign: 'center', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: earned ? 1 : 0.55 }}>
                      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{badge.emoji}</div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>{badge.name}</div>
                      <div style={{ fontSize: '10px', color: '#8A8A82', lineHeight: 1.4 }}>{badge.earnedDesc}</div>
                      {earned && <div style={{ fontSize: '10px', color: '#3D7A5A', fontWeight: 500, marginTop: '4px' }}>✓ Earned</div>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8A8A82', marginBottom: '14px' }}>Top neighbors</div>
            <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
              {leaderboard.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌱</div>
                  <p style={{ fontSize: '13px', color: '#8A8A82' }}>No contributors yet. Log a job to be first on the leaderboard.</p>
                </div>
              ) : leaderboard.map((cs, i) => {
                const isMe = user && cs.user_id === user.id
                const pts = cs.total_points || 0
                const level = getCommunityLevel(pts)
                const earnedBadges = computeBadges(cs, cs.theirJobs || [])
                const displayName = isMe ? 'You' : `Neighbor #${String(cs.user_id).slice(-4).toUpperCase()}`
                const initials = isMe ? 'ME' : getInitials(displayName)
                const palette = getPalette(cs.user_id)
                const rankColors = ['#C47B2B', '#8A8A82', '#7A4A10']
                return (
                  <div key={cs.user_id} onClick={() => setProfileModal({ cs, earnedBadges, displayName, initials, palette, level, pts, isMe })} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 20px', borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', cursor: 'pointer', background: isMe ? '#FFFBF5' : '#fff' }}>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 600, width: '24px', textAlign: 'center', flexShrink: 0, color: i < 3 ? rankColors[i] : '#BEBEB8' }}>{i + 1}</div>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: palette.bg, color: palette.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 500, flexShrink: 0 }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '3px' }}>
                        {displayName}
                        {isMe && <span style={{ fontSize: '10px', background: '#EAF2EC', color: '#3D7A5A', padding: '1px 6px', borderRadius: '20px', fontWeight: 500, marginLeft: '6px' }}>you</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: '#FBF0DC', color: '#7A4A10', fontWeight: 500 }}>{level.emoji} {level.label}</span>
                        {earnedBadges.slice(0, 3).map(id => {
                          const b = ALL_BADGES.find(x => x.id === id)!
                          return <span key={id} style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: BADGE_COLORS[id].bg, color: BADGE_COLORS[id].color, fontWeight: 500 }}>{b.emoji} {b.name}</span>
                        })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#C47B2B', fontWeight: 600 }}>{pts}</div>
                      <div style={{ fontSize: '10px', color: '#8A8A82' }}>pts</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '18px 20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '12px' }}>How to earn points</div>
              {[
                { label: 'Set up your home profile', pts: '+50 pts' },
                { label: 'Log your first job', pts: '+100 pts' },
                { label: 'Each job shared with community', pts: '+75 pts' },
                { label: 'Each system detailed', pts: '+25 pts' },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '7px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none' }}>
                  <span style={{ color: '#4A4A44' }}>{item.label}</span>
                  <span style={{ color: '#C47B2B', fontWeight: 500 }}>{item.pts}</span>
                </div>
              ))}
              <a href={user ? '/log' : '/signup'} style={{ display: 'block', marginTop: '14px', background: '#1E3A2F', color: '#F8F4EE', textAlign: 'center', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                {user ? 'Log a job to earn points →' : 'Create an account to join →'}
              </a>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{ marginTop: '32px', background: '#1E3A2F', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#F8F4EE', fontWeight: 400, marginBottom: '8px' }}>Help your neighbors</h3>
          <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.6)', marginBottom: '16px' }}>Every review you share helps the next homeowner make a better decision. Log a job in under 2 minutes.</p>
          <a href={user ? '/log' : '/signup'} style={{ display: 'inline-block', background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}>
            {user ? 'Log and share a job' : 'Create a free account to contribute'}
          </a>
        </div>
      </div>
    {profileModal && (
        <div onClick={() => setProfileModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: profileModal.palette.bg, color: profileModal.palette.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, margin: '0 auto 12px' }}>{profileModal.initials}</div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#1E3A2F', marginBottom: '6px' }}>{profileModal.displayName}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FBF0DC', color: '#7A4A10', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>{profileModal.level.emoji} {profileModal.level.label}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '18px' }}>
              {[{ label: 'pts', value: profileModal.pts }, { label: 'jobs shared', value: profileModal.cs.jobs_shared || 0 }, { label: 'systems detailed', value: profileModal.cs.systems_detailed || 0 }].map(stat => (
                <div key={stat.label} style={{ background: '#F8F4EE', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#C47B2B', fontWeight: 600 }}>{stat.value}</div>
                  <div style={{ fontSize: '10px', color: '#8A8A82', marginTop: '2px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
            {profileModal.earnedBadges.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', color: '#8A8A82', marginBottom: '8px' }}>Badges earned</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {profileModal.earnedBadges.map((id: string) => {
                    const b = ALL_BADGES.find(x => x.id === id)!
                    return <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '20px', background: BADGE_COLORS[id].bg, color: BADGE_COLORS[id].color }}>{b.emoji} {b.name}</span>
                  })}
                </div>
              </div>
            )}
            <button onClick={() => setProfileModal(null)} style={{ marginTop: '20px', width: '100%', background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '10px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Close</button>
          </div>
        </div>
      )}

      {badgeModal && (
        <div onClick={() => setBadgeModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{badgeModal.emoji}</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#1E3A2F', marginBottom: '8px' }}>{badgeModal.name}</div>
            <div style={{ fontSize: '13px', color: '#4A4A44', lineHeight: 1.6, marginBottom: '14px' }}>{badgeModal.desc}</div>
            {badgeModalEarned
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EAF2EC', color: '#2D6A4A', fontSize: '12px', fontWeight: 500, padding: '5px 14px', borderRadius: '20px' }}>✓ Earned</span>
              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F5F5F5', color: '#8A8A82', fontSize: '12px', fontWeight: 500, padding: '5px 14px', borderRadius: '20px' }}>🔒 Not yet earned</span>
            }
            <button onClick={() => setBadgeModal(null)} style={{ marginTop: '18px', width: '100%', background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '10px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Got it</button>
          </div>
        </div>
      )}
    </main>
  )
}