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
        padding: '72px 32px 80px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-80px', right: '-60px',
          width: '380px', height: '380px',
          background: 'radial-gradient(circle, rgba(196,123,43,0.16) 0%, transparent 68%)',
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: '620px', position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: '10px', fontWeight: 500, letterSpacing: '2px',
            textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '16px'
          }}>Homeowner Intelligence</div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(34px, 5vw, 54px)',
            lineHeight: 1.12,
            color: '#F8F4EE',
            marginBottom: '20px',
            fontWeight: 400
          }}>
            The information advantage<br />
            <em style={{ color: '#C47B2B', fontStyle: 'italic' }}>your home deserves.</em>
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(248,244,238,0.68)',
            lineHeight: 1.7,
            marginBottom: '32px',
            maxWidth: '480px',
            fontWeight: 300
          }}>
            Real pricing. Trusted contractors. Your home&apos;s health score.
            Built entirely on the homeowner&apos;s side of the table.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href="/signup" style={{
              background: '#C47B2B', color: '#fff',
              padding: '12px 24px', borderRadius: '10px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
              fontWeight: 500, textDecoration: 'none', display: 'inline-block'
            }}>Set up my home</a>
            <a href="/guides" style={{
              background: 'none', border: '1px solid rgba(248,244,238,0.25)',
              color: 'rgba(248,244,238,0.8)', padding: '11px 22px',
              borderRadius: '10px', fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', textDecoration: 'none', display: 'inline-block'
            }}>Browse guides</a>
          </div>
          <p style={{
            marginTop: '14px', fontSize: '11px',
            color: 'rgba(248,244,238,0.35)'
          }}>Free for homeowners. Always.</p>
        </div>
      </section>

      {/* Trust strip */}
      <div style={{
        background: '#EDE8E0', borderBottom: '1px solid rgba(30,58,47,0.11)',
        padding: '12px 32px', display: 'flex', gap: '28px', flexWrap: 'wrap'
      }}>
        {[
          '13 years of home services expertise',
          'Community-verified contractor data',
          'Real pricing from real homeowners',
          'Never sells your data'
        ].map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: '#4A4A44' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6AAF8A', flexShrink: 0 }} />
            {item}
          </div>
        ))}
      </div>

      {/* How it works */}
      <section style={{ padding: '56px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            fontSize: '10px', fontWeight: 500, letterSpacing: '2px',
            textTransform: 'uppercase', color: '#3D7A5A', marginBottom: '10px'
          }}>How it works</div>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 400,
            marginBottom: '32px', lineHeight: 1.2
          }}>Three steps to knowing your home</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              { n: '01', title: 'Set up your home', desc: 'Enter your address, home details, and system ages. Takes under 5 minutes.', tag: 'Free forever', href: '/signup' },
              { n: '02', title: 'Get your score', desc: 'See your home health score across 4 dimensions. Know what needs attention.', tag: 'Live score', href: '/signup' },
              { n: '03', title: 'Log jobs & share', desc: 'Record contractor work. Share anonymously to help your neighbors.', tag: 'Community', href: '/log' }
            ].map(step => (
              <a key={step.n} href={step.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff', border: '1px solid rgba(30,58,47,0.11)',
                  borderRadius: '16px', padding: '24px 20px'
                }}>
                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '32px', color: '#EAF2EC', lineHeight: 1, marginBottom: '14px'
                  }}>{step.n}</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px', color: '#1A1A18' }}>{step.title}</h3>
                  <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.6 }}>{step.desc}</p>
                  <div style={{
                    marginTop: '14px', display: 'inline-block',
                    background: '#EAF2EC', color: '#3D7A5A',
                    fontSize: '10px', fontWeight: 500, padding: '3px 9px', borderRadius: '20px'
                  }}>{step.tag}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Neighbor Network feature band */}
      <section style={{ padding: '0 32px 56px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            background: '#fff', border: '1px solid rgba(30,58,47,0.11)',
            borderRadius: '16px', padding: '36px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '28px', flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#3D7A5A', marginBottom: '10px' }}>Community</div>
              <h3 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '24px', color: '#1E3A2F', fontWeight: 400, marginBottom: '10px'
              }}>See what your neighbors paid</h3>
              <p style={{ fontSize: '13px', color: '#8A8A82', maxWidth: '400px', lineHeight: 1.7, marginBottom: '20px' }}>
                Real contractor prices from real homeowners in your area. No paid placements. No fake reviews. Just verified data from people who actually hired them.
              </p>
              <a href="/neighbors" style={{
                display: 'inline-block', background: '#1E3A2F', color: '#F8F4EE',
                textDecoration: 'none', padding: '11px 22px', borderRadius: '10px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500
              }}>Browse neighbor reviews</a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flexShrink: 0, maxWidth: '280px' }}>
              {[
                { icon: '⭐', label: 'Verified reviews', desc: 'Tied to real logged jobs' },
                { icon: '💰', label: 'Real pricing', desc: 'What they actually paid' },
                { icon: '🔒', label: 'Anonymous', desc: 'Names never shown' },
                { icon: '📍', label: 'Local', desc: 'Filter by your zip code' },
              ].map(item => (
                <div key={item.label} style={{ background: '#F8F4EE', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#8A8A82' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Systems grid */}
      <section style={{ padding: '56px 32px', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            fontSize: '10px', fontWeight: 500, letterSpacing: '2px',
            textTransform: 'uppercase', color: '#3D7A5A', marginBottom: '10px'
          }}>Home systems</div>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 400,
            marginBottom: '32px', lineHeight: 1.2
          }}>Every system. Every guide.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px' }}>
            {[
              { icon: '🏠', name: 'Roof', desc: 'Lifespan, warning signs, costs' },
              { icon: '🌡️', name: 'HVAC', desc: 'Maintenance, replacement, pricing' },
              { icon: '💧', name: 'Plumbing', desc: 'Pipe types, red flags, repairs' },
              { icon: '⚡', name: 'Electrical', desc: 'Panel age, safety, upgrades' },
              { icon: '🪟', name: 'Windows', desc: 'Seals, efficiency, replacement' },
              { icon: '🔥', name: 'Water Heater', desc: 'Lifespan, flush, replacement' },
              { icon: '🌿', name: 'Landscaping', desc: 'Drainage, grading, upkeep' },
              { icon: '🪵', name: 'Deck', desc: 'Inspection, sealing, repairs' }
            ].map(sys => (
              <a key={sys.name} href="/guides" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff', border: '1px solid rgba(30,58,47,0.11)',
                  borderTop: '3px solid #6AAF8A',
                  borderRadius: '16px', padding: '20px 16px 16px',
                  cursor: 'pointer', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '10px' }}>{sys.icon}</div>
                  <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#1A1A18' }}>{sys.name}</h4>
                  <p style={{ fontSize: '11px', color: '#8A8A82', lineHeight: 1.4 }}>{sys.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Score band */}
      <section style={{ padding: '56px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            background: '#1E3A2F', borderRadius: '16px', padding: '36px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '28px', flexWrap: 'wrap'
          }}>
            <div>
              <h3 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '24px', color: '#F8F4EE', fontWeight: 400, marginBottom: '8px'
              }}>What&apos;s your home health score?</h3>
              <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.6)', maxWidth: '360px' }}>
                A live 0–100 score across system risk, maintenance history,
                value protection, and seasonal readiness.
              </p>
              <a href="/signup" style={{
                marginTop: '20px', background: '#C47B2B', color: '#fff',
                padding: '11px 22px', borderRadius: '10px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
                fontWeight: 500, textDecoration: 'none', display: 'inline-block'
              }}>Get my score</a>
            </div>
            <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
              <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle cx="45" cy="45" r="36" fill="none" stroke="#6AAF8A" strokeWidth="8"
                  strokeDasharray="226" strokeDashoffset="57" strokeLinecap="round" />
              </svg>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '22px', color: '#F8F4EE', fontWeight: 600
              }}>74</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1E3A2F', padding: '32px', textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '18px', color: '#F8F4EE', marginBottom: '8px'
        }}>Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span></div>
        <p style={{ fontSize: '12px', color: 'rgba(248,244,238,0.4)', marginBottom: '12px' }}>
          Know your home. Own your home.
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Guides', href: '/guides' },
            { label: 'Neighbor Network', href: '/neighbors' },
            { label: 'About', href: '/about' },
            { label: 'Sign up', href: '/signup' },
          ].map(link => (
            <a key={link.label} href={link.href} style={{ fontSize: '12px', color: 'rgba(248,244,238,0.45)', textDecoration: 'none' }}>{link.label}</a>
          ))}
        </div>
      </footer>
    </main>
  )
}