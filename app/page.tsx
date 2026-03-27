'use client'

import Nav from '@/components/Nav'

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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(106,175,138,0.15)', borderRadius: '20px', padding: '6px 14px', marginBottom: '28px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6AAF8A' }} />
              <span style={{ fontSize: '12px', color: '#6AAF8A', fontWeight: 500 }}>Free for homeowners</span>
            </div>
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

          {/* Score viz */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '320px', height: '320px' }}>
              <div style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(106,175,138,0.12) 0%, transparent 70%)' }} />
              <svg width="320" height="320" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="160" cy="160" r="120" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="20" />
                {(() => {
                  const r = 120, circ = 2 * Math.PI * r, gap = 4
                  const segs = [{ pct: 0.35, color: '#6AAF8A' }, { pct: 0.30, color: '#C47B2B' }, { pct: 0.20, color: '#3A7CA8' }, { pct: 0.15, color: 'rgba(248,244,238,0.35)' }]
                  let offset = 0
                  return segs.map((s, i) => { const dash = circ * s.pct - gap; const el = <circle key={i} cx="160" cy="160" r={r} fill="none" stroke={s.color} strokeWidth="20" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset} strokeLinecap="butt" />; offset += circ * s.pct; return el })
                })()}
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '64px', color: '#F8F4EE', fontWeight: 600, lineHeight: 1 }}>74</div>
                <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.5)', marginTop: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Health score</div>
              </div>
              <div style={{ position: 'absolute', top: '30px', right: '-90px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6AAF8A', flexShrink: 0 }} /><div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.7)', fontWeight: 500, whiteSpace: 'nowrap' }}>System Risk</div></div>
                <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.35)', marginLeft: '14px' }}>35% of score</div>
              </div>
              <div style={{ position: 'absolute', bottom: '60px', right: '-90px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C47B2B', flexShrink: 0 }} /><div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.7)', fontWeight: 500, whiteSpace: 'nowrap' }}>Maintenance</div></div>
                <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.35)', marginLeft: '14px' }}>30% of score</div>
              </div>
              <div style={{ position: 'absolute', bottom: '60px', left: '-100px', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}><div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.7)', fontWeight: 500, whiteSpace: 'nowrap' }}>Value Protection</div><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3A7CA8', flexShrink: 0 }} /></div>
                <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.35)', marginRight: '14px' }}>20% of score</div>
              </div>
              <div style={{ position: 'absolute', top: '30px', left: '-80px', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}><div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.7)', fontWeight: 500, whiteSpace: 'nowrap' }}>Seasonal</div><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(248,244,238,0.35)', flexShrink: 0 }} /></div>
                <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.35)', marginRight: '14px' }}>15% of score</div>
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

      {/* ── WHAT HEARTH GIVES YOU ── */}
      <section style={{ padding: '80px 32px', background: '#F8F4EE' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#3D7A5A', marginBottom: '12px' }}>What Hearth gives you</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 400, color: '#1E3A2F', lineHeight: 1.2 }}>
              The information advantage<br />your home deserves.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[
              { icon: '📊', color: '#EAF2EC', iconColor: '#3D7A5A', title: 'Know exactly where your home stands', body: 'A live health score across every major system — system risk, maintenance history, value protection, and seasonal readiness. Not a guess. A real picture of your home\'s condition.', cta: 'See how the score works', href: '/signup' },
              { icon: '📋', color: '#FBF0DC', iconColor: '#C47B2B', title: 'Build a record that travels with your home', body: 'Every repair, upgrade, inspection, and maintenance task — logged in one place. When you sell, it\'s proof of care. When something breaks, you have the history. It transfers with ownership.', cta: 'Start your home record', href: '/signup' },
              { icon: '👥', color: '#E6F2F8', iconColor: '#3A7CA8', title: 'Never overpay for contractor work again', body: 'Real prices from real homeowners in your zip code, tied to verified logged jobs. No contractors paying for placement. No anonymous reviews. Just what people like you actually paid.', cta: 'Browse neighbor pricing', href: '/neighbors' },
              { icon: '📖', color: '#F5EAE7', iconColor: '#8B3A2A', title: 'Guides written from inside the industry', body: 'Not generic home improvement content. Deep guides on every system — lifespans, failure timelines, what questions to ask, what red flags to look for — from 13 years inside manufacturing, installation, and contracting.', cta: 'Read the guides', href: '/guides' },
            ].map(pillar => (
              <div key={pillar.title} style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid rgba(30,58,47,0.08)' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: pillar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' }}>{pillar.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 500, color: '#1E3A2F', marginBottom: '10px', lineHeight: 1.3 }}>{pillar.title}</h3>
                <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.75, marginBottom: '20px' }}>{pillar.body}</p>
                <a href={pillar.href} style={{ fontSize: '13px', fontWeight: 500, color: pillar.iconColor, textDecoration: 'none' }}>{pillar.cta} →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

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
