export default function About() {
  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: '#1E3A2F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: '58px', position: 'sticky', top: 0, zIndex: 200 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '21px', color: '#F8F4EE', textDecoration: 'none' }}>
          Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
        </a>
        <a href="/signup" style={{
          background: '#C47B2B', color: '#fff', textDecoration: 'none',
          padding: '7px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500
        }}>Set up my home</a>
      </nav>

      {/* Hero */}
      <div style={{ background: '#1E3A2F', padding: '64px 32px 72px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '16px' }}>Our mission</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400, color: '#F8F4EE', lineHeight: 1.15, marginBottom: '20px' }}>
            The information advantage the industry kept for itself.
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(248,244,238,0.65)', lineHeight: 1.75, fontWeight: 300 }}>
            For decades, contractors, manufacturers, and home services companies have held all the cards. What things should cost. Which contractors cut corners. What systems are actually failing. Homeowners found out the hard way — at the worst possible time.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '56px 32px' }}>

        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 400, color: '#1E3A2F', marginBottom: '16px' }}>What Hearth is</h2>
        <p style={{ fontSize: '15px', color: '#4A4A44', lineHeight: 1.8, marginBottom: '32px' }}>
          Hearth is a homeowner intelligence platform — the first resource built entirely on the homeowner's side of the table. It combines editorial expertise from 13 years inside the home services industry with community-generated data from homeowners logging real jobs, real prices, and real contractor experiences.
        </p>

        {/* Two sources */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
          {[
            {
              title: 'Editorial expertise',
              desc: 'What to look for before hiring a contractor. What fair pricing looks like. How systems age. What red flags mean. Content built from 13 years inside manufacturing, installation, construction technology, and national-scale contracting.'
            },
            {
              title: 'Community data',
              desc: 'Real contractor reviews tied to verified logged jobs. Real pricing from real homeowners in real zip codes. Contractor reputations built by the people who actually hired them — not by contractors paying for placement.'
            }
          ].map(item => (
            <div key={item.title} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '24px 20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F', marginBottom: '10px' }}>{item.title}</h3>
              <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 400, color: '#1E3A2F', marginBottom: '16px' }}>The community flywheel</h2>
        <p style={{ fontSize: '15px', color: '#4A4A44', lineHeight: 1.8, marginBottom: '40px' }}>
          Every homeowner who logs a job contributes anonymously to the community pool. Pricing data, contractor reputation, product performance, system lifespan — all of it becomes more accurate with every entry. The platform becomes more valuable with every home added. This is Hearth's defensible moat: the community data cannot be replicated by a competitor starting from zero.
        </p>

        {/* Promise box */}
        <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '32px', marginBottom: '40px' }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F8F4EE', fontWeight: 400, marginBottom: '12px' }}>Our promise</h3>
          <p style={{ fontSize: '14px', color: 'rgba(248,244,238,0.7)', lineHeight: 1.75 }}>
            Give homeowners the information advantage the industry has always kept for itself. Every logged job, every price shared is a homeowner giving the next homeowner a better position than they had.
          </p>
        </div>

        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 400, color: '#1E3A2F', marginBottom: '16px' }}>How Hearth makes money</h2>
        <p style={{ fontSize: '15px', color: '#4A4A44', lineHeight: 1.8, marginBottom: '16px' }}>
          Hearth is free for homeowners — forever. Revenue comes from manufacturers and service providers who sponsor editorial content and targeted placements. Every sponsored placement is clearly labeled SPONSORED. Editorial content remains independent — sponsors get placement, not editorial control.
        </p>
        <p style={{ fontSize: '15px', color: '#4A4A44', lineHeight: 1.8, marginBottom: '40px' }}>
          We never sell homeowner data. We never accept payment to alter reviews or community data. The platform's value depends entirely on homeowners trusting what they read here.
        </p>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 400, color: '#1E3A2F', marginBottom: '12px' }}>Know your home. Own your home.</h3>
          <p style={{ fontSize: '14px', color: '#8A8A82', marginBottom: '24px' }}>Set up your home profile in under 5 minutes. Free forever.</p>
          <a href="/signup" style={{
            display: 'inline-block', background: '#C47B2B', color: '#fff',
            textDecoration: 'none', padding: '13px 28px', borderRadius: '10px',
            fontSize: '14px', fontWeight: 500
          }}>Get started</a>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#1E3A2F', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#F8F4EE', marginBottom: '8px' }}>
          Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(248,244,238,0.4)' }}>Know your home. Own your home.</p>
      </footer>
    </main>
  )
}