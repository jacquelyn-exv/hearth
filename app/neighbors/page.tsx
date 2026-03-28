'use client'

import Nav from '@/components/Nav'
import PriceTrendChart from '@/components/pricing/PriceTrendChart'
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
const [activeView, setActiveView] = useState<'neighborhood' | 'contractors' | 'pricing' | 'leaderboard'>('neighborhood')
  const [search, setSearch] = useState('')
  const [zipSearch, setZipSearch] = useState('')
  const [nearbyZips, setNearbyZips] = useState<string[]>([])
  const [loadingZips, setLoadingZips] = useState(false)
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
          const initialZip = homes[0].zip || ''
          setZipSearch(initialZip)
          if (typeof window !== 'undefined' && initialZip) {
            localStorage.setItem('hearth_neighbor_zip', initialZip)
          }
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
      const jobData = data || []
      setJobs(jobData)
      setLoading(false)
      // Now load nearby zips with job zips as candidates
      const defaultZip = (await supabase.auth.getUser()).data.user
        ? null : null // zip already set above
      const storedZip = localStorage.getItem('hearth_neighbor_zip')
      const zipToUse = storedZip || ''
      if (zipToUse) {
        const candidateZips = [...new Set(jobData.map((j: any) => j.zip).filter(Boolean))].join(',')
        fetch(`/api/nearby-zips?zip=${zipToUse}&radius=50&candidates=${candidateZips}`)
          .then(r => r.json())
          .then(d => setNearbyZips(d.zips || [zipToUse]))
          .catch(() => {})
      }
    }
    load()
  }, [])

  const loadNearbyZips = async (zip: string, jobList?: any[]) => {
    if (!zip || zip.length !== 5) return
    setLoadingZips(true)
    try {
      const source = jobList || jobs
      const candidateZips = [...new Set(source.map((j: any) => j.zip).filter(Boolean))].join(',')
      const url = candidateZips
        ? `/api/nearby-zips?zip=${zip}&radius=50&candidates=${candidateZips}`
        : `/api/nearby-zips?zip=${zip}&radius=50`
      const res = await fetch(url)
      const data = await res.json()
      setNearbyZips(data.zips || [zip])
    } catch {
      setNearbyZips([zip])
    }
    setLoadingZips(false)
  }

  const handleZipChange = async (newZip: string) => {
    setZipSearch(newZip)
    if (typeof window !== 'undefined') localStorage.setItem('hearth_neighbor_zip', newZip)
    if (newZip.length === 5) {
      await loadNearbyZips(newZip, jobs)
    }
  }

  const filtered = jobs.filter(job => {
    const matchesSearch = !search ||
      job.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      job.service_description?.toLowerCase().includes(search.toLowerCase())
    const matchesSystem = filterSystem === 'All systems' ||
      job.system_type?.replace(/_/g, ' ').toLowerCase() === filterSystem.toLowerCase().replace(' / ', '/').replace('/', ' ').toLowerCase() ||
      job.system_type?.replace(/_/g, ' ').toLowerCase() === filterSystem.toLowerCase()
    const activeZips = nearbyZips.length > 0 ? nearbyZips : (zipSearch ? [zipSearch] : [])
    const matchesZip = activeZips.length === 0 || !job.zip || activeZips.includes(job.zip)
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
  const zipJobs = jobs.filter(j => nearbyZips.length > 0 ? nearbyZips.includes(j.zip) : j.zip === userZip)
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
  const pricingZips = nearbyZips.length > 0 ? nearbyZips : (userZip ? [userZip] : [])
  jobs.filter(j => j.final_price && (pricingZips.length === 0 || pricingZips.includes(j.zip))).forEach(j => {
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
            { key: 'neighborhood', label: '🏘️ My Area' },
            { key: 'contractors',  label: '🔍 Find a Pro' },
            { key: 'pricing',      label: '💰 Pricing Trends' },
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
          <div style={{ display: 'grid', gap: '24px' }}>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Jobs in your area', value: String(zipJobs.length || 0), color: '#3D7A5A' },
                { label: 'Avg job cost', value: zipJobs.filter((j:any)=>j.final_price).length > 0 ? `$${Math.round(zipJobs.filter((j:any)=>j.final_price).reduce((a:number,b:any)=>a+Number(b.final_price),0)/zipJobs.filter((j:any)=>j.final_price).length).toLocaleString()}` : '—', color: '#1E3A2F' },
                { label: 'Would refer rate', value: zipJobs.length > 0 ? `${Math.round((zipJobs.filter((j:any)=>j.would_refer==='yes').length/zipJobs.length)*100)}%` : '—', color: '#3D7A5A' },
                { label: 'Contractors reviewed', value: String(new Set(zipJobs.map((j:any)=>j.company_name?.toLowerCase()).filter(Boolean)).size), color: '#C47B2B' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '14px', padding: '16px 18px' }}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 600, color: s.color, marginBottom: '4px' }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: '#8A8A82' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Two col: recent jobs + pricing */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

              {/* Recent jobs nearby */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 400, color: '#1E3A2F', marginBottom: '2px' }}>Recent jobs nearby</h3>
                    <p style={{ fontSize: '12px', color: '#8A8A82' }}>Within 50 miles · most recent first</p>
                  </div>
                  <button onClick={() => setActiveView('contractors')} style={{ fontSize: '12px', color: '#3D7A5A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, whiteSpace: 'nowrap' }}>See all →</button>
                </div>
                {zipJobs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                    <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '14px' }}>No jobs logged in your area yet.</p>
                    <button onClick={() => window.location.href = user ? '/dashboard' : '/signup'} style={{ background: '#C47B2B', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      Be the first to log one
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {zipJobs.slice(0, 4).map((job:any) => (
                      <div key={job.id} style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(30,58,47,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{job.company_name}</span>
                          {job.final_price && <span style={{ fontSize: '13px', color: '#C47B2B', fontWeight: 500, flexShrink: 0, marginLeft: '8px' }}>${Number(job.final_price).toLocaleString()}</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '5px' }}>
                          {job.system_type?.replace(/_/g,' ')} · {job.zip}{job.job_date ? ` · ${new Date(job.job_date).toLocaleDateString('en-US',{month:'short',year:'numeric'})}` : ''}
                        </div>
                        {job.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {job.tags.slice(0,2).map((t:string) => <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{t}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* What neighbors paid */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 400, color: '#1E3A2F', marginBottom: '2px' }}>What neighbors paid</h3>
                    <p style={{ fontSize: '12px', color: '#8A8A82' }}>By project type · your area</p>
                  </div>
                  <button onClick={() => setActiveView('pricing')} style={{ fontSize: '12px', color: '#3D7A5A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, whiteSpace: 'nowrap' }}>Full trends →</button>
                </div>
                {Object.keys(pricingBySystem).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>💰</div>
                    <p style={{ fontSize: '13px', color: '#8A8A82' }}>No pricing data yet for your area.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {Object.entries(pricingBySystem).slice(0,5).map(([sys, prices]:any) => {
                      const avg = Math.round(prices.reduce((a:number,b:number)=>a+b,0)/prices.length)
                      const maxAvg = Math.max(...Object.values(pricingBySystem).map((p:any)=>Math.round(p.reduce((a:number,b:number)=>a+b,0)/p.length)))
                      return (
                        <div key={sys}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '13px', color: '#1E3A2F', textTransform: 'capitalize' }}>{sys.replace(/_/g,' ')}</span>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>${avg.toLocaleString()} <span style={{ fontSize: '11px', color: '#8A8A82', fontWeight: 400 }}>avg · {prices.length} job{prices.length!==1?'s':''}</span></span>
                          </div>
                          <div style={{ height: '6px', background: '#EDE8E0', borderRadius: '3px' }}>
                            <div style={{ width: `${Math.min(100,(avg/maxAvg)*100)}%`, height: '100%', background: '#3D7A5A', borderRadius: '3px' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
              {[
                { icon: '⭐', title: 'Help your neighbors', body: "Log a job and share what you paid. Takes 2 minutes.", action: 'Log a job', onClick: () => window.location.href = user ? '/dashboard' : '/signup' },
                { icon: '🔍', title: 'Hire a pro', body: 'Find contractors reviewed by homeowners in your area.', action: 'Find a pro', onClick: () => setActiveView('contractors') },
                { icon: '📈', title: 'See price trends', body: 'How project costs have shifted from 2019 to today.', action: 'View trends', onClick: () => setActiveView('pricing') },
                { icon: '💡', title: 'What adds value?', body: 'Which projects recoup the most when you sell.', action: 'Cost vs. Value', onClick: () => setActiveView('pricing') },
              ].map(qa => (
                <div key={qa.title} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '10px' }}>{qa.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '6px' }}>{qa.title}</div>
                  <div style={{ fontSize: '12px', color: '#8A8A82', lineHeight: 1.6, marginBottom: '12px' }}>{qa.body}</div>
                  <button onClick={qa.onClick} style={{ fontSize: '12px', fontWeight: 500, color: '#3D7A5A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0 }}>{qa.action} →</button>
                </div>
              ))}
            </div>

            {/* Top neighbors preview */}
            {leaderboard.length > 0 && (
              <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 400, color: '#F8F4EE' }}>Top neighbors</h3>
                  <button onClick={() => setActiveView('leaderboard')} style={{ fontSize: '12px', color: '#6AAF8A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>See all →</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {leaderboard.slice(0,4).map((nb:any, i:number) => (
                    <div key={nb.user_id} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i===0?'#C47B2B':i===1?'rgba(248,244,238,0.2)':i===2?'rgba(196,123,43,0.3)':'rgba(248,244,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#F8F4EE', fontWeight: 600, flexShrink: 0 }}>{i+1}</div>
                      <div>
                        <div style={{ fontSize: '13px', color: '#F8F4EE', fontWeight: 500 }}>Neighbor {i+1}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.5)' }}>{nb.total_points||0} pts · {nb.theirJobs?.length||0} jobs shared</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

                {activeView === 'contractors' && (
          <div>
            {/* Search and filter */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: '180px' }} placeholder="Search by contractor or service..." />
              <input value={zipSearch} onChange={e => handleZipChange(e.target.value)} style={{ ...inputStyle, width: '110px' }} placeholder="ZIP code" />
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
          <div style={{ display: 'grid', gap: '28px' }}>

            {/* STAT ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Avg neighbor job cost', value: Object.keys(pricingBySystem).length > 0 ? `$${Math.round(Object.values(pricingBySystem).flat().reduce((a: number, b: number) => a + b, 0) / Object.values(pricingBySystem).flat().length).toLocaleString()}` : '—', sub: `${Object.values(pricingBySystem).flat().length} jobs logged nearby` },
                { label: 'National cost trend', value: '+4.2%', sub: '2024 → 2025 avg across projects' },
                { label: 'Best ROI project', value: '268%', sub: 'Garage door replacement', green: true },
                { label: 'Market conditions', value: 'Elevated', sub: 'Tariff + labor pressure', amber: true },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '14px', padding: '16px 18px' }}>
                  <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '6px' }}>{s.label}</div>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 600, color: (s as any).green ? '#3D7A5A' : (s as any).amber ? '#C47B2B' : '#1E3A2F', marginBottom: '3px' }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: '#8A8A82' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* TWO COL: TREND CHART + ROI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

              {/* Price trend chart */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>Project cost trends 2019–2025</h3>
                  <p style={{ fontSize: '12px', color: '#8A8A82' }}>National averages · hover a year to see what drove prices</p>
                </div>
                <PriceTrendChart />
              </div>

              {/* ROI YoY */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>ROI trend 2024 → 2025</h3>
                  <p style={{ fontSize: '12px', color: '#8A8A82' }}>Cost recouped at resale · year-over-year change</p>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {[
                    { project: 'Garage door replacement', pct: 268, prev: 194, cost: '$4,672' },
                    { project: 'Fiber-cement siding', pct: 114, prev: 88, cost: '$21,485' },
                    { project: 'Fiberglass entry door', pct: 85, prev: 97, cost: '$11,754' },
                    { project: 'Vinyl windows', pct: 76, prev: 67, cost: '$22,073' },
                    { project: 'Asphalt roof', pct: 68, prev: 57, cost: '$31,871' },
                    { project: 'Solar installation', pct: 30, prev: 0, cost: '$55,937' },
                  ].map(item => {
                    const delta = item.prev > 0 ? item.pct - item.prev : null
                    const barColor = item.pct >= 100 ? '#3D7A5A' : item.pct >= 70 ? '#C47B2B' : '#9B2C2C'
                    return (
                      <div key={item.project}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <span style={{ fontSize: '12px', color: '#1E3A2F' }}>{item.project}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {delta !== null && (
                              <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 6px', borderRadius: '10px', background: delta > 0 ? '#EAF2EC' : delta < 0 ? '#FDECEA' : '#F5F5F5', color: delta > 0 ? '#3D7A5A' : delta < 0 ? '#9B2C2C' : '#8A8A82' }}>
                                {delta > 0 ? `▲${delta}pts` : delta < 0 ? `▼${Math.abs(delta)}pts` : '—'}
                              </span>
                            )}
                            <span style={{ fontSize: '12px', fontWeight: 600, color: barColor, minWidth: '36px', textAlign: 'right' }}>{item.pct}%</span>
                          </div>
                        </div>
                        <div style={{ height: '6px', background: '#EDE8E0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, item.pct / 2.68)}%`, height: '100%', background: barColor, borderRadius: '3px' }} />
                        </div>
                        <div style={{ fontSize: '10px', color: '#8A8A82', marginTop: '2px' }}>avg {item.cost}</div>
                      </div>
                    )
                  })}
                </div>
                <p style={{ fontSize: '10px', color: '#8A8A82', marginTop: '14px', lineHeight: 1.6 }}>
                  Source: Remodeling 2025 Cost vs. Value Report (<a href="https://www.costvsvalue.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3D7A5A' }}>costvsvalue.com</a>). © 2025 Zonda Media.
                </p>
              </div>
            </div>

            {/* MARKET CONDITIONS */}
            <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>Market conditions affecting your projects</h3>
                <p style={{ fontSize: '12px', color: '#8A8A82' }}>Macro factors driving costs right now · 2025</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {[
                  { system: 'Roofing', status: 'Rising', statusColor: '#9B2C2C', statusBg: '#FDECEA', body: 'Shingle prices up 6–10% in 2025. Petroleum-based materials responding to oil price volatility. New shingles contain less asphalt than older stock.' },
                  { system: 'Windows & doors', status: 'Elevated', statusColor: '#7A4A10', statusBg: '#FBF0DC', body: 'Triple-pane demand surging — 87% of installs in some markets. Wholesale prices up 49–59% since Jan 2020. Tariff pressure on glass spacers.' },
                  { system: 'Steel & aluminum', status: 'Watch', statusColor: '#7A4A10', statusBg: '#FBF0DC', body: 'New tariff pressure in 2025. Affects garage doors, entry doors, gutters, and flashing. Not yet fully reflected in contractor quotes.' },
                  { system: 'Lumber', status: 'Stabilizing', statusColor: '#3D7A5A', statusBg: '#EAF2EC', body: 'Back near pre-pandemic levels after 300%+ surge in 2021. Good time for deck, framing, and wood-intensive projects. Concrete still rising.' },
                ].map(item => (
                  <div key={item.system} style={{ padding: '14px 16px', border: '0.5px solid rgba(30,58,47,0.11)', borderRadius: '12px', borderLeft: `3px solid ${item.statusColor}`, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{item.system}</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', background: item.statusBg, color: item.statusColor }}>{item.status}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#4A4A44', lineHeight: 1.6, margin: 0 }}>{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM ROW: community pricing + timing signals */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

              {/* Community pricing */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>What neighbors paid nearby</h3>
                  <p style={{ fontSize: '12px', color: '#8A8A82' }}>Logged jobs · {userZip || 'your area'}{nearbyZips.length > 1 ? ` + ${nearbyZips.length - 1} surrounding zips` : ''}</p>
                </div>
                {Object.keys(pricingBySystem).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
                    <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '14px' }}>No pricing data yet for your area.</p>
                    <button onClick={() => window.location.href = user ? '/dashboard' : '/signup'} style={{ background: '#C47B2B', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      {user ? 'Log a job' : 'Create account'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {Object.entries(pricingBySystem).sort((a, b) => b[1].length - a[1].length).map(([sys, prices]) => {
                      const avg = Math.round((prices as number[]).reduce((a: number, b: number) => a + b, 0) / (prices as number[]).length)
                      const maxAvg = Math.max(...Object.values(pricingBySystem).map((p: any) => Math.round(p.reduce((a: number, b: number) => a + b, 0) / p.length)))
                      return (
                        <div key={sys}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', color: '#1E3A2F', textTransform: 'capitalize' }}>{sys.replace(/_/g, ' ')}</span>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>${avg.toLocaleString()}</span>
                            <span style={{ fontSize: '11px', color: '#8A8A82' }}>· {(prices as number[]).length} job{(prices as number[]).length !== 1 ? 's' : ''}</span>
                          </div>
                          <div style={{ height: '6px', background: '#EDE8E0', borderRadius: '3px' }}>
                            <div style={{ width: `${Math.min(100, (avg / maxAvg) * 100)}%`, height: '100%', background: '#3D7A5A', borderRadius: '3px' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Should I act now */}
              <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 400, color: '#1E3A2F', marginBottom: '4px' }}>Should I act now?</h3>
                  <p style={{ fontSize: '12px', color: '#8A8A82' }}>Timing signals based on current market conditions</p>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {[
                    { project: 'Roofing', signal: 'Act now — costs still rising', color: '#9B2C2C', bg: '#FDECEA' },
                    { project: 'Windows', signal: 'Get quotes now before tariffs land', color: '#7A4A10', bg: '#FBF0DC' },
                    { project: 'Garage door', signal: 'Watch — steel tariff pressure', color: '#7A4A10', bg: '#FBF0DC' },
                    { project: 'Decking & framing', signal: 'Good time — lumber stable', color: '#3D7A5A', bg: '#EAF2EC' },
                    { project: 'Siding (fiber-cement)', signal: 'Strong ROI — 114% recouped', color: '#3D7A5A', bg: '#EAF2EC' },
                  ].map(item => (
                    <div key={item.project} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: item.bg, borderRadius: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: item.color }}>{item.project}</span>
                      <span style={{ fontSize: '11px', color: item.color, textAlign: 'right', maxWidth: '140px' }}>{item.signal}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '10px', color: '#8A8A82', marginTop: '12px', lineHeight: 1.6 }}>
                  These are general signals, not financial advice. Local conditions and contractor availability vary.
                </p>
              </div>
            </div>

            {/* Important context */}
            <div style={{ background: 'rgba(30,58,47,0.04)', border: '1px solid rgba(30,58,47,0.10)', borderRadius: '12px', padding: '16px 20px' }}>
              <p style={{ fontSize: '13px', color: '#4A4A44', lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: '#1E3A2F' }}>Important:</strong> National resale figures reflect upscale and midrange upgrades done with quality materials — not cheap like-for-like replacements or builder-grade products. A $300 garage door swap will not return 268%. These are projects done right, with quality materials, that buyers actually notice and value at resale.
              </p>
            </div>

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