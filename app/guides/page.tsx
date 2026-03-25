import Nav from '@/components/Nav'

export default function Guides() {
  const articles = [
    { system: 'Roof', category: 'roof', title: 'How to Know When Your Roof Needs Replacing', desc: 'The warning signs most homeowners miss until it\'s too late — and what a fair replacement actually costs.', readTime: '6 min read', thumb: '🏠', bg: '#F2EBE8' },
    { system: 'HVAC', category: 'hvac', title: 'The HVAC Maintenance Schedule That Actually Works', desc: 'What to do every month, every season, and every year to extend your system\'s life and avoid emergency replacements.', readTime: '5 min read', thumb: '🌡️', bg: '#FFF3E8' },
    { system: 'Plumbing', category: 'plumbing', title: 'Galvanized Pipes: What Every Homeowner Needs to Know', desc: 'If your home was built before 1970, this is the most important thing you\'ll read about your plumbing.', readTime: '7 min read', thumb: '💧', bg: '#E8F4F8' },
    { system: 'Electrical', category: 'electrical', title: 'Is Your Electrical Panel Safe? A Homeowner\'s Guide', desc: 'Panel age, warning signs, and when to upgrade — without getting oversold by an electrician.', readTime: '5 min read', thumb: '⚡', bg: '#F0EEF8' },
    { system: 'Water Heater', category: 'water_heater', title: 'Water Heater Lifespan: When to Repair vs. Replace', desc: 'The average water heater lasts 10-12 years. Here\'s how to know where yours stands.', readTime: '4 min read', thumb: '🔥', bg: '#FFF3E8' },
    { system: 'Windows', category: 'windows', title: 'How to Tell if Your Windows Are Failing (Before They Do)', desc: 'Failed seals, drafts, and condensation — what they mean and what replacement actually costs.', readTime: '4 min read', thumb: '🪟', bg: '#EEF3F8' },
    { system: 'Deck', category: 'deck', title: 'Deck Inspection: What to Check Every Spring', desc: 'A practical checklist for spotting rot, loose fasteners, and structural issues before they become expensive.', readTime: '5 min read', thumb: '🪵', bg: '#EAF2EC' },
    { system: 'Landscaping', category: 'landscaping', title: 'Grading and Drainage: The Hidden Threat to Your Foundation', desc: 'Water that flows toward your home instead of away from it is the most underrated threat in home ownership.', readTime: '6 min read', thumb: '🌿', bg: '#EAF2EC' },
  ]

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      <div style={{ background: '#1E3A2F', padding: '48px 32px 56px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '12px' }}>Editorial</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#F8F4EE', marginBottom: '12px' }}>Home system guides</h1>
          <p style={{ fontSize: '15px', color: 'rgba(248,244,238,0.6)', maxWidth: '480px', lineHeight: 1.7 }}>Practical, honest guides built from 13 years inside the home services industry. No upsells. No fluff.</p>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {articles.map(article => (
            <div key={article.title} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', background: article.bg }}>{article.thumb}</div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#3D7A5A', marginBottom: '6px' }}>{article.system}</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1A1A18', marginBottom: '8px', lineHeight: 1.35 }}>{article.title}</h3>
                <p style={{ fontSize: '12px', color: '#8A8A82', lineHeight: 1.6, marginBottom: '12px' }}>{article.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: '#8A8A82' }}>{article.readTime}</span>
                  <span style={{ fontSize: '12px', color: '#1E3A2F', fontWeight: 500 }}>Read →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ background: '#1E3A2F', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#F8F4EE', marginBottom: '8px' }}>Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span></div>
        <p style={{ fontSize: '12px', color: 'rgba(248,244,238,0.4)' }}>Know your home. Own your home.</p>
      </footer>
    </main>
  )
}