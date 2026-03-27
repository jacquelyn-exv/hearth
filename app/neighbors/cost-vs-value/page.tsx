'use client'

import Nav from '@/components/Nav'
import { useState } from 'react'
import { COST_VS_VALUE_2025, CVV_CATEGORIES } from '@/lib/costVsValue'

export default function CostVsValuePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'recouped' | 'cost' | 'value'>('recouped')

  const filtered = COST_VS_VALUE_2025
    .filter(p => activeCategory === 'all' || p.category === activeCategory)
    .sort((a, b) => {
      if (sortBy === 'recouped') return b.costRecouped - a.costRecouped
      if (sortBy === 'cost') return a.jobCost - b.jobCost
      return b.resaleValue - a.resaleValue
    })

  const roiColor = (pct: number) => {
    if (pct >= 100) return { color: '#3D7A5A', bg: '#EAF2EC' }
    if (pct >= 70) return { color: '#7A4A10', bg: '#FBF0DC' }
    return { color: '#9B2C2C', bg: '#FDECEA' }
  }

  const avgRecouped = Math.round(COST_VS_VALUE_2025.reduce((a, b) => a + b.costRecouped, 0) / COST_VS_VALUE_2025.length)
  const overHundred = COST_VS_VALUE_2025.filter(p => p.costRecouped >= 100).length

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      <div style={{ background: '#1E3A2F', padding: '64px 32px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(196,123,43,0.12) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '12px' }}>Neighbor Network</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 400, color: '#F8F4EE', lineHeight: 1.1, marginBottom: '16px' }}>
            Cost vs. Value 2025
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(248,244,238,0.65)', lineHeight: 1.75, maxWidth: '580px', fontWeight: 300, marginBottom: '8px' }}>
            What 28 common home improvement projects cost — and how much you get back when you sell.
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.35)' }}>
            2025 national averages · Source: Remodeling Cost vs. Value Report · Regional data coming soon
          </p>
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid rgba(30,58,47,0.08)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
          {[
            { label: 'Projects tracked', value: '28', sub: '2025 national data', color: '#1E3A2F' },
            { label: 'Best ROI', value: '268%', sub: 'Garage door replacement', color: '#3D7A5A' },
            { label: 'Avg cost recouped', value: `${avgRecouped}%`, sub: 'across all 28 projects', color: '#C47B2B' },
            { label: 'Projects over 100% ROI', value: String(overHundred), sub: 'pay for themselves at resale', color: '#3D7A5A' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 600, color: s.color, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '12px', color: '#8A8A82' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px 64px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[{ key: 'all', label: 'All' }, ...CVV_CATEGORIES].map(cat => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(30,58,47,0.2)', background: activeCategory === cat.key ? '#1E3A2F' : '#fff', color: activeCategory === cat.key ? '#F8F4EE' : '#1E3A2F', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{cat.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#8A8A82' }}>Sort:</span>
            {(['recouped', 'cost', 'value'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(30,58,47,0.2)', background: sortBy === s ? '#C47B2B' : '#fff', color: sortBy === s ? '#fff' : '#1E3A2F', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                {s === 'recouped' ? 'ROI %' : s === 'cost' ? 'Job cost' : 'Resale value'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Project', 'Job Cost', 'Resale Value', 'Cost Recouped'].map(h => (
                  <th key={h} style={{ fontSize: '11px', fontWeight: 500, color: '#8A8A82', textTransform: 'uppercase' as const, letterSpacing: '1px', padding: '12px 16px', borderBottom: '1px solid rgba(30,58,47,0.08)', background: '#F8F4EE', textAlign: h === 'Project' ? 'left' as const : 'right' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const roi = roiColor(p.costRecouped)
                return (
                  <tr key={p.project} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAF8' }}>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(30,58,47,0.05)', fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>{p.project}</td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(30,58,47,0.05)', fontSize: '13px', color: '#4A4A44', textAlign: 'right' as const }}>${p.jobCost.toLocaleString()}</td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(30,58,47,0.05)', fontSize: '13px', color: '#4A4A44', textAlign: 'right' as const }}>${p.resaleValue.toLocaleString()}</td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(30,58,47,0.05)', textAlign: 'right' as const }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: roi.bg, color: roi.color }}>{p.costRecouped}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: '12px', color: '#8A8A82', marginTop: '16px', lineHeight: 1.6 }}>
          National averages from the 2025 Remodeling Cost vs. Value Report. Costs and returns vary by region, scope, and market. Use as a starting point, not a guarantee.
        </p>
      </div>

      <footer style={{ background: '#1E3A2F', padding: '32px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: 'rgba(248,244,238,0.4)' }}>Hearth · Know your home. Own your home.</p>
      </footer>
    </main>
  )
}
