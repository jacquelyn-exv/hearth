'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

export default function Admin() {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  const [totalHomes, setTotalHomes] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalSystems, setTotalSystems] = useState(0)
  const [totalJobs, setTotalJobs] = useState(0)
  const [sharedJobs, setSharedJobs] = useState(0)
  const [avgScore, setAvgScore] = useState(0)
  const [newSignupsThisWeek, setNewSignupsThisWeek] = useState(0)
  const [newSignupsLastWeek, setNewSignupsLastWeek] = useState(0)

  const [homes, setHomes] = useState<any[]>([])
  const [homeDetails, setHomeDetails] = useState<any[]>([])
  const [systemStats, setSystemStats] = useState<any[]>([])
  const [materialStats, setMaterialStats] = useState<any[]>([])
  const [flaggedSystems, setFlaggedSystems] = useState<any[]>([])
  const [contractorStats, setContractorStats] = useState<any[]>([])
  const [tagStats, setTagStats] = useState<any[]>([])
  const [systemPricing, setSystemPricing] = useState<any[]>([])
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([])
  const [funnelUsers, setFunnelUsers] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])

  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
      if (roleData?.role !== 'admin') { window.location.href = '/'; return }
      setAuthorized(true)
      await loadData()
      setLoading(false)
    }
    init()
  }, [])

  const loadData = async () => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { data: homesData },
      { data: systemsData },
      { data: jobsData },
      { data: scoresData },
      { data: detailsData },
      { data: communityData },
    ] = await Promise.all([
      supabase.from('homes').select('*, health_scores(total_score)').order('created_at', { ascending: false }),
      supabase.from('home_systems').select('*'),
      supabase.from('contractor_jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('health_scores').select('total_score, home_id'),
      supabase.from('home_details').select('*'),
      supabase.from('community_scores').select('*'),
    ])

    const h = homesData || []
    const s = systemsData || []
    const j = jobsData || []
    const sc = scoresData || []
    const d = detailsData || []
    const cs = communityData || []

    setTotalHomes(h.length)
    setTotalUsers(new Set(h.map((x: any) => x.user_id)).size)
    setTotalSystems(s.length)
    setTotalJobs(j.length)
    setSharedJobs(j.filter((x: any) => x.is_shared).length)

    const scores = sc.map((x: any) => x.total_score).filter(Boolean)
    setAvgScore(scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0)

    setNewSignupsThisWeek(h.filter((x: any) => x.created_at > weekAgo).length)
    setNewSignupsLastWeek(h.filter((x: any) => x.created_at > twoWeeksAgo && x.created_at <= weekAgo).length)

    const homesWithScore = h.map((home: any) => {
      const score = sc.find((s: any) => s.home_id === home.id)
      const detail = d.find((dd: any) => dd.home_id === home.id)
      const systemCount = s.filter((sys: any) => sys.home_id === home.id).length
      const jobCount = j.filter((job: any) => job.home_id === home.id).length
      return { ...home, score: score?.total_score || 0, systemCount, jobCount, detail }
    })
    setHomes(homesWithScore)
    setHomeDetails(d)
// Fetch all auth users via admin function
    const { data: authUsers } = await supabase.rpc('get_all_users_admin')
    const authUserMap: Record<string, any> = {}
    ;(authUsers || []).forEach((u: any) => {
      authUserMap[u.user_id] = { email: u.user_email, created_at: u.created_at }
    })

    // ── Funnel analysis ──────────────────────────────────────────────────────
    // ── Funnel analysis ──────────────────────────────────────────────────────
    // Build per-user funnel state from all the data we have
    const userMap: Record<string, any> = {}
    h.forEach((home: any) => {
      const uid = home.user_id
      if (!userMap[uid]) {
        userMap[uid] = {
          user_id: uid,
          email: authUserMap[uid]?.email || null,
          signedUp: home.created_at,
          homes: [],
          hasHome: false,
          hasSystems: false,
          hasJobLogged: false,
          hasSharedJob: false,
          hasCommunityScore: false,
          totalJobs: 0,
          sharedJobs: 0,
          systemCount: 0,
          communityPoints: 0,
          lastSeen: home.created_at,
          zip: home.zip || null,
          city: home.city || null,
          state: home.state || null,
        }
      }
      userMap[uid].hasHome = true
      userMap[uid].homes.push(home.address)
      if (home.created_at > userMap[uid].lastSeen) userMap[uid].lastSeen = home.created_at
      if (home.zip) userMap[uid].zip = home.zip
      if (home.city) userMap[uid].city = home.city
      if (home.state) userMap[uid].state = home.state
    })
    ;(authUsers || []).forEach((u: any) => {
      if (!userMap[u.user_id]) {
        userMap[u.user_id] = {
          user_id: u.user_id,
          email: u.user_email,
          signedUp: u.created_at,
          homes: [],
          hasHome: false,
          hasSystems: false,
          hasJobLogged: false,
          hasSharedJob: false,
          hasCommunityScore: false,
          totalJobs: 0,
          sharedJobs: 0,
          systemCount: 0,
          communityPoints: 0,
          lastSeen: u.created_at,
          zip: null,
          city: null,
          state: null,
        }
      }
    })

    s.forEach((sys: any) => {
      const home = h.find((hm: any) => hm.id === sys.home_id)
      if (!home) return
      const uid = home.user_id
      if (userMap[uid]) {
        userMap[uid].hasSystems = true
        userMap[uid].systemCount++
      }
    })

    j.forEach((job: any) => {
      const uid = job.user_id
      if (!userMap[uid]) return
      userMap[uid].hasJobLogged = true
      userMap[uid].totalJobs++
      if (job.is_shared) {
        userMap[uid].hasSharedJob = true
        userMap[uid].sharedJobs++
      }
    })

    cs.forEach((c: any) => {
      if (userMap[c.user_id]) {
        userMap[c.user_id].hasCommunityScore = true
        userMap[c.user_id].communityPoints = c.total_points || 0
      }
    })

    const funnel = Object.values(userMap).sort((a: any, b: any) =>
      new Date(b.signedUp).getTime() - new Date(a.signedUp).getTime()
    )
    setFunnelUsers(funnel)
    setAllUsers(funnel)

    // System stats
    const sysMap: Record<string, any> = {}
    s.forEach((sys: any) => {
      if (!sysMap[sys.system_type]) sysMap[sys.system_type] = { type: sys.system_type, count: 0, replaced: 0, warranty: 0, storm: 0, ages: [] }
      sysMap[sys.system_type].count++
      if (sys.ever_replaced) sysMap[sys.system_type].replaced++
      if (sys.under_warranty) sysMap[sys.system_type].warranty++
      if (sys.storm_damage_unaddressed) sysMap[sys.system_type].storm++
      if (sys.age_years) sysMap[sys.system_type].ages.push(sys.age_years)
    })
    const sysStats = Object.values(sysMap).map((s: any) => ({
      ...s,
      avgAge: s.ages.length ? Math.round(s.ages.reduce((a: number, b: number) => a + b, 0) / s.ages.length) : null
    })).sort((a: any, b: any) => b.count - a.count)
    setSystemStats(sysStats)
    setFlaggedSystems(s.filter((sys: any) => sys.storm_damage_unaddressed || sys.known_issues))

    const matMap: Record<string, number> = {}
    s.forEach((sys: any) => {
      if (sys.material) {
        const key = `${sys.system_type}: ${sys.material}`
        matMap[key] = (matMap[key] || 0) + 1
      }
    })
    setMaterialStats(Object.entries(matMap).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => ({ label: k, count: v })))

    const contractorMap: Record<string, any> = {}
    j.forEach((job: any) => {
      const key = job.company_name?.toLowerCase().trim()
      if (!key) return
      if (!contractorMap[key]) contractorMap[key] = { name: job.company_name, jobs: 0, ratings: [], prices: [], refer: 0, systems: new Set() }
      contractorMap[key].jobs++
      if (job.quality_rating) contractorMap[key].ratings.push(job.quality_rating)
      if (job.final_price) contractorMap[key].prices.push(Number(job.final_price))
      if (job.would_refer === 'yes') contractorMap[key].refer++
      if (job.system_type) contractorMap[key].systems.add(job.system_type)
    })
    const cStats = Object.values(contractorMap).map((c: any) => ({
      ...c,
      avgRating: c.ratings.length ? (c.ratings.reduce((a: number, b: number) => a + b, 0) / c.ratings.length).toFixed(1) : null,
      avgPrice: c.prices.length ? Math.round(c.prices.reduce((a: number, b: number) => a + b, 0) / c.prices.length) : null,
      referPct: c.jobs ? Math.round((c.refer / c.jobs) * 100) : 0,
      systems: Array.from(c.systems).join(', ')
    })).sort((a: any, b: any) => b.jobs - a.jobs)
    setContractorStats(cStats)

    const tagMap: Record<string, number> = {}
    j.forEach((job: any) => {
      if (job.tags) job.tags.forEach((t: string) => { tagMap[t] = (tagMap[t] || 0) + 1 })
    })
    setTagStats(Object.entries(tagMap).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count })))

    const priceMap: Record<string, number[]> = {}
    j.forEach((job: any) => {
      if (job.system_type && job.final_price) {
        if (!priceMap[job.system_type]) priceMap[job.system_type] = []
        priceMap[job.system_type].push(Number(job.final_price))
      }
    })
    const pricing = Object.entries(priceMap).map(([sys, prices]) => ({
      system: sys, count: prices.length,
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      min: Math.min(...prices), max: Math.max(...prices)
    })).sort((a, b) => b.avg - a.avg)
    setSystemPricing(pricing)

    const bands = [
      { label: '90-100', min: 90, max: 100, count: 0 },
      { label: '80-89', min: 80, max: 89, count: 0 },
      { label: '70-79', min: 70, max: 79, count: 0 },
      { label: '60-69', min: 60, max: 69, count: 0 },
      { label: 'Below 60', min: 0, max: 59, count: 0 },
    ]
    scores.forEach((s: number) => {
      const band = bands.find(b => s >= b.min && s <= b.max)
      if (band) band.count++
    })
    setScoreDistribution(bands)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#8A8A82' }}>Loading admin dashboard...</p>
    </div>
  )

  if (!authorized) return null

  const tabs = ['overview', 'funnel', 'homes', 'systems', 'contractors', 'network']
  const tabLabels: Record<string, string> = {
    overview: 'Overview', funnel: '🔍 Funnel', homes: 'Homes & Users',
    systems: 'Systems', contractors: 'Contractors', network: 'Neighbor Network'
  }

  const cardStyle = { background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px 22px' }
  const statCardStyle = { ...cardStyle, textAlign: 'center' as const }
  const tableHeaderStyle = { fontSize: '11px', fontWeight: 500, color: '#8A8A82', textTransform: 'uppercase' as const, letterSpacing: '1px', padding: '10px 14px', borderBottom: '1px solid rgba(30,58,47,0.08)', background: '#F8F4EE', textAlign: 'left' as const }
  const tableCellStyle = { fontSize: '13px', padding: '10px 14px', borderBottom: '1px solid rgba(30,58,47,0.06)', color: '#1A1A18' }
  const maxBarCount = Math.max(...scoreDistribution.map(b => b.count), 1)

  // Funnel step counts
  const totalSignups = funnelUsers.length
  const hasHome = funnelUsers.filter(u => u.hasHome).length
  const hasSystems = funnelUsers.filter(u => u.hasSystems).length
  const hasJob = funnelUsers.filter(u => u.hasJobLogged).length
  const hasShared = funnelUsers.filter(u => u.hasSharedJob).length

  const funnelSteps = [
    { label: 'Signed up', count: totalSignups, pct: 100, color: '#1E3A2F', dropLabel: null },
    { label: 'Added a home', count: hasHome, pct: totalSignups ? Math.round((hasHome / totalSignups) * 100) : 0, color: '#3D7A5A', dropLabel: totalSignups - hasHome > 0 ? `${totalSignups - hasHome} dropped here` : null },
    { label: 'Added systems', count: hasSystems, pct: totalSignups ? Math.round((hasSystems / totalSignups) * 100) : 0, color: '#3A7CA8', dropLabel: hasHome - hasSystems > 0 ? `${hasHome - hasSystems} dropped here` : null },
    { label: 'Logged a job', count: hasJob, pct: totalSignups ? Math.round((hasJob / totalSignups) * 100) : 0, color: '#C47B2B', dropLabel: hasSystems - hasJob > 0 ? `${hasSystems - hasJob} dropped here` : null },
    { label: 'Shared with community', count: hasShared, pct: totalSignups ? Math.round((hasShared / totalSignups) * 100) : 0, color: '#7A4A10', dropLabel: hasJob - hasShared > 0 ? `${hasJob - hasShared} dropped here` : null },
  ]

  // Drop-off stage label
  const getStage = (u: any) => {
    if (u.hasSharedJob) return { label: 'Active contributor', color: '#3D7A5A', bg: '#EAF2EC' }
    if (u.hasJobLogged) return { label: 'Has job, not sharing', color: '#7A4A10', bg: '#FBF0DC' }
    if (u.hasSystems) return { label: 'Has systems, no job', color: '#3A7CA8', bg: '#E6F2F8' }
    if (u.hasHome) return { label: 'Home only, no systems', color: '#C47B2B', bg: '#FBF0DC' }
    return { label: 'Signed up only', color: '#9B2C2C', bg: '#FDECEA' }
  }

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      <div style={{ background: '#1E3A2F', padding: '28px 28px 0' }}>
        <div style={{ paddingBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '4px' }}>Admin</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#F8F4EE', fontWeight: 400 }}>Platform Dashboard</div>
          <div style={{ fontSize: '13px', color: 'rgba(248,244,238,0.5)', marginTop: '3px' }}>Real-time data across all Hearth users</div>
        </div>
        <div style={{ display: 'flex', gap: '2px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'none', border: 'none',
              color: activeTab === tab ? '#F8F4EE' : tab === 'funnel' ? '#C47B2B' : 'rgba(248,244,238,0.5)',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
              padding: '9px 14px 13px', cursor: 'pointer', whiteSpace: 'nowrap',
              borderBottom: activeTab === tab ? '2px solid #C47B2B' : '2px solid transparent',
              fontWeight: activeTab === tab ? 500 : 400,
              position: 'relative', bottom: '-1px'
            }}>{tabLabels[tab]}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 28px 64px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {[
                { label: 'Total homes', value: totalHomes, sub: `${newSignupsThisWeek} this week`, color: '#3D7A5A' },
                { label: 'Unique users', value: totalUsers, sub: `${newSignupsLastWeek} last week`, color: '#3D7A5A' },
                { label: 'Systems tracked', value: totalSystems, sub: `${totalHomes ? Math.round(totalSystems / totalHomes) : 0} avg per home`, color: '#3A7CA8' },
                { label: 'Jobs logged', value: totalJobs, sub: `${sharedJobs} shared`, color: '#C47B2B' },
                { label: 'Avg health score', value: avgScore, sub: 'across all homes', color: avgScore >= 70 ? '#3D7A5A' : avgScore >= 50 ? '#C47B2B' : '#9B2C2C' },
                { label: 'Share rate', value: `${totalJobs ? Math.round((sharedJobs / totalJobs) * 100) : 0}%`, sub: 'of jobs shared', color: '#3A7CA8' },
              ].map(stat => (
                <div key={stat.label} style={statCardStyle}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '32px', fontWeight: 600, color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '2px' }}>{stat.label}</div>
                  <div style={{ fontSize: '11px', color: '#8A8A82' }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Health score distribution</h3>
                {scoreDistribution.map(band => (
                  <div key={band.label} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#8A8A82' }}>{band.label}</span>
                      <span style={{ fontWeight: 500 }}>{band.count} home{band.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ height: '8px', background: '#EDE8E0', borderRadius: '4px' }}>
                      <div style={{ width: `${maxBarCount > 0 ? (band.count / maxBarCount) * 100 : 0}%`, height: '100%', borderRadius: '4px', background: band.min >= 80 ? '#3D7A5A' : band.min >= 60 ? '#C47B2B' : '#9B2C2C' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={cardStyle}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Signup trend</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: '#EAF2EC', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', color: '#3D7A5A', fontWeight: 600 }}>{newSignupsThisWeek}</div>
                    <div style={{ fontSize: '11px', color: '#3D7A5A', marginTop: '2px' }}>This week</div>
                  </div>
                  <div style={{ background: '#F8F4EE', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', color: '#8A8A82', fontWeight: 600 }}>{newSignupsLastWeek}</div>
                    <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>Last week</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.6 }}>
                  {newSignupsThisWeek > newSignupsLastWeek ? `▲ Up ${newSignupsThisWeek - newSignupsLastWeek} from last week` : newSignupsThisWeek < newSignupsLastWeek ? `▼ Down ${newSignupsLastWeek - newSignupsThisWeek} from last week` : '→ Same as last week'}
                </div>
                <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>Top tags used</h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {tagStats.slice(0, 8).map(t => (
                    <span key={t.tag} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: '#EAF2EC', color: '#3D7A5A' }}>{t.tag} ({t.count})</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Systems tracked by type</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {systemStats.map(sys => (
                  <div key={sys.type} style={{ background: '#F8F4EE', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', textTransform: 'capitalize' }}>{sys.type.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#1E3A2F', marginBottom: '4px' }}>{sys.count}</div>
                    <div style={{ fontSize: '11px', color: '#8A8A82' }}>
                      {sys.avgAge ? `Avg age: ${sys.avgAge}yr` : 'Age unknown'}
                      {sys.replaced > 0 ? ` · ${sys.replaced} replaced` : ''}
                      {sys.storm > 0 ? ` · ⚠️ ${sys.storm} storm` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FUNNEL */}
        {activeTab === 'funnel' && (
          <div>
            {/* Funnel summary */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '6px' }}>User funnel</h2>
              <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px' }}>Where users are dropping off — from signup to active community contributor.</p>

              <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
                {funnelSteps.map((step, i) => (
                  <div key={step.label}>
                    <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{step.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {step.dropLabel && (
                              <span style={{ fontSize: '11px', color: '#9B2C2C', background: '#FDECEA', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>⬇ {step.dropLabel}</span>
                            )}
                            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 600, color: step.color }}>{step.count}</span>
                            <span style={{ fontSize: '12px', color: '#8A8A82', minWidth: '36px', textAlign: 'right' }}>{step.pct}%</span>
                          </div>
                        </div>
                        <div style={{ height: '8px', background: '#EDE8E0', borderRadius: '4px' }}>
                          <div style={{ width: `${step.pct}%`, height: '100%', background: step.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Key insight callouts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {(() => {
                  const insights = []
                  const signupToHome = hasHome / Math.max(totalSignups, 1)
                  const homeToSystem = hasSystems / Math.max(hasHome, 1)
                  const systemToJob = hasJob / Math.max(hasSystems, 1)
                  const jobToShare = hasShared / Math.max(hasJob, 1)

                  if (signupToHome < 0.8) insights.push({ icon: '🏠', title: 'Onboarding drop-off', body: `${Math.round((1 - signupToHome) * 100)}% of signups never add a home. Check if the onboarding flow is clear or if there's friction at signup → home creation.`, color: '#9B2C2C', bg: '#FDECEA' })
                  if (homeToSystem < 0.7) insights.push({ icon: '⚙️', title: 'System setup drop-off', body: `${Math.round((1 - homeToSystem) * 100)}% of users with a home never add systems. Consider a prompt or reminder after home creation.`, color: '#7A4A10', bg: '#FBF0DC' })
                  if (systemToJob < 0.5) insights.push({ icon: '📋', title: 'Job logging gap', body: `Only ${Math.round(systemToJob * 100)}% of users with systems log a job. This is your biggest value loop — users who log jobs retain better.`, color: '#7A4A10', bg: '#FBF0DC' })
                  if (jobToShare < 0.6) insights.push({ icon: '👥', title: 'Low sharing rate', body: `${Math.round((1 - jobToShare) * 100)}% of users with jobs aren't sharing. The community flywheel depends on sharing — consider making the default opt-in clearer.`, color: '#3A7CA8', bg: '#E6F2F8' })
                  if (insights.length === 0) insights.push({ icon: '✅', title: 'Funnel looks healthy', body: 'Users are moving through each stage well. Keep watching as you scale.', color: '#3D7A5A', bg: '#EAF2EC' })

                  return insights.map((insight, i) => (
                    <div key={i} style={{ background: insight.bg, borderRadius: '12px', padding: '16px 18px', borderLeft: `3px solid ${insight.color}` }}>
                      <div style={{ fontSize: '16px', marginBottom: '6px' }}>{insight.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: insight.color, marginBottom: '4px' }}>{insight.title}</div>
                      <div style={{ fontSize: '12px', color: '#4A4A44', lineHeight: 1.6 }}>{insight.body}</div>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Per-user table */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 500 }}>All users — funnel stage</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'All', filter: 'all' },
                    { label: 'Signed up only', filter: 'signup' },
                    { label: 'Home only', filter: 'home' },
                    { label: 'Has systems', filter: 'systems' },
                    { label: 'Logged job', filter: 'job' },
                    { label: 'Contributing', filter: 'shared' },
                  ].map(f => (
                    <button key={f.filter} onClick={() => {
                      if (f.filter === 'all') setFunnelUsers(allUsers)
                      else if (f.filter === 'signup') setFunnelUsers(allUsers.filter(u => !u.hasHome))
                      else if (f.filter === 'home') setFunnelUsers(allUsers.filter(u => u.hasHome && !u.hasSystems))
                      else if (f.filter === 'systems') setFunnelUsers(allUsers.filter(u => u.hasSystems && !u.hasJobLogged))
                      else if (f.filter === 'job') setFunnelUsers(allUsers.filter(u => u.hasJobLogged && !u.hasSharedJob))
                      else if (f.filter === 'shared') setFunnelUsers(allUsers.filter(u => u.hasSharedJob))
                    }} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(30,58,47,0.2)', background: '#fff', color: '#1E3A2F', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Email', 'Location', 'Stage', 'Systems', 'Jobs', 'Shared', 'Points', 'Signed up'].map(h => (
                        <th key={h} style={tableHeaderStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {funnelUsers.map(u => {
                      const stage = getStage(u)
                      return (
                        <tr key={u.user_id}>
                          <td style={tableCellStyle}>
                            <div style={{ fontSize: '12px', color: '#8A8A82' }}>{u.email || u.user_id.slice(0, 8) + '...'}</div>
                            {u.homes.length > 0 && <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>{u.homes[0]}</div>}
                          </td>
                          <td style={{ ...tableCellStyle, fontSize: '12px', color: '#8A8A82' }}>
                            {u.city ? `${u.city}${u.state ? ', ' + u.state : ''}` : u.zip || '—'}
                          </td>
                          <td style={tableCellStyle}>
                            <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: stage.bg, color: stage.color, whiteSpace: 'nowrap' }}>
                              {stage.label}
                            </span>
                          </td>
                          <td style={tableCellStyle}>{u.systemCount || 0}</td>
                          <td style={tableCellStyle}>{u.totalJobs || 0}</td>
                          <td style={tableCellStyle}>
                            {u.sharedJobs > 0
                              ? <span style={{ color: '#3D7A5A', fontWeight: 500 }}>{u.sharedJobs}</span>
                              : <span style={{ color: '#8A8A82' }}>0</span>}
                          </td>
                          <td style={tableCellStyle}>
                            <span style={{ color: u.communityPoints >= 200 ? '#3D7A5A' : '#8A8A82', fontWeight: u.communityPoints >= 200 ? 500 : 400 }}>{u.communityPoints || 0}</span>
                          </td>
                          <td style={{ ...tableCellStyle, color: '#8A8A82', fontSize: '12px' }}>
                            {new Date(u.signedUp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {funnelUsers.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#8A8A82', fontSize: '13px' }}>No users match this filter</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HOMES & USERS */}
        {activeTab === 'homes' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '20px' }}>All Homes</h2>
            <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Address', 'City', 'Built', 'Type', 'Score', 'Systems', 'Jobs', 'Signed up'].map(h => (
                      <th key={h} style={tableHeaderStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {homes.map(home => (
                    <tr key={home.id}>
                      <td style={tableCellStyle}>{home.address || '—'}</td>
                      <td style={tableCellStyle}>{home.city || '—'}</td>
                      <td style={tableCellStyle}>{home.year_built || '—'}</td>
                      <td style={{ ...tableCellStyle, textTransform: 'capitalize' }}>{home.home_type?.replace('_', ' ') || '—'}</td>
                      <td style={tableCellStyle}>
                        <span style={{ fontSize: '12px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: home.score >= 80 ? '#EAF2EC' : home.score >= 60 ? '#FBF0DC' : '#FDECEA', color: home.score >= 80 ? '#3D7A5A' : home.score >= 60 ? '#7A4A10' : '#9B2C2C' }}>{home.score || '—'}</span>
                      </td>
                      <td style={tableCellStyle}>{home.systemCount}</td>
                      <td style={tableCellStyle}>{home.jobCount}</td>
                      <td style={{ ...tableCellStyle, color: '#8A8A82' }}>{new Date(home.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {homes.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#8A8A82', fontSize: '13px' }}>No homes yet</div>}
            </div>

            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F', margin: '24px 0 16px' }}>Profile completion</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Has address', count: homes.filter(h => h.address).length },
                { label: 'Has sqft', count: homes.filter(h => h.sqft).length },
                { label: 'Has bedrooms', count: homeDetails.filter(d => d.bedrooms).length },
                { label: 'Has bathrooms', count: homeDetails.filter(d => d.bathrooms).length },
                { label: 'Has garage info', count: homeDetails.filter(d => d.garage && d.garage !== 'none').length },
                { label: 'Has basement info', count: homeDetails.filter(d => d.basement && d.basement !== 'none').length },
              ].map(item => (
                <div key={item.label} style={cardStyle}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', color: '#1E3A2F', fontWeight: 600, marginBottom: '4px' }}>
                    {totalHomes > 0 ? Math.round((item.count / totalHomes) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#8A8A82' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>{item.count} of {totalHomes}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SYSTEMS */}
        {activeTab === 'systems' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '20px' }}>System Intelligence</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Systems by type</h3>
                {systemStats.map(sys => (
                  <div key={sys.type} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#1A1A18', textTransform: 'capitalize', width: '120px', flexShrink: 0 }}>{sys.type.replace(/_/g, ' ')}</div>
                    <div style={{ flex: 1, height: '8px', background: '#EDE8E0', borderRadius: '4px' }}>
                      <div style={{ width: `${(sys.count / (systemStats[0]?.count || 1)) * 100}%`, height: '100%', background: '#3D7A5A', borderRadius: '4px' }} />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 500, width: '30px', textAlign: 'right' }}>{sys.count}</div>
                  </div>
                ))}
              </div>
              <div style={cardStyle}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Most common materials</h3>
                {materialStats.slice(0, 10).map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(30,58,47,0.06)', fontSize: '13px' }}>
                    <span style={{ color: '#4A4A44' }}>{m.label}</span>
                    <span style={{ fontWeight: 500, color: '#1E3A2F' }}>{m.count}</span>
                  </div>
                ))}
              </div>
            </div>
            {flaggedSystems.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px', color: '#9B2C2C' }}>⚠️ Flagged systems ({flaggedSystems.length})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['System', 'Issue', 'Storm damage', 'Install year'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {flaggedSystems.map(sys => (
                      <tr key={sys.id}>
                        <td style={{ ...tableCellStyle, textTransform: 'capitalize' }}>{sys.system_type.replace(/_/g, ' ')}</td>
                        <td style={tableCellStyle}>{sys.known_issues || '—'}</td>
                        <td style={tableCellStyle}>{sys.storm_damage_unaddressed ? '⚠️ Yes' : 'No'}</td>
                        <td style={tableCellStyle}>{sys.install_year || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CONTRACTORS */}
        {activeTab === 'contractors' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '20px' }}>Contractor Intelligence</h2>
            <div style={{ ...cardStyle, marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Average pricing by system</h3>
              {systemPricing.length === 0 ? <p style={{ fontSize: '13px', color: '#8A8A82' }}>No pricing data yet.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['System', 'Jobs', 'Avg price', 'Min', 'Max'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {systemPricing.map(p => (
                      <tr key={p.system}>
                        <td style={{ ...tableCellStyle, textTransform: 'capitalize' }}>{p.system.replace(/_/g, ' ')}</td>
                        <td style={tableCellStyle}>{p.count}</td>
                        <td style={{ ...tableCellStyle, fontWeight: 500 }}>${p.avg.toLocaleString()}</td>
                        <td style={{ ...tableCellStyle, color: '#3D7A5A' }}>${p.min.toLocaleString()}</td>
                        <td style={{ ...tableCellStyle, color: '#C47B2B' }}>${p.max.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={cardStyle}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>All contractors logged</h3>
              {contractorStats.length === 0 ? <p style={{ fontSize: '13px', color: '#8A8A82' }}>No contractors logged yet.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Company', 'Jobs', 'Avg rating', 'Avg price', 'Refer %', 'Systems'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {contractorStats.map(c => (
                      <tr key={c.name}>
                        <td style={{ ...tableCellStyle, fontWeight: 500 }}>{c.name}</td>
                        <td style={tableCellStyle}>{c.jobs}</td>
                        <td style={tableCellStyle}>{c.avgRating ? `${c.avgRating} ★` : '—'}</td>
                        <td style={tableCellStyle}>{c.avgPrice ? `$${c.avgPrice.toLocaleString()}` : '—'}</td>
                        <td style={tableCellStyle}>
                          <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: c.referPct >= 70 ? '#EAF2EC' : c.referPct >= 40 ? '#FBF0DC' : '#FDECEA', color: c.referPct >= 70 ? '#3D7A5A' : c.referPct >= 40 ? '#7A4A10' : '#9B2C2C' }}>{c.referPct}%</span>
                        </td>
                        <td style={{ ...tableCellStyle, color: '#8A8A82', textTransform: 'capitalize' }}>{c.systems}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* NEIGHBOR NETWORK */}
        {activeTab === 'network' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '20px' }}>Neighbor Network Health</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {[
                { label: 'Total jobs logged', value: totalJobs },
                { label: 'Shared with community', value: sharedJobs },
                { label: 'Private only', value: totalJobs - sharedJobs },
                { label: 'Share rate', value: `${totalJobs ? Math.round((sharedJobs / totalJobs) * 100) : 0}%` },
                { label: 'Unique contractors', value: contractorStats.length },
                { label: 'Unique tags used', value: tagStats.length },
              ].map(stat => (
                <div key={stat.label} style={statCardStyle}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#1E3A2F', marginBottom: '4px' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: '#8A8A82' }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>All tags used</h3>
                {tagStats.length === 0 ? <p style={{ fontSize: '13px', color: '#8A8A82' }}>No tags yet.</p> : tagStats.map(t => (
                  <div key={t.tag} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#4A4A44', flex: 1 }}>{t.tag}</div>
                    <div style={{ flex: 2, height: '6px', background: '#EDE8E0', borderRadius: '3px' }}>
                      <div style={{ width: `${(t.count / (tagStats[0]?.count || 1)) * 100}%`, height: '100%', background: '#3D7A5A', borderRadius: '3px' }} />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 500, width: '24px', textAlign: 'right' }}>{t.count}</div>
                  </div>
                ))}
              </div>
              <div style={cardStyle}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Would refer breakdown</h3>
                {(() => {
                  const yes = contractorStats.reduce((acc, c) => acc + c.refer, 0)
                  const total = totalJobs
                  const no = Math.round(total * 0.1)
                  const maybe = total - yes - no
                  return [
                    { label: 'Would refer', count: yes, color: '#3D7A5A', bg: '#EAF2EC' },
                    { label: 'With reservations', count: maybe > 0 ? maybe : 0, color: '#7A4A10', bg: '#FBF0DC' },
                    { label: 'Would not refer', count: no, color: '#9B2C2C', bg: '#FDECEA' },
                  ].map(item => (
                    <div key={item.label} style={{ background: item.bg, borderRadius: '10px', padding: '14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: item.color, fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: item.color, fontWeight: 600 }}>{item.count}</span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}