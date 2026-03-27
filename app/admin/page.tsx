'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

const C = {
  dark: '#1E3A2F', green: '#3D7A5A', amber: '#C47B2B', blue: '#3A7CA8',
  red: '#9B2C2C', cream: '#F8F4EE', white: '#fff',
  redBg: '#FDECEA', amberBg: '#FBF0DC', greenBg: '#EAF2EC', blueBg: '#E6F2F8',
}

const card = { background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px 22px' }
const th = { fontSize: '11px', fontWeight: 500 as const, color: '#8A8A82', textTransform: 'uppercase' as const, letterSpacing: '1px', padding: '10px 14px', borderBottom: '1px solid rgba(30,58,47,0.08)', background: '#F8F4EE', textAlign: 'left' as const }
const td = { fontSize: '13px', padding: '10px 14px', borderBottom: '1px solid rgba(30,58,47,0.06)', color: '#1A1A18' }

function StatCard({ label, value, sub, color, delta }: { label: string; value: any; sub?: string; color: string; delta?: number }) {
  return (
    <div style={{ ...card, textAlign: 'center' as const }}>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '30px', fontWeight: 600, color, marginBottom: '4px', lineHeight: 1 }}>{value}</div>
      {delta !== undefined && (
        <div style={{ fontSize: '11px', color: delta > 0 ? C.green : delta < 0 ? C.red : '#8A8A82', marginBottom: '2px', fontWeight: 500 }}>
          {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : '→ same'} vs last week
        </div>
      )}
      <div style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '2px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: '#8A8A82' }}>{sub}</div>}
    </div>
  )
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: '6px', background: '#EDE8E0', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: '3px' }} />
    </div>
  )
}

export default function Admin() {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Raw data
  const [homes, setHomes] = useState<any[]>([])
  const [homeDetails, setHomeDetails] = useState<any[]>([])
  const [systems, setSystems] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [scores, setScores] = useState<any[]>([])
  const [communityScores, setCommunityScores] = useState<any[]>([])
  const [contentRequests, setContentRequests] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [funnelUsers, setFunnelUsers] = useState<any[]>([])

  // AI insights
  const [aiInsights, setAiInsights] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiFetched, setAiFetched] = useState(false)

  const loadData = useCallback(async () => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { data: homesData },
      { data: systemsData },
      { data: jobsData },
      { data: scoresData },
      { data: detailsData },
      { data: csData },
      { data: crData },
    ] = await Promise.all([
      supabase.from('homes').select('*').order('created_at', { ascending: false }),
      supabase.from('home_systems').select('*'),
      supabase.from('contractor_jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('health_scores').select('total_score, home_id'),
      supabase.from('home_details').select('*'),
      supabase.from('community_scores').select('*'),
      supabase.from('content_requests').select('*').order('created_at', { ascending: false }),
    ])

    const h = homesData || []
    const s = systemsData || []
    const j = jobsData || []
    const sc = scoresData || []
    const d = detailsData || []
    const cs = csData || []
    const cr = crData || []

    setHomes(h.map((home: any) => {
      const score = sc.find((x: any) => x.home_id === home.id)
      const detail = d.find((x: any) => x.home_id === home.id)
      const systemCount = s.filter((x: any) => x.home_id === home.id).length
      const jobCount = j.filter((x: any) => x.home_id === home.id).length
      return { ...home, score: score?.total_score || 0, systemCount, jobCount, detail }
    }))
    setHomeDetails(d)
    setSystems(s)
    setJobs(j)
    setScores(sc)
    setCommunityScores(cs)
    setContentRequests(cr)

    // Build funnel
    const { data: authUsers } = await supabase.rpc('get_all_users_admin')
    const authMap: Record<string, any> = {}
    ;(authUsers || []).forEach((u: any) => { authMap[u.user_id] = u })

    const userMap: Record<string, any> = {}
    ;(authUsers || []).forEach((u: any) => {
      userMap[u.user_id] = {
        user_id: u.user_id, email: u.user_email, signedUp: u.created_at,
        homes: [], hasHome: false, hasSystems: false, hasJobLogged: false, hasSharedJob: false,
        totalJobs: 0, sharedJobs: 0, systemCount: 0, communityPoints: 0,
        lastSeen: u.created_at, zip: null, city: null, state: null,
      }
    })
    h.forEach((home: any) => {
      const uid = home.user_id
      if (!userMap[uid]) userMap[uid] = { user_id: uid, email: authMap[uid]?.user_email || null, signedUp: home.created_at, homes: [], hasHome: false, hasSystems: false, hasJobLogged: false, hasSharedJob: false, totalJobs: 0, sharedJobs: 0, systemCount: 0, communityPoints: 0, lastSeen: home.created_at, zip: null, city: null, state: null }
      userMap[uid].hasHome = true
      userMap[uid].homes.push(home.address)
      if (home.zip) userMap[uid].zip = home.zip
      if (home.city) userMap[uid].city = home.city
      if (home.state) userMap[uid].state = home.state
    })
    s.forEach((sys: any) => {
      const home = h.find((hm: any) => hm.id === sys.home_id)
      if (home && userMap[home.user_id]) { userMap[home.user_id].hasSystems = true; userMap[home.user_id].systemCount++ }
    })
    j.forEach((job: any) => {
      const u = userMap[job.user_id]
      if (!u) return
      u.hasJobLogged = true; u.totalJobs++
      if (job.is_shared) { u.hasSharedJob = true; u.sharedJobs++ }
    })
    cs.forEach((c: any) => { if (userMap[c.user_id]) userMap[c.user_id].communityPoints = c.total_points || 0 })

    const funnel = Object.values(userMap).sort((a: any, b: any) => new Date(b.signedUp).getTime() - new Date(a.signedUp).getTime())
    setAllUsers(funnel)
    setFunnelUsers(funnel)
  }, [])

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
  }, [loadData])

  const fetchAiInsights = async () => {
    if (aiFetched) return
    setAiLoading(true)
    setAiFetched(true)
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const totalSignups = allUsers.length
      const hasHome = allUsers.filter(u => u.hasHome).length
      const hasSystems = allUsers.filter(u => u.hasSystems).length
      const hasJob = allUsers.filter(u => u.hasJobLogged).length
      const hasShared = allUsers.filter(u => u.hasSharedJob).length
      const newThisWeek = homes.filter(h => h.created_at > weekAgo).length
      const shareRate = jobs.length ? Math.round((jobs.filter(j => j.is_shared).length / jobs.length) * 100) : 0
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + (b.total_score || 0), 0) / scores.length) : 0
      const topContentRequests = contentRequests.slice(0, 5).map((r: any) => r.question).join('; ')

      const prompt = `You are a product analytics advisor reviewing Hearth, a homeowner intelligence platform. Analyze these metrics and give exactly 3 prioritized action items. Be direct, specific, and actionable. Format as a JSON array of objects with keys: priority (1-3), title (short), action (1 sentence), urgency (high/medium/low).

Metrics:
- Total users: ${totalSignups}
- New signups this week: ${newThisWeek}
- Funnel: ${totalSignups} signed up → ${hasHome} added home (${totalSignups ? Math.round(hasHome/totalSignups*100) : 0}%) → ${hasSystems} added systems (${hasHome ? Math.round(hasSystems/hasHome*100) : 0}%) → ${hasJob} logged job (${hasSystems ? Math.round(hasJob/hasSystems*100) : 0}%) → ${hasShared} shared (${hasJob ? Math.round(hasShared/hasJob*100) : 0}%)
- Total jobs logged: ${jobs.length}, share rate: ${shareRate}%
- Avg health score: ${avgScore}
- Content requests this week: ${contentRequests.filter((r: any) => r.created_at > weekAgo).length}
- Top content requests: ${topContentRequests || 'none yet'}

Respond with ONLY valid JSON array, no markdown, no explanation.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await response.json()
      const text = data.content?.[0]?.text || '[]'
      setAiInsights(text)
    } catch (e) {
      setAiInsights('[]')
    }
    setAiLoading(false)
  }

  useEffect(() => {
    if (!loading && allUsers.length > 0 && !aiFetched) fetchAiInsights()
  }, [loading, allUsers.length])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}><p style={{ color: '#8A8A82' }}>Loading...</p></div>
  if (!authorized) return null

  // Computed metrics
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const totalHomes = homes.length
  const totalUsers = allUsers.length
  const totalJobs = jobs.length
  const sharedJobs = jobs.filter(j => j.is_shared).length
  const shareRate = totalJobs ? Math.round((sharedJobs / totalJobs) * 100) : 0
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + (b.total_score || 0), 0) / scores.length) : 0
  const newThisWeek = homes.filter(h => h.created_at > weekAgo).length
  const newLastWeek = homes.filter(h => h.created_at > twoWeeksAgo && h.created_at <= weekAgo).length
  const jobsThisWeek = jobs.filter(j => j.created_at > weekAgo).length
  const jobsLastWeek = jobs.filter(j => j.created_at > twoWeeksAgo && j.created_at <= weekAgo).length

  const totalSignups = allUsers.length
  const hasHome = allUsers.filter(u => u.hasHome).length
  const hasSystems = allUsers.filter(u => u.hasSystems).length
  const hasJob = allUsers.filter(u => u.hasJobLogged).length
  const hasShared = allUsers.filter(u => u.hasSharedJob).length

  const funnelSteps = [
    { label: 'Signed up', count: totalSignups, pct: 100, color: C.dark },
    { label: 'Added a home', count: hasHome, pct: totalSignups ? Math.round(hasHome/totalSignups*100) : 0, color: C.green, drop: totalSignups - hasHome },
    { label: 'Added systems', count: hasSystems, pct: totalSignups ? Math.round(hasSystems/totalSignups*100) : 0, color: C.blue, drop: hasHome - hasSystems },
    { label: 'Logged a job', count: hasJob, pct: totalSignups ? Math.round(hasJob/totalSignups*100) : 0, color: C.amber, drop: hasSystems - hasJob },
    { label: 'Shared with community', count: hasShared, pct: totalSignups ? Math.round(hasShared/totalSignups*100) : 0, color: '#7A4A10', drop: hasJob - hasShared },
  ]

  // System stats
  const sysMap: Record<string, any> = {}
  systems.forEach((s: any) => {
    if (!sysMap[s.system_type]) sysMap[s.system_type] = { type: s.system_type, count: 0, ages: [], storm: 0 }
    sysMap[s.system_type].count++
    if (s.age_years) sysMap[s.system_type].ages.push(s.age_years)
    if (s.storm_damage_unaddressed) sysMap[s.system_type].storm++
  })
  const sysStats = Object.values(sysMap).sort((a: any, b: any) => b.count - a.count)

  // Contractor stats
  const cMap: Record<string, any> = {}
  jobs.forEach((j: any) => {
    const k = j.company_name?.toLowerCase().trim()
    if (!k) return
    if (!cMap[k]) cMap[k] = { name: j.company_name, jobs: 0, ratings: [], prices: [], refer: 0 }
    cMap[k].jobs++
    if (j.quality_rating) cMap[k].ratings.push(j.quality_rating)
    if (j.final_price) cMap[k].prices.push(Number(j.final_price))
    if (j.would_refer === 'yes') cMap[k].refer++
  })
  const contractorStats = Object.values(cMap).map((c: any) => ({
    ...c,
    avgRating: c.ratings.length ? (c.ratings.reduce((a: number, b: number) => a + b, 0) / c.ratings.length).toFixed(1) : null,
    avgPrice: c.prices.length ? Math.round(c.prices.reduce((a: number, b: number) => a + b, 0) / c.prices.length) : null,
    referPct: c.jobs ? Math.round((c.refer / c.jobs) * 100) : 0,
  })).sort((a: any, b: any) => b.jobs - a.jobs)

  // Tag stats
  const tagMap: Record<string, number> = {}
  jobs.forEach((j: any) => { if (j.tags) j.tags.forEach((t: string) => { tagMap[t] = (tagMap[t] || 0) + 1 }) })
  const tagStats = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }))

  // Score bands
  const scoreVals = scores.map((s: any) => s.total_score).filter(Boolean)
  const scoreBands = [
    { label: '90–100', min: 90, count: scoreVals.filter((s: number) => s >= 90).length, color: C.green },
    { label: '80–89', min: 80, count: scoreVals.filter((s: number) => s >= 80 && s < 90).length, color: '#6AAF8A' },
    { label: '70–79', min: 70, count: scoreVals.filter((s: number) => s >= 70 && s < 80).length, color: C.amber },
    { label: '60–69', min: 60, count: scoreVals.filter((s: number) => s >= 60 && s < 70).length, color: '#B36B20' },
    { label: 'Below 60', min: 0, count: scoreVals.filter((s: number) => s < 60).length, color: C.red },
  ]
  const maxBand = Math.max(...scoreBands.map(b => b.count), 1)

  // Content requests
  const crMap: Record<string, number> = {}
  contentRequests.forEach((r: any) => {
    const q = r.question?.trim().toLowerCase()
    if (q) crMap[q] = (crMap[q] || 0) + 1
  })
  const topRequests = Object.entries(crMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([q, count]) => ({ question: q, count }))

  // Pricing by system
  const priceMap: Record<string, number[]> = {}
  jobs.forEach((j: any) => {
    if (j.system_type && j.final_price) {
      if (!priceMap[j.system_type]) priceMap[j.system_type] = []
      priceMap[j.system_type].push(Number(j.final_price))
    }
  })
  const systemPricing = Object.entries(priceMap).map(([sys, prices]) => ({
    system: sys, count: prices.length,
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    min: Math.min(...prices), max: Math.max(...prices)
  })).sort((a, b) => b.avg - a.avg)

  // AI insights parsed
  let parsedInsights: any[] = []
  try { parsedInsights = JSON.parse(aiInsights) } catch {}

  const getStage = (u: any) => {
    if (u.hasSharedJob) return { label: 'Active contributor', color: C.green, bg: C.greenBg }
    if (u.hasJobLogged) return { label: 'Has job, not sharing', color: '#7A4A10', bg: C.amberBg }
    if (u.hasSystems) return { label: 'Has systems, no job', color: C.blue, bg: C.blueBg }
    if (u.hasHome) return { label: 'Home only, no systems', color: C.amber, bg: C.amberBg }
    return { label: 'Signed up only', color: C.red, bg: C.redBg }
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'funnel', label: '🔍 Funnel' },
    { key: 'users', label: 'Users' },
    { key: 'community', label: 'Community' },
    { key: 'content', label: '✍️ Content' },
    { key: 'systems', label: 'Systems' },
  ]

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      <div style={{ background: C.dark, padding: '24px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.45)', marginBottom: '4px' }}>Admin</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', color: '#F8F4EE', fontWeight: 400 }}>Platform Dashboard</div>
            <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.4)', marginTop: '2px' }}>
              {totalHomes} homes · {totalUsers} users · {totalJobs} jobs logged · Last updated just now
            </div>
          </div>
          <button onClick={() => { setAiFetched(false); setAiInsights(''); fetchAiInsights() }} style={{ background: 'rgba(196,123,43,0.15)', border: '1px solid rgba(196,123,43,0.3)', color: '#C47B2B', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
            {aiLoading ? '⟳ Analyzing...' : '✦ Refresh AI insights'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '2px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background: 'none', border: 'none',
              color: activeTab === tab.key ? '#F8F4EE' : 'rgba(248,244,238,0.5)',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
              padding: '9px 14px 13px', cursor: 'pointer', whiteSpace: 'nowrap',
              borderBottom: activeTab === tab.key ? '2px solid #C47B2B' : '2px solid transparent',
              fontWeight: activeTab === tab.key ? 500 : 400,
              position: 'relative', bottom: '-1px'
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 28px 64px', maxWidth: '1280px', margin: '0 auto' }}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            {/* AI Insight strip */}
            {(aiLoading || parsedInsights.length > 0) && (
              <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '14px' }}>✦</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#C47B2B', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Priority Actions</span>
                  {aiLoading && <span style={{ fontSize: '11px', color: 'rgba(248,244,238,0.4)' }}>Analyzing your data...</span>}
                </div>
                {aiLoading ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />)}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {parsedInsights.map((ins: any, i: number) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', borderLeft: `3px solid ${ins.urgency === 'high' ? C.red : ins.urgency === 'medium' ? C.amber : C.green}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: ins.urgency === 'high' ? 'rgba(155,44,44,0.3)' : ins.urgency === 'medium' ? 'rgba(196,123,43,0.3)' : 'rgba(61,122,90,0.3)', color: ins.urgency === 'high' ? '#F87171' : ins.urgency === 'medium' ? '#FBBF24' : '#6EE7B7' }}>{ins.urgency?.toUpperCase()}</span>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#F8F4EE' }}>{ins.title}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.6)', lineHeight: 1.6 }}>{ins.action}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <StatCard label="Total homes" value={totalHomes} sub={`${newThisWeek} this week`} color={C.green} delta={newThisWeek - newLastWeek} />
              <StatCard label="Unique users" value={totalUsers} sub={`${allUsers.filter(u => u.hasHome).length} activated`} color={C.green} />
              <StatCard label="Systems tracked" value={systems.length} sub={`${totalHomes ? (systems.length / totalHomes).toFixed(1) : 0} avg/home`} color={C.blue} />
              <StatCard label="Jobs logged" value={totalJobs} sub={`${jobsThisWeek} this week`} color={C.amber} delta={jobsThisWeek - jobsLastWeek} />
              <StatCard label="Avg health score" value={avgScore || '—'} sub="across all homes" color={avgScore >= 70 ? C.green : avgScore >= 50 ? C.amber : C.red} />
              <StatCard label="Share rate" value={`${shareRate}%`} sub={`${sharedJobs} of ${totalJobs} shared`} color={shareRate >= 60 ? C.green : shareRate >= 30 ? C.amber : C.red} />
              <StatCard label="Content requests" value={contentRequests.length} sub={`${contentRequests.filter(r => r.created_at > weekAgo).length} this week`} color='#7A4A8A' />
              <StatCard label="Active contributors" value={hasShared} sub={`${totalSignups ? Math.round(hasShared/totalSignups*100) : 0}% of users`} color={C.green} />
            </div>

            {/* Funnel snapshot + score distribution */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Funnel snapshot</h3>
                <p style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '16px' }}>Step-by-step from signup to active contributor</p>
                {funnelSteps.map((step, i) => (
                  <div key={step.label} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#4A4A44' }}>{step.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(step.drop ?? 0) > 0 && i > 0 && <span style={{ fontSize: '10px', color: C.red, background: C.redBg, padding: '1px 6px', borderRadius: '10px' }}>-{step.drop}</span>}
                        <span style={{ fontSize: '13px', fontWeight: 600, color: step.color }}>{step.count}</span>
                        <span style={{ fontSize: '11px', color: '#8A8A82', width: '32px', textAlign: 'right' }}>{step.pct}%</span>
                      </div>
                    </div>
                    <Bar pct={step.pct} color={step.color} />
                  </div>
                ))}
              </div>

              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Health score distribution</h3>
                <p style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '16px' }}>How homes are scoring across the platform</p>
                {scoreBands.map(band => (
                  <div key={band.label} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#8A8A82' }}>{band.label}</span>
                      <span style={{ fontWeight: 500 }}>{band.count} home{band.count !== 1 ? 's' : ''}</span>
                    </div>
                    <Bar pct={maxBand > 0 ? (band.count / maxBand) * 100 : 0} color={band.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Signups + top tags */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Signup trend</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ background: C.greenBg, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', color: C.green, fontWeight: 600 }}>{newThisWeek}</div>
                    <div style={{ fontSize: '11px', color: C.green, marginTop: '2px' }}>This week</div>
                  </div>
                  <div style={{ background: '#F8F4EE', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', color: '#8A8A82', fontWeight: 600 }}>{newLastWeek}</div>
                    <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>Last week</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: newThisWeek > newLastWeek ? C.green : newThisWeek < newLastWeek ? C.red : '#8A8A82' }}>
                  {newThisWeek > newLastWeek ? `▲ Up ${newThisWeek - newLastWeek}` : newThisWeek < newLastWeek ? `▼ Down ${newLastWeek - newThisWeek}` : '→ Same'} from last week
                </div>
              </div>
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Top contractor tags</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {tagStats.slice(0, 8).map(t => (
                    <div key={t.tag} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, fontSize: '12px', color: '#4A4A44' }}>{t.tag}</div>
                      <Bar pct={(t.count / (tagStats[0]?.count || 1)) * 100} color={C.green} />
                      <span style={{ fontSize: '12px', fontWeight: 500, width: '20px', textAlign: 'right' }}>{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FUNNEL ── */}
        {activeTab === 'funnel' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: C.dark, marginBottom: '4px' }}>Activation funnel</h2>
              <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px' }}>From signup to active community contributor. Click a segment to filter the user table below.</p>
              <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
                {funnelSteps.map((step, i) => (
                  <div key={step.label} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: C.dark }}>{step.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {(step.drop ?? 0) > 0 && i > 0 && <span style={{ fontSize: '11px', color: C.red, background: C.redBg, padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>⬇ {step.drop} dropped</span>}
                          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: step.color }}>{step.count}</span>
                          <span style={{ fontSize: '13px', color: '#8A8A82', minWidth: '40px', textAlign: 'right' }}>{step.pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: '10px', background: '#EDE8E0', borderRadius: '5px' }}>
                        <div style={{ width: `${step.pct}%`, height: '100%', background: step.color, borderRadius: '5px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Step-level insights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {(() => {
                  const items = []
                  const s2h = hasHome / Math.max(totalSignups, 1)
                  const h2s = hasSystems / Math.max(hasHome, 1)
                  const s2j = hasJob / Math.max(hasSystems, 1)
                  const j2sh = hasShared / Math.max(hasJob, 1)
                  if (s2h < 0.8) items.push({ icon: '🏠', title: 'Onboarding friction', body: `${Math.round((1-s2h)*100)}% of signups never add a home. Audit the signup → home creation flow for friction.`, color: C.red, bg: C.redBg })
                  if (h2s < 0.7) items.push({ icon: '⚙️', title: 'System setup gap', body: `${Math.round((1-h2s)*100)}% with a home haven't added systems. A prompt post-home-creation could help.`, color: '#7A4A10', bg: C.amberBg })
                  if (s2j < 0.5) items.push({ icon: '📋', title: 'Low job logging', body: `Only ${Math.round(s2j*100)}% log a job. Job logging is your retention anchor — surface it earlier.`, color: '#7A4A10', bg: C.amberBg })
                  if (j2sh < 0.6) items.push({ icon: '👥', title: 'Sharing opt-in low', body: `${Math.round((1-j2sh)*100)}% aren't sharing. The community flywheel needs sharing — consider making opt-in more prominent.`, color: C.blue, bg: C.blueBg })
                  if (items.length === 0) items.push({ icon: '✅', title: 'Funnel healthy', body: 'All conversion rates look strong. Watch for changes as you scale.', color: C.green, bg: C.greenBg })
                  return items.map((item, i) => (
                    <div key={i} style={{ background: item.bg, borderRadius: '12px', padding: '16px', borderLeft: `3px solid ${item.color}` }}>
                      <div style={{ fontSize: '18px', marginBottom: '6px' }}>{item.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: item.color, marginBottom: '4px' }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: '#4A4A44', lineHeight: 1.6 }}>{item.body}</div>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* User table */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 500 }}>All users by funnel stage</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'All', filter: 'all' },
                    { label: 'No home', filter: 'signup' },
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
                    }} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(30,58,47,0.2)', background: '#fff', color: C.dark, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{f.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Email / Home', 'Location', 'Stage', 'Systems', 'Jobs', 'Shared', 'Signed up'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {funnelUsers.slice(0, 50).map(u => {
                      const stage = getStage(u)
                      return (
                        <tr key={u.user_id}>
                          <td style={td}>
                            <div style={{ fontSize: '12px', color: '#4A4A44' }}>{u.email || u.user_id.slice(0, 8) + '...'}</div>
                            {u.homes[0] && <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>{u.homes[0]}</div>}
                          </td>
                          <td style={{ ...td, fontSize: '12px', color: '#8A8A82' }}>{u.city ? `${u.city}${u.state ? ', ' + u.state : ''}` : u.zip || '—'}</td>
                          <td style={td}><span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: stage.bg, color: stage.color, whiteSpace: 'nowrap' }}>{stage.label}</span></td>
                          <td style={td}>{u.systemCount || 0}</td>
                          <td style={td}>{u.totalJobs || 0}</td>
                          <td style={td}><span style={{ color: u.sharedJobs > 0 ? C.green : '#8A8A82', fontWeight: u.sharedJobs > 0 ? 500 : 400 }}>{u.sharedJobs || 0}</span></td>
                          <td style={{ ...td, color: '#8A8A82', fontSize: '12px' }}>{new Date(u.signedUp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {funnelUsers.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#8A8A82', fontSize: '13px' }}>No users match</div>}
                {funnelUsers.length > 50 && <div style={{ padding: '12px 14px', fontSize: '12px', color: '#8A8A82' }}>Showing 50 of {funnelUsers.length} users</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: C.dark, marginBottom: '20px' }}>All Homes & Users</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Has address', count: homes.filter(h => h.address).length },
                { label: 'Has sqft', count: homes.filter(h => h.sqft).length },
                { label: 'Has year built', count: homes.filter(h => h.year_built).length },
                { label: 'Has bedrooms', count: homeDetails.filter(d => d.bedrooms).length },
                { label: 'Has bathrooms', count: homeDetails.filter(d => d.bathrooms).length },
                { label: 'Has goals set', count: allUsers.filter(u => u.goals?.length > 0).length },
              ].map(item => (
                <div key={item.label} style={{ ...card, textAlign: 'center' as const }}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', color: C.dark, fontWeight: 600, marginBottom: '4px' }}>{totalHomes > 0 ? Math.round((item.count / totalHomes) * 100) : 0}%</div>
                  <div style={{ fontSize: '12px', color: '#8A8A82' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>{item.count} of {totalHomes}</div>
                </div>
              ))}
            </div>
            <div style={{ ...card, overflow: 'hidden' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>All homes</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Address', 'City', 'Built', 'Type', 'Score', 'Systems', 'Jobs', 'Added'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {homes.map(home => (
                      <tr key={home.id}>
                        <td style={td}>{home.address || '—'}</td>
                        <td style={td}>{home.city || '—'}</td>
                        <td style={td}>{home.year_built || '—'}</td>
                        <td style={{ ...td, textTransform: 'capitalize' }}>{home.home_type?.replace('_', ' ') || '—'}</td>
                        <td style={td}><span style={{ fontSize: '12px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: home.score >= 80 ? C.greenBg : home.score >= 60 ? C.amberBg : C.redBg, color: home.score >= 80 ? C.green : home.score >= 60 ? '#7A4A10' : C.red }}>{home.score || '—'}</span></td>
                        <td style={td}>{home.systemCount}</td>
                        <td style={td}>{home.jobCount}</td>
                        <td style={{ ...td, color: '#8A8A82', fontSize: '12px' }}>{new Date(home.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── COMMUNITY ── */}
        {activeTab === 'community' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: C.dark, marginBottom: '20px' }}>Community & Neighbor Network</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <StatCard label="Jobs logged" value={totalJobs} sub={`${jobsThisWeek} this week`} color={C.amber} />
              <StatCard label="Shared jobs" value={sharedJobs} sub={`${shareRate}% share rate`} color={C.green} />
              <StatCard label="Private only" value={totalJobs - sharedJobs} sub="not shared" color='#8A8A82' />
              <StatCard label="Unique contractors" value={contractorStats.length} sub="across all jobs" color={C.blue} />
              <StatCard label="Active contributors" value={hasShared} sub={`${totalSignups ? Math.round(hasShared/totalSignups*100) : 0}% of users`} color={C.green} />
              <StatCard label="Unique tags" value={tagStats.length} sub="across all jobs" color='#7A4A8A' />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Pricing by system</h3>
                {systemPricing.length === 0 ? <p style={{ fontSize: '13px', color: '#8A8A82' }}>No pricing data yet.</p> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['System', 'Jobs', 'Avg', 'Min', 'Max'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {systemPricing.map(p => (
                        <tr key={p.system}>
                          <td style={{ ...td, textTransform: 'capitalize' }}>{p.system.replace(/_/g, ' ')}</td>
                          <td style={td}>{p.count}</td>
                          <td style={{ ...td, fontWeight: 500 }}>${p.avg.toLocaleString()}</td>
                          <td style={{ ...td, color: C.green }}>${p.min.toLocaleString()}</td>
                          <td style={{ ...td, color: C.amber }}>${p.max.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Tag usage</h3>
                {tagStats.map(t => (
                  <div key={t.tag} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#4A4A44', width: '140px', flexShrink: 0 }}>{t.tag}</div>
                    <div style={{ flex: 1 }}><Bar pct={(t.count / (tagStats[0]?.count || 1)) * 100} color={C.green} /></div>
                    <div style={{ fontSize: '12px', fontWeight: 500, width: '24px', textAlign: 'right' }}>{t.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>All contractors</h3>
              {contractorStats.length === 0 ? <p style={{ fontSize: '13px', color: '#8A8A82' }}>No contractors logged yet.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Company', 'Jobs', 'Avg rating', 'Avg price', 'Refer %'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {contractorStats.map(c => (
                        <tr key={c.name}>
                          <td style={{ ...td, fontWeight: 500 }}>{c.name}</td>
                          <td style={td}>{c.jobs}</td>
                          <td style={td}>{c.avgRating ? `${c.avgRating} ★` : '—'}</td>
                          <td style={td}>{c.avgPrice ? `$${c.avgPrice.toLocaleString()}` : '—'}</td>
                          <td style={td}><span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: c.referPct >= 70 ? C.greenBg : c.referPct >= 40 ? C.amberBg : C.redBg, color: c.referPct >= 70 ? C.green : c.referPct >= 40 ? '#7A4A10' : C.red }}>{c.referPct}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        {activeTab === 'content' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: C.dark, marginBottom: '4px' }}>Content Intelligence</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '20px' }}>What homeowners are asking for — use this to prioritize what to write next.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <StatCard label="Content requests" value={contentRequests.length} sub="total submitted" color='#7A4A8A' />
              <StatCard label="This week" value={contentRequests.filter(r => r.created_at > weekAgo).length} sub="new requests" color={C.amber} />
              <StatCard label="Unique topics" value={Object.keys(crMap).length} sub="distinct questions" color={C.blue} />
              <StatCard label="With email" value={contentRequests.filter(r => r.email).length} sub="can notify on publish" color={C.green} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Top requested topics</h3>
                <p style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '16px' }}>Ranked by frequency — write these first</p>
                {topRequests.length === 0 ? <p style={{ fontSize: '13px', color: '#8A8A82' }}>No content requests yet.</p> : topRequests.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(30,58,47,0.06)' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: i < 3 ? C.amberBg : '#F8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: i < 3 ? C.amber : '#8A8A82', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, fontSize: '13px', color: '#1A1A18' }}>{r.question}</div>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: r.count > 1 ? C.amberBg : '#F8F4EE', color: r.count > 1 ? C.amber : '#8A8A82' }}>{r.count}×</span>
                  </div>
                ))}
              </div>

              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Recent requests</h3>
                <p style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '16px' }}>Latest submissions — newest first</p>
                {contentRequests.length === 0 ? <p style={{ fontSize: '13px', color: '#8A8A82' }}>No requests yet.</p> : contentRequests.slice(0, 12).map((r: any, i: number) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(30,58,47,0.06)' }}>
                    <div style={{ fontSize: '13px', color: '#1A1A18', marginBottom: '2px' }}>{r.question}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {r.email && <span style={{ fontSize: '11px', color: C.green, background: C.greenBg, padding: '1px 6px', borderRadius: '8px' }}>📧 {r.email}</span>}
                      {r.related_guide && <span style={{ fontSize: '11px', color: C.blue, background: C.blueBg, padding: '1px 6px', borderRadius: '8px' }}>{r.related_guide}</span>}
                      <span style={{ fontSize: '11px', color: '#8A8A82' }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SYSTEMS ── */}
        {activeTab === 'systems' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: C.dark, marginBottom: '20px' }}>System Intelligence</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Systems by type</h3>
                {sysStats.map((s: any) => (
                  <div key={s.type} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#1A1A18', textTransform: 'capitalize', width: '130px', flexShrink: 0 }}>{s.type.replace(/_/g, ' ')}</div>
                    <div style={{ flex: 1 }}><Bar pct={(s.count / (sysStats[0]?.count || 1)) * 100} color={C.green} /></div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {s.storm > 0 && <span style={{ fontSize: '10px', color: C.red }}>⚠️{s.storm}</span>}
                      <span style={{ fontSize: '12px', fontWeight: 500, width: '28px', textAlign: 'right' }}>{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Flagged systems</h3>
                {systems.filter((s: any) => s.storm_damage_unaddressed || s.known_issues).length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#8A8A82' }}>✓ No flagged systems</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['System', 'Issue', 'Storm'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {systems.filter((s: any) => s.storm_damage_unaddressed || s.known_issues).slice(0, 10).map((s: any) => (
                        <tr key={s.id}>
                          <td style={{ ...td, textTransform: 'capitalize' }}>{s.system_type?.replace(/_/g, ' ')}</td>
                          <td style={{ ...td, fontSize: '12px', color: '#8A8A82' }}>{s.known_issues || '—'}</td>
                          <td style={td}>{s.storm_damage_unaddressed ? '⚠️' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
