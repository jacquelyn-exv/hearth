'use client'

import { useState, useMemo, useEffect } from 'react'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import { CLUSTER_ARTICLES } from '@/lib/clusterArticles'

const GOALS = [
  { key: 'maintain', emoji: '🏡', label: 'Maintain and protect', guides: ['roof', 'hvac', 'water-heater', 'gutters', 'siding'], articles: ['how-to-inspect-your-roof-from-the-ground', 'hvac-tune-up-what-it-includes', 'how-often-clean-gutters', 'water-heater-anode-rod-replacement', 'fiber-cement-siding-maintenance'] },
  { key: 'protect_value', emoji: '🏷️', label: 'Prepare to sell', guides: ['roof', 'siding', 'windows', 'entry-doors', 'gutters'], articles: ['roof-repair-vs-replacement', 'fiber-cement-siding-maintenance', 'foggy-window-repair-or-replace', 'fiberglass-vs-steel-door', 'siding-replacement-cost'] },
  { key: 'renovate', emoji: '🔨', label: 'Renovate and improve', guides: ['windows', 'entry-doors', 'siding', 'sliding-doors', 'hvac'], articles: ['vinyl-vs-fiberglass-windows', 'fiberglass-vs-steel-door', 'james-hardie-siding-review', 'heat-pump-vs-gas-furnace', 'tankless-water-heater-pros-cons'] },
  { key: 'new_owner', emoji: '📚', label: 'New homeowner', guides: ['roof', 'hvac', 'water-heater', 'gutters', 'windows'], articles: ['how-to-inspect-your-roof-from-the-ground', 'hvac-filter-replacement-guide', 'water-heater-lifespan', 'how-often-clean-gutters', 'sliding-door-security-tips'] },
  { key: 'maximize_value', emoji: '📈', label: 'Maximize long-term value', guides: ['roof', 'hvac', 'siding', 'windows', 'water-heater'], articles: ['class-4-impact-resistant-shingles', 'double-pane-vs-triple-pane-windows', 'heat-pump-water-heater-review', 'james-hardie-siding-review', 'hvac-replacement-cost'] },
  { key: 'budget', emoji: '💰', label: 'Control maintenance costs', guides: ['hvac', 'water-heater', 'roof', 'gutters', 'siding'], articles: ['hvac-tune-up-what-it-includes', 'how-to-flush-water-heater', 'roof-repair-vs-replacement', 'how-often-clean-gutters', 'water-heater-anode-rod-replacement'] },
]

const GUIDES = [
  { slug: 'roof', title: 'Roof', description: "Materials, lifespans, failure timelines, and finding a roofer who won't upsell you.", icon: '🏠', readTime: '18 min' },
  { slug: 'siding', title: 'Siding', description: 'Every material explained, what fails and why, and how to catch water intrusion early.', icon: '🪵', readTime: '15 min' },
  { slug: 'gutters', title: 'Gutters, Fascia & Soffits', description: 'How your drainage system works and why clean gutters protect your foundation.', icon: '🌧️', readTime: '12 min' },
  { slug: 'windows', title: 'Windows', description: 'Frame materials, glazing performance, seal failure, and what the energy ratings mean.', icon: '🪟', readTime: '13 min' },
  { slug: 'entry-doors', title: 'Entry Doors', description: 'Door materials, security ratings, weatherstripping maintenance, and when to replace.', icon: '🚪', readTime: '11 min' },
  { slug: 'sliding-doors', title: 'Sliding Glass Doors', description: 'Track systems, roller maintenance, security details, and how to fix most problems yourself.', icon: '🪟', readTime: '10 min' },
  { slug: 'hvac', title: 'HVAC', description: 'System types, key components, failure timeline, and the repair vs. replace decision.', icon: '❄️', readTime: '14 min' },
  { slug: 'water-heater', title: 'Water Heater', description: 'Tank vs. tankless, maintenance that matters, and how to replace before failure.', icon: '🔥', readTime: '12 min' },
]

function GuideCard({ guide, articles, highlighted }: { guide: typeof GUIDES[0], articles: typeof CLUSTER_ARTICLES, highlighted: boolean }) {
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const guideArticles = articles.filter(a => a.parentGuide === guide.slug).slice(0, 5)

  return (
    <div
      style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid ' + (highlighted ? 'rgba(196,123,43,0.40)' : hovered ? 'rgba(196,123,43,0.20)' : 'rgba(30,58,47,0.10)'), boxShadow: highlighted ? '0 0 0 2px rgba(196,123,43,0.10)' : hovered ? '0 8px 32px rgba(30,58,47,0.08)' : '0 1px 4px rgba(30,58,47,0.04)', transition: 'all 0.2s ease', overflow: 'hidden' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <a href={'/guides/' + guide.slug} style={{ display: 'block', padding: '24px', textDecoration: 'none', color: '#1A1A18' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>{guide.icon}</span>
            {highlighted && <span style={{ fontSize: '10px', fontWeight: 600, color: '#C47B2B', background: 'rgba(196,123,43,0.10)', border: '1px solid rgba(196,123,43,0.20)', borderRadius: '20px', padding: '2px 8px', letterSpacing: '0.05em' }}>FOR YOU</span>}
          </div>
          <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '11px', color: '#8A8A82' }}>{guide.readTime}</span>
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '19px', fontWeight: 400, color: hovered ? '#C47B2B' : '#1E3A2F', marginBottom: '6px', transition: 'color 0.2s' }}>{guide.title}</h2>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', color: '#8A8A82', lineHeight: 1.6 }}>{guide.description}</p>
      </a>

      {guideArticles.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(30,58,47,0.07)', padding: '0 24px' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '12px', fontWeight: 500, color: '#8A8A82' }}
          >
            <span>{guideArticles.length} related articles</span>
            <span style={{ display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {expanded && (
            <div style={{ paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {guideArticles.map(article => (
                <a key={article.slug} href={'/guides/' + guide.slug + '/' + article.slug} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '7px 0', textDecoration: 'none' }}>
                  <span style={{ color: '#C47B2B', fontSize: '10px', flexShrink: 0, marginTop: '3px' }}>→</span>
                  <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '12px', color: '#1E3A2F', lineHeight: 1.4 }}>{article.title}</span>
                </a>
              ))}
              <a href={'/guides/' + guide.slug} style={{ display: 'inline-block', marginTop: '6px', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '12px', color: '#C47B2B', textDecoration: 'none', fontWeight: 500 }}>Read the full guide →</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function GuidesIndexPage() {
  const [search, setSearch] = useState('')
  const [activeGoals, setActiveGoals] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [savingGoals, setSavingGoals] = useState(false)
  const [goalsSaved, setGoalsSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('homeowner_goal')
          .eq('user_id', user.id)
          .single()
        if (prof?.homeowner_goal && prof.homeowner_goal.length > 0) {
          setActiveGoals(prof.homeowner_goal)
        }
      }
      setLoadingGoals(false)
    }
    load()
  }, [])

  const toggleGoal = (key: string) => {
    setActiveGoals(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key)
      if (prev.length >= 3) return prev
      return [...prev, key]
    })
    setGoalsSaved(false)
  }

  const saveGoals = async () => {
    setSavingGoals(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_profiles').upsert({ user_id: user.id, homeowner_goal: activeGoals, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      setGoalsSaved(true)
    }
    setSavingGoals(false)
  }

  const filteredGuides = useMemo(() => {
    if (!search.trim()) return GUIDES
    const q = search.toLowerCase()
    return GUIDES.filter(g => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
  }, [search])

  const filteredArticles = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return CLUSTER_ARTICLES.filter(a => a.title.toLowerCase().includes(q) || a.targetKeyword.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)).slice(0, 8)
  }, [search])

  const highlightedGuides = useMemo(() => {
    if (activeGoals.length === 0) return new Set<string>()
    const slugs = new Set<string>()
    activeGoals.forEach(gk => {
      const goal = GOALS.find(g => g.key === gk)
      goal?.guides.forEach(s => slugs.add(s))
    })
    return slugs
  }, [activeGoals])

  const recommendedArticles = useMemo(() => {
    if (activeGoals.length === 0) return []
    const slugs = new Set<string>()
    activeGoals.forEach(gk => {
      const goal = GOALS.find(g => g.key === gk)
      goal?.articles.forEach(s => slugs.add(s))
    })
    return CLUSTER_ARTICLES.filter(a => slugs.has(a.slug)).slice(0, 6)
  }, [activeGoals])

  const sortedGuides = useMemo(() => {
    if (activeGoals.length === 0) return filteredGuides
    return [...filteredGuides].sort((a, b) => {
      const aH = highlightedGuides.has(a.slug) ? 0 : 1
      const bH = highlightedGuides.has(b.slug) ? 0 : 1
      return aH - bH
    })
  }, [filteredGuides, highlightedGuides, activeGoals])

  return (
    <div style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#1A1A18' }}>
      <Nav />

      <div style={{ background: '#1E3A2F', padding: '64px 32px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(196,123,43,0.12) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-80px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(106,175,138,0.08) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 400, color: '#F8F4EE', lineHeight: 1.1, marginBottom: '16px' }}>Home Guide</h1>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '16px', color: 'rgba(248,244,238,0.65)', lineHeight: 1.7, maxWidth: '520px', fontWeight: 300, marginBottom: '32px' }}>Deep-dive guides on every major home system. Written for homeowners who want to actually understand their home.</p>

          <div style={{ position: 'relative', maxWidth: '560px', marginBottom: '32px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guides and articles..." style={{ width: '100%', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '15px', background: 'rgba(248,244,238,0.10)', border: '1px solid rgba(248,244,238,0.20)', borderRadius: '12px', padding: '14px 16px 14px 46px', color: '#F8F4EE', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '12px', color: 'rgba(248,244,238,0.45)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {loadingGoals ? 'Loading your goals...' : isLoggedIn && activeGoals.length > 0 ? 'Your goals — guides sorted for you' : 'I want to...'}
              </p>
              {isLoggedIn && activeGoals.length > 0 && !loadingGoals && (
                <button onClick={saveGoals} disabled={savingGoals} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '11px', fontWeight: 500, background: goalsSaved ? 'rgba(106,175,138,0.20)' : 'rgba(248,244,238,0.12)', color: goalsSaved ? '#6AAF8A' : 'rgba(248,244,238,0.60)', border: 'none', borderRadius: '20px', padding: '4px 12px', cursor: 'pointer' }}>
                  {goalsSaved ? '✓ Saved' : savingGoals ? 'Saving...' : 'Save goals'}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {GOALS.map(g => {
                const active = activeGoals.includes(g.key)
                const atMax = activeGoals.length >= 3 && !active
                return (
                  <button key={g.key} onClick={() => !atMax && toggleGoal(g.key)} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: active ? 600 : 400, background: active ? '#C47B2B' : 'rgba(248,244,238,0.10)', color: active ? '#ffffff' : atMax ? 'rgba(248,244,238,0.35)' : 'rgba(248,244,238,0.80)', border: active ? '1px solid #C47B2B' : '1px solid rgba(248,244,238,0.15)', borderRadius: '20px', padding: '7px 14px', cursor: atMax ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease' }}>
                    {g.emoji} {g.label}
                  </button>
                )
              })}
            </div>
            {!isLoggedIn && activeGoals.length > 0 && (
              <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '12px', color: 'rgba(248,244,238,0.40)', marginTop: '10px' }}>
                <a href="/signup" style={{ color: '#C47B2B', textDecoration: 'none', fontWeight: 500 }}>Create a free account</a> to save your goals and get personalized maintenance reminders.
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 32px' }}>

        {search.trim() && filteredArticles.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '11px', fontWeight: 600, color: '#8A8A82', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Articles matching "{search}"</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
              {filteredArticles.map(article => (
                <a key={article.slug} href={'/guides/' + article.parentGuide + '/' + article.slug} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(30,58,47,0.10)', padding: '14px 16px', textDecoration: 'none' }}>
                  <span style={{ color: '#C47B2B', fontSize: '12px', marginTop: '2px', flexShrink: 0 }}>→</span>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px', lineHeight: 1.4 }}>{article.title}</p>
                    <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '11px', color: '#8A8A82' }}>{article.parentGuide.replace(/-/g, ' ')}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {activeGoals.length > 0 && recommendedArticles.length > 0 && !search.trim() && (
          <div style={{ marginBottom: '40px', background: 'rgba(196,123,43,0.06)', border: '1px solid rgba(196,123,43,0.15)', borderRadius: '16px', padding: '24px' }}>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F', marginBottom: '16px' }}>
              Recommended for your goals
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
              {recommendedArticles.map(article => (
                <a key={article.slug} href={'/guides/' + article.parentGuide + '/' + article.slug} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#ffffff', borderRadius: '10px', border: '1px solid rgba(196,123,43,0.15)', padding: '12px 14px', textDecoration: 'none' }}>
                  <span style={{ color: '#C47B2B', fontSize: '12px', marginTop: '2px', flexShrink: 0 }}>→</span>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px', lineHeight: 1.4 }}>{article.title}</p>
                    <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '11px', color: '#8A8A82' }}>{article.parentGuide.replace(/-/g, ' ')}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '11px', fontWeight: 600, color: '#8A8A82', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {activeGoals.length > 0 ? 'Guides — sorted for your goals' : 'All guides'}
          </p>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '12px', color: '#8A8A82' }}>{sortedGuides.length} guides · 80+ articles</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {sortedGuides.map(guide => (
            <GuideCard key={guide.slug} guide={guide} articles={CLUSTER_ARTICLES} highlighted={highlightedGuides.has(guide.slug)} />
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(30,58,47,0.10)', background: '#ffffff' }}>
        <div style={{ maxWidth: '580px', margin: '0 auto', padding: '72px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>💬</div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '30px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>What do you want to learn?</h2>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', color: '#8A8A82', lineHeight: 1.7, marginBottom: '28px' }}>We write guides based on what homeowners actually ask us. Submit a question and we will add it to our content calendar.</p>
          {submitted ? (
            <div style={{ background: 'rgba(106,175,138,0.10)', border: '1px solid rgba(106,175,138,0.25)', borderRadius: '16px', padding: '40px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
              <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 500, fontSize: '16px', color: '#1E3A2F' }}>Got it — thank you!</p>
              <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', color: '#8A8A82', marginTop: '6px' }}>We will notify you when published if you left an email.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="What do you want to understand better about your home?" rows={4} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', border: '1px solid rgba(30,58,47,0.10)', borderRadius: '14px', padding: '16px', resize: 'none', background: '#F8F4EE', color: '#1A1A18', outline: 'none' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', border: '1px solid rgba(30,58,47,0.10)', borderRadius: '14px', padding: '14px 16px', background: '#F8F4EE', color: '#1A1A18', outline: 'none' }} />
              <button onClick={async () => { if (!question.trim()) return; const { data: { user } } = await supabase.auth.getUser(); await supabase.from('content_requests').insert({ question, email: email || null, user_id: user?.id || null, created_at: new Date().toISOString(), status: 'new' }); setSubmitted(true) }} disabled={!question.trim()} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', fontWeight: 500, background: question.trim() ? '#1E3A2F' : 'rgba(30,58,47,0.3)', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '16px', cursor: question.trim() ? 'pointer' : 'not-allowed' }}>Submit request</button>
              <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '12px', color: '#8A8A82', textAlign: 'center' }}>No account required. We read every submission.</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: '#1E3A2F', padding: '56px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 400, color: '#F8F4EE', marginBottom: '8px' }}>Ready to track your home?</h3>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '15px', color: 'rgba(248,244,238,0.65)', fontWeight: 300 }}>Log your systems, get smart maintenance reminders, and build a verified history — free.</p>
          </div>
          <a href="/signup" style={{ background: '#C47B2B', color: '#ffffff', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', fontWeight: 500, padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Set up my home</a>
        </div>
      </div>
    </div>
  )
}
