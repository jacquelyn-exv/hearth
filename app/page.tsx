'use client'

import Nav from '@/components/Nav'

export default function Home() {
  return (
    <main style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: '#F8F4EE',
      minHeight: '100vh',
      color: '#1A1A18'
    }}>
      <Nav />

      {/* Hero */}
      <section style={{
        background: '#1E3A2F',
        padding: '80px 32px 88px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-80px', right: '-60px',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(196,123,43,0.14) 0%, transparent 68%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-80px',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(106,175,138,0.08) 0%, transparent 68%)',
          pointerEvents: 'none'
        }} />

        <div className="hero-grid" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', position: 'relative', zIndex: 1 }}>

          {/* Left — copy */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(106,175,138,0.15)', borderRadius: '20px',
              padding: '6px 14px', marginBottom: '24px'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6AAF8A' }} />
              <span style={{ fontSize: '12px', color: '#6AAF8A', fontWeight: 500 }}>Free for homeowners</span>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(36px, 5vw, 58px)',
              lineHeight: 1.08,
              color: '#F8F4EE',
              marginBottom: '24px',
              fontWeight: 400
            }}>
              Your home,<br />
              <em style={{ color: '#C47B2B', fontStyle: 'italic' }}>fully understood.</em>
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'rgba(248,244,238,0.7)',
              lineHeight: 1.75,
              marginBottom: '36px',
              maxWidth: '480px',
              fontWeight: 300
            }}>
              The one place to track your home&apos;s health, find trusted contractors, see what your neighbors paid, and build a complete record of everything you&apos;ve done to your home.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href="/signup" style={{
                background: '#C47B2B', color: '#fff',
                padding: '14px 28px', borderRadius: '10px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px',
                fontWeight: 500, textDecoration: 'none', display: 'inline-block'
              }}>Set up my home</a>
              <a href="/neighbors" style={{
                background: 'none', border: '1px solid rgba(248,244,238,0.25)',
                color: 'rgba(248,244,238,0.85)', padding: '13px 26px',
                borderRadius: '10px', fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px', textDecoration: 'none', display: 'inline-block'
              }}>Browse neighbor reviews</a>
            </div>
          </div>

          {/* Right — score visualization */}
          <div className="hero-score-viz" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '320px', height: '320px' }}>

              <div style={{
                position: 'absolute', inset: '-20px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(106,175,138,0.12) 0%, transparent 70%)',
              }} />

              <svg width="320" height="320" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="160" cy="160" r="120" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="20" />
                {(() => {
                  const r = 120
                  const circ = 2 * Math.PI * r
                  const gap = 4
                  const segments = [
                    { pct: 0.35, color: '#6AAF8A' },
                    { pct: 0.30, color: '#C47B2B' },
                    { pct: 0.20, color: '#3A7CA8' },
                    { pct: 0.15, color: 'rgba(248,244,238,0.35)' },
                  ]
                  let offset = 0
                  return segments.map((seg, i) => {
                    const dash = circ * seg.pct - gap
                    const el = (
                      <circle key={i} cx="160" cy="160" r={r}
                        fill="none" stroke={seg.color} strokeWidth="20"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="butt" />
                    )
                    offset += circ * seg.pct
                    return el
                  })
                })()}
              </svg>

              {/* Center score */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '64px', color: '#F8F4EE', fontWeight: 600, lineHeight: 1 }}>74</div>
                <div style={{ fontSize: '12px', color: 'rgba(248,244,238,0.5)', marginTop: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Health score</div>
              </div>

              {/* System Risk — upper right (midpoint ~63deg) */}
              <div style={{ position: 'absolute', top: '30px', right: '-90px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6AAF8A', flexShrink: 0 }} />
                  <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.7)', fontWeight: 500, whiteSpace: 'nowrap' }}>System Risk</div>
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.35)', marginLeft: '14px' }}>35% of score</div>
              </div>

              {/* Maintenance — lower right (midpoint ~171deg) */}
              <div style={{ position: 'absolute', bottom: '60px', right: '-90px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C47B2B', flexShrink: 0 }} />
                  <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.7)', fontWeight: 500, whiteSpace: 'nowrap' }}>Maintenance</div>
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.35)', marginLeft: '14px' }}>30% of score</div>
              </div>

              {/* Value Protection — lower left (midpoint ~261deg) */}
              <div style={{ position: 'absolute', bottom: '60px', left: '-100px', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.7)', fontWeight: 500, whiteSpace: 'nowrap' }}>Value Protection</div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3A7CA8', flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.35)', marginRight: '14px' }}>20% of score</div>
              </div>

              {/* Seasonal — upper left (midpoint ~327deg) */}
              <div style={{ position: 'absolute', top: '30px', left: '-80px', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.7)', fontWeight: 500, whiteSpace: 'nowrap' }}>Seasonal</div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(248,244,238,0.35)', flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.35)', marginRight: '14px' }}>15% of score</div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars */}
      <section style={{ padding: '72px 32px', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#3D7A5A', marginBottom: '12px' }}>What Hearth does</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 400, color: '#1E3A2F', lineHeight: 1.2 }}>
              Everything your home needs.<br />In one place.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { icon: '📊', color: '#EAF2EC', iconColor: '#3D7A5A', title: 'Home Health Score', desc: 'A live score across every major system in your home — so you know exactly what needs attention and what can wait.', tag: 'Live & personalized' },
              { icon: '📋', color: '#FBF0DC', iconColor: '#C47B2B', title: 'Contractor Log', desc: 'Every job, every price, every warranty. Your home\'s complete maintenance history — organized and always there when you need it.', tag: 'Your permanent record' },
              { icon: '👥', color: '#E6F2F8', iconColor: '#3A7CA8', title: 'Neighbor Network', desc: 'Real contractor prices from real homeowners in your area. No paid placements. No fake reviews. Just verified data.', tag: 'Community-verified' },
              { icon: '📖', color: '#F5EAE7', iconColor: '#8B3A2A', title: 'Home Guides', desc: 'Expert guidance on every system — when to repair, when to replace, what things should cost. Written from years inside the industry.', tag: 'Expert editorial' },
            ].map(pillar => (
              <div key={pillar.title} style={{ background: '#F8F4EE', borderRadius: '16px', padding: '28px 24px', border: '1px solid rgba(30,58,47,0.08)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: pillar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '18px' }}>{pillar.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#1E3A2F', marginBottom: '10px' }}>{pillar.title}</h3>
                <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.7, marginBottom: '16px' }}>{pillar.desc}</p>
                <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: pillar.color, color: pillar.iconColor }}>{pillar.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '72px 32px', background: '#F8F4EE' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#3D7A5A', marginBottom: '12px' }}>Getting started</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 400, color: '#1E3A2F' }}>
              Up and running in under 2 minutes.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '32px', left: '16.6%', right: '16.6%', height: '2px', background: 'rgba(30,58,47,0.1)', zIndex: 0 }} />
            {[
              { step: '1', icon: '🏠', title: 'Tell us about your home', desc: 'Enter your address and year built. We\'ll pre-fill the rest.' },
              { step: '2', icon: '📊', title: 'Get your health score', desc: 'See your home\'s live score across all four dimensions instantly.' },
              { step: '3', icon: '📋', title: 'Build your home record', desc: 'Log jobs, track warranties, share with neighbors over time.' }
            ].map(step => (
              <div key={step.step} style={{ textAlign: 'center', padding: '0 24px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#1E3A2F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 20px', border: '4px solid #F8F4EE', boxShadow: '0 0 0 2px rgba(30,58,47,0.15)' }}>{step.icon}</div>
                <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#C47B2B', marginBottom: '8px' }}>Step {step.step}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <a href="/signup" style={{ display: 'inline-block', background: '#1E3A2F', color: '#F8F4EE', textDecoration: 'none', padding: '13px 32px', borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>Get started — it&apos;s free</a>
          </div>
        </div>
      </section>

      {/* Neighbor Network feature */}
      <section style={{ padding: '72px 32px', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ background: '#1E3A2F', borderRadius: '20px', padding: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '14px' }}>Neighbor Network</div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 34px)', color: '#F8F4EE', fontWeight: 400, marginBottom: '16px', lineHeight: 1.2 }}>
                See what your neighbors actually paid.
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(248,244,238,0.65)', lineHeight: 1.75, marginBottom: '28px' }}>
                Every review is tied to a real logged job from a verified homeowner. No contractors paying for placement. No anonymous tips. Just honest data from people in your area.
              </p>
              <a href="/neighbors" style={{ display: 'inline-block', background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>Browse reviews in your area</a>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { company: 'Smith Roofing Co.', system: 'Roof', price: '$12,400', stars: 5, tag: 'Would refer' },
                { company: 'Blue Ridge HVAC', system: 'HVAC', price: '$3,200', stars: 4, tag: 'Quality work' },
                { company: 'Thompson Creek', system: 'Gutters', price: '$5,000', stars: 5, tag: 'On time · Clean' },
              ].map(review => (
                <div key={review.company} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#F8F4EE' }}>{review.company}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.45)', marginTop: '2px' }}>{review.system}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#F8F4EE' }}>{review.price}</div>
                      <div style={{ fontSize: '12px', color: '#C47B2B' }}>{'★'.repeat(review.stars)}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: 'rgba(106,175,138,0.2)', color: '#6AAF8A' }}>{review.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Systems grid */}
      <section style={{ padding: '72px 32px', background: '#F8F4EE' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#3D7A5A', marginBottom: '12px' }}>Home guides</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 400, color: '#1E3A2F' }}>Every system. Every guide.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {[
              { icon: '🏠', name: 'Roof', desc: 'Lifespan & costs' },
              { icon: '🌡️', name: 'HVAC', desc: 'Maintenance & pricing' },
              { icon: '💧', name: 'Plumbing', desc: 'Pipes & red flags' },
              { icon: '⚡', name: 'Electrical', desc: 'Panel age & safety' },
              { icon: '🪟', name: 'Windows', desc: 'Seals & replacement' },
              { icon: '🔥', name: 'Water Heater', desc: 'Repair vs. replace' },
              { icon: '🌿', name: 'Landscaping', desc: 'Drainage & grading' },
              { icon: '🪵', name: 'Deck', desc: 'Inspection & sealing' }
            ].map(sys => (
              <a key={sys.name} href="/guides" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.09)', borderTop: '3px solid #6AAF8A', borderRadius: '14px', padding: '18px 14px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '26px', marginBottom: '8px' }}>{sys.icon}</div>
                  <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '3px', color: '#1A1A18' }}>{sys.name}</h4>
                  <p style={{ fontSize: '11px', color: '#8A8A82', lineHeight: 1.4 }}>{sys.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Score CTA */}
      <section style={{ padding: '72px 32px', background: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ background: '#1E3A2F', borderRadius: '20px', padding: '56px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(196,123,43,0.15) 0%, transparent 68%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 28px' }}>
                <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#6AAF8A" strokeWidth="10"
                    strokeDasharray="251" strokeDashoffset="63" strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#F8F4EE', fontWeight: 600 }}>74</div>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 3.5vw, 36px)', color: '#F8F4EE', fontWeight: 400, marginBottom: '14px', lineHeight: 1.2 }}>
                What&apos;s your home health score?
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(248,244,238,0.6)', maxWidth: '420px', margin: '0 auto 32px', lineHeight: 1.7 }}>
                A live 0–100 score across system risk, maintenance history, value protection, and seasonal readiness. Free for every homeowner.
              </p>
              <a href="/signup" style={{ display: 'inline-block', background: '#C47B2B', color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 500 }}>Get my score — it&apos;s free</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1E3A2F', padding: '40px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE', marginBottom: '6px' }}>
              H<em style={{ color: '#C47B2B', fontStyle: 'italic' }}>e</em>arth
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(248,244,238,0.35)' }}>Know your home. Own your home.</p>
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Guides', href: '/guides' },
              { label: 'Neighbor Network', href: '/neighbors' },
              { label: 'About', href: '/about' },
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Sign up', href: '/signup' },
            ].map(link => (
              <a key={link.label} href={link.href} style={{ fontSize: '13px', color: 'rgba(248,244,238,0.45)', textDecoration: 'none' }}>{link.label}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}