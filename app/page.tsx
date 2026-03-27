'use client'

import { useState } from 'react'
import Nav from '@/components/Nav'


const PILLARS = [
  {
    icon: '📊',
    color: '#EAF2EC',
    iconColor: '#3D7A5A',
    title: 'Know exactly where your home stands',
    body: 'A live health score across every major system — system risk, maintenance history, value protection, and seasonal readiness. Not a guess. A real picture of your home\'s condition.',
    cta: 'Set up my home — free',
    href: '/signup',
    modalTitle: 'Home Health Score',
    modalContent: 'Your Home Health Score is a live 0–100 rating calculated across four dimensions: System Risk, Maintenance History, Value Protection, and Seasonal Readiness. It updates every time you log a job, add a system, or complete a task.',
    howTo: [
      'Go to My Home → Overview tab',
      'Your score appears at the top of the page with a breakdown by dimension',
      'Each dimension shows what\'s driving it and what to do next',
      'Click any dimension to jump to the relevant tab',
    ],
    nav: 'My Home → Overview'
  },
  {
    icon: '📋',
    color: '#FBF0DC',
    iconColor: '#C47B2B',
    title: 'Build a record that travels with your home',
    body: 'Every repair, upgrade, inspection, and maintenance task — logged in one place. When you sell, it\'s proof of care. When something breaks, you have the history. It transfers with ownership.',
    cta: 'Start logging — free',
    href: '/signup',
    modalTitle: 'Home Maintenance Log',
    modalContent: 'The log captures everything done to your home — contractor jobs, DIY work, maintenance, inspections, and upgrades. Entries are organized by type and stay permanently attached to the property, not your account.',
    howTo: [
      'Go to My Home → Log tab',
      'Click "+ Log entry" and choose the type: Upgrade, Repair, Maintenance, or Inspection',
      'Select DIY or hired a contractor — the form adapts to capture the right details',
      'Contractor jobs can be shared anonymously with the Neighbor Network',
    ],
    nav: 'My Home → Log'
  },
  {
    icon: '👥',
    color: '#E6F2F8',
    iconColor: '#3A7CA8',
    title: 'Never overpay for contractor work again',
    body: 'Real prices from real homeowners in your zip code, tied to verified logged jobs. No contractors paying for placement. No anonymous reviews. Just what people like you actually paid.',
    cta: 'Browse neighbor pricing',
    href: '/neighbors',
    modalTitle: 'Neighbor Network',
    modalContent: 'Every review in the Neighbor Network is tied to a verified logged job. Homeowners share pricing anonymously — only zip code, contractor name, system, price, and rating are visible. Your identity and address are never shown.',
    howTo: [
      'Go to Neighbor Network in the main nav',
      'Browse by system type or contractor name',
      'See what homeowners near you paid and how they rated the work',
      'To contribute: log a job in My Home → Log and toggle "Share with neighbors"',
    ],
    nav: 'Neighbor Network (top nav)'
  },
  {
    icon: '📖',
    color: '#F5EAE7',
    iconColor: '#8B3A2A',
    title: 'Guides written from inside the industry',
    body: 'Not generic home improvement content. Deep guides on every system — lifespans, failure timelines, what questions to ask, what red flags to look for — from 13 years inside manufacturing, installation, and contracting.',
    cta: 'Browse all guides',
    href: '/guides',
    modalTitle: 'Home Guides',
    modalContent: 'Hearth\'s guides are written from 13 years inside home services — manufacturing, installation, construction technology, and national-scale contracting. Each guide covers the full lifecycle of a system: materials, lifespan, failure signs, repair vs. replace, what to ask contractors, and what to avoid.',
    howTo: [
      'Go to Guides in the main nav',
      'Filter by your homeowner goal or search by system or topic',
      'Each pillar guide links to deeper cluster articles on specific questions',
      'The guides index shows recommended articles based on your saved goals',
    ],
    nav: 'Guides (top nav)'
  },
]

function PillarsSection() {
  const [activeModal, setActiveModal] = useState<number | null>(null)
  const pillar = activeModal !== null ? PILLARS[activeModal] : null

  return (
    <section style={{ padding: '80px 32px', background: '#F8F4EE' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#3D7A5A', marginBottom: '12px' }}>What Hearth gives you</div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 400, color: '#1E3A2F', lineHeight: 1.2 }}>
            The information advantage<br />your home deserves.
          </h2>
          <p style={{ fontSize: '14px', color: '#8A8A82', marginTop: '12px' }}>Click any card to learn where to find it in the platform.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {PILLARS.map((pillar, i) => (
            <div key={pillar.title} onClick={() => setActiveModal(i)} style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid rgba(30,58,47,0.08)', cursor: 'pointer', transition: 'all 0.15s ease', position: 'relative' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(30,58,47,0.10)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(30,58,47,0.18)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(30,58,47,0.08)' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: pillar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{pillar.icon}</div>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 500, color: '#1E3A2F', marginBottom: '10px', lineHeight: 1.3 }}>{pillar.title}</h3>
              <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.75, marginBottom: '20px' }}>{pillar.body}</p>
              <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: pillar.iconColor }}>Learn more →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeModal !== null && pillar && (
        <div onClick={() => setActiveModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: pillar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{pillar.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F' }}>{pillar.modalTitle}</h3>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#8A8A82', lineHeight: 1 }}>×</button>
            </div>
            <p style={{ fontSize: '14px', color: '#4A4A44', lineHeight: 1.8, marginBottom: '24px' }}>{pillar.modalContent}</p>
            <div style={{ background: '#F8F4EE', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#8A8A82', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>How to find it</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pillar.howTo.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: pillar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: pillar.iconColor, flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                    <span style={{ fontSize: '13px', color: '#1A1A18', lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setActiveModal(null)} style={{ flex: 1, background: '#F8F4EE', border: '1px solid rgba(30,58,47,0.15)', color: '#1E3A2F', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Got it</button>
              <a href={pillar.href} style={{ flex: 2, display: 'block', background: '#1E3A2F', color: '#F8F4EE', textAlign: 'center', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>{pillar.cta}</a>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default function Home() {
  return (
    <main style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F8F4EE', minHeight: '100vh', color: '#1A1A18' }}>
      <Nav />

      {/* ── HERO ── */}
      <section style={{ background: '#1E3A2F', padding: '88px 32px 96px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(196,123,43,0.14) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-80px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(106,175,138,0.08) 0%, transparent 68%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.08, color: '#F8F4EE', marginBottom: '24px', fontWeight: 400 }}>
              Your home is your<br />biggest investment.<br />
              <em style={{ color: '#C47B2B', fontStyle: 'italic' }}>Start treating it like one.</em>
            </h1>
            <p style={{ fontSize: '16px', color: 'rgba(248,244,238,0.65)', lineHeight: 1.8, marginBottom: '16px', maxWidth: '480px', fontWeight: 300 }}>
              Most homeowners have no idea what their home is really worth, what&apos;s quietly failing, or whether they&apos;re getting overcharged. Hearth fixes that — with a live health score, a complete maintenance record, and real pricing from your neighbors.
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.40)', marginBottom: '36px', fontStyle: 'italic' }}>Built by people with 13 years inside the home services industry.</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href="/signup" style={{ background: '#C47B2B', color: '#fff', padding: '14px 28px', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>Set up my home — free</a>
              <a href="/neighbors" style={{ background: 'none', border: '1px solid rgba(248,244,238,0.25)', color: 'rgba(248,244,238,0.85)', padding: '13px 26px', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}>See neighbor pricing</a>
            </div>
          </div>

          {/* Score viz — report card style */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px 28px', width: '340px' }}>
              {/* Total score */}
              <div style={{ textAlign: 'center', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(248,244,238,0.4)', marginBottom: '8px' }}>Home Health Score</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '72px', color: '#F8F4EE', fontWeight: 600, lineHeight: 1 }}>74</div>
                <div style={{ fontSize: '13px', color: '#6AAF8A', marginTop: '6px', fontWeight: 500 }}>Good shape — a few things to watch</div>
              </div>
              {/* Dimension bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Systems', score: 82, color: '#6AAF8A', pct: '35%' },
                  { label: 'Maintenance', score: 71, color: '#C47B2B', pct: '30%' },
                  { label: 'Value Protection', score: 68, color: '#3A7CA8', pct: '20%' },
                  { label: 'Seasonal Readiness', score: 55, color: 'rgba(248,244,238,0.5)', pct: '15%' },
                ].map(dim => (
                  <div key={dim.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(248,244,238,0.65)', fontWeight: 500 }}>{dim.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(248,244,238,0.35)' }}>{dim.pct} of score</span>
                        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#F8F4EE', fontWeight: 600, minWidth: '28px', textAlign: 'right' }}>{dim.score}</span>
                      </div>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                      <div style={{ width: `${dim.score}%`, height: '100%', background: dim.color, borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(248,244,238,0.3)' }}>Updates live as you log and track your home</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section style={{ padding: '80px 32px', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#9B2C2C', marginBottom: '12px' }}>The hidden cost of not knowing</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 400, color: '#1E3A2F', lineHeight: 1.2 }}>
              Most homeowners are flying blind.<br />It&apos;s expensive.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: 'rgba(30,58,47,0.08)', borderRadius: '20px', overflow: 'hidden' }}>
            {[
              { stat: '$15,000+', label: 'Average deferred maintenance cost', sub: 'when homeowners wait too long to address aging systems', color: '#9B2C2C', bg: '#FDECEA' },
              { stat: '23%', label: 'Homeowners overpay for contractor work', sub: 'because they have no idea what the job should cost in their area', color: '#7A4A10', bg: '#FBF0DC' },
              { stat: '8–12 days', label: 'Faster sales for maintained homes', sub: 'homes with documented maintenance history close faster and closer to asking price', color: '#3D7A5A', bg: '#EAF2EC' },
            ].map(s => (
              <div key={s.stat} style={{ background: s.bg, padding: '36px 28px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 600, color: s.color, marginBottom: '10px', lineHeight: 1 }}>{s.stat}</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F', marginBottom: '8px', lineHeight: 1.4 }}>{s.label}</div>
                <div style={{ fontSize: '12px', color: '#8A8A82', lineHeight: 1.6 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PillarsSection />

      {/* ── NEIGHBOR NETWORK ── */}
      <section style={{ padding: '80px 32px', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ background: '#1E3A2F', borderRadius: '20px', padding: '52px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '14px' }}>Neighbor Network</div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 34px)', color: '#F8F4EE', fontWeight: 400, marginBottom: '16px', lineHeight: 1.2 }}>
                What did your neighbor pay for their roof?
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(248,244,238,0.65)', lineHeight: 1.8, marginBottom: '12px' }}>
                Every review in Hearth is tied to a verified logged job. Homeowners share pricing anonymously — you see real numbers, real contractors, real ZIP codes.
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.40)', marginBottom: '28px', fontStyle: 'italic' }}>No contractors paying for placement. No fake reviews.</p>
              <a href="/neighbors" style={{ display: 'inline-block', background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>Browse reviews in your area</a>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {[
                { company: 'Smith Roofing Co.', system: 'Roof replacement', price: '$12,400', stars: 5, tags: ['Quality work', 'Would hire again'] },
                { company: 'Blue Ridge HVAC', system: 'HVAC replacement', price: '$8,200', stars: 4, tags: ['Fair pricing', 'On time'] },
                { company: 'Thompson Creek', system: 'Gutter replacement', price: '$3,800', stars: 5, tags: ['Clean', 'Would hire again'] },
              ].map(r => (
                <div key={r.company} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div><div style={{ fontSize: '13px', fontWeight: 500, color: '#F8F4EE' }}>{r.company}</div><div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.45)', marginTop: '2px' }}>{r.system}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '15px', fontWeight: 600, color: '#F8F4EE' }}>{r.price}</div><div style={{ fontSize: '11px', color: '#C47B2B' }}>{'★'.repeat(r.stars)}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {r.tags.map(t => <span key={t} style={{ fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '20px', background: 'rgba(106,175,138,0.2)', color: '#6AAF8A' }}>{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── GUIDES ── */}
      <section style={{ padding: '80px 32px', background: '#F8F4EE' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#3D7A5A', marginBottom: '14px' }}>Home Guides</div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 400, color: '#1E3A2F', lineHeight: 1.2, marginBottom: '16px' }}>
                Know your systems before something goes wrong.
              </h2>
              <p style={{ fontSize: '15px', color: '#4A4A44', lineHeight: 1.8, marginBottom: '28px' }}>
                Deep guides on every major home system — written from inside the industry. Lifespans, failure signs, what fair pricing looks like, questions to ask contractors, and when to repair vs. replace.
              </p>
              <a href="/guides" style={{ display: 'inline-block', background: '#1E3A2F', color: '#F8F4EE', textDecoration: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>Browse all guides</a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { icon: '🏠', name: 'Roof' },
                { icon: '❄️', name: 'HVAC' },
                { icon: '🔥', name: 'Water Heater' },
                { icon: '🪟', name: 'Windows' },
                { icon: '🪵', name: 'Siding' },
                { icon: '🌧️', name: 'Gutters' },
                { icon: '🚪', name: 'Entry Doors' },
                { icon: '🪟', name: 'Sliding Doors' },
                { icon: '🪵', name: 'Deck' },
              ].map(s => (
                <a key={s.name} href="/guides" style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.09)', borderRadius: '12px', padding: '16px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>{s.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#1E3A2F' }}>{s.name}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '80px 32px', background: '#1E3A2F', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(196,123,43,0.12) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 48px)', color: '#F8F4EE', fontWeight: 400, marginBottom: '16px', lineHeight: 1.15 }}>
            Stop guessing.<br />Start knowing.
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(248,244,238,0.60)', lineHeight: 1.75, marginBottom: '36px', maxWidth: '480px', margin: '0 auto 36px' }}>
            Set up your home in under 2 minutes. Get your health score, your maintenance record, and access to real neighbor pricing — free, forever.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" style={{ background: '#C47B2B', color: '#fff', padding: '15px 32px', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>Set up my home — free</a>
            <a href="/guides" style={{ background: 'none', border: '1px solid rgba(248,244,238,0.25)', color: 'rgba(248,244,238,0.85)', padding: '14px 28px', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', textDecoration: 'none' }}>Read the guides</a>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(248,244,238,0.30)', marginTop: '20px' }}>No credit card. No trial period. Free for homeowners.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#141E19', padding: '40px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE', marginBottom: '6px' }}>H<em style={{ color: '#C47B2B', fontStyle: 'italic' }}>e</em>arth</div>
            <p style={{ fontSize: '12px', color: 'rgba(248,244,238,0.25)' }}>Your home is your biggest investment. Treat it like one.</p>
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[{ label: 'Guides', href: '/guides' }, { label: 'Neighbor Network', href: '/neighbors' }, { label: 'About', href: '/about' }, { label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Sign up', href: '/signup' }].map(link => (
              <a key={link.label} href={link.href} style={{ fontSize: '13px', color: 'rgba(248,244,238,0.35)', textDecoration: 'none' }}>{link.label}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
