'use client'

import { useState } from 'react'
import { CVV_ALL_YEARS, CVV_TREND_PROJECTS, MATERIAL_NOTES, getProjectTrend } from '@/lib/costVsValue'

const COLORS = [
  '#3D7A5A', '#C47B2B', '#3A7CA8', '#9B2C2C', '#7A4A8A',
  '#6AAF8A', '#E09B3D', '#5A9BC4', '#C47B7B', '#4A7A8A',
]

const YEARS = CVV_ALL_YEARS.map(y => y.year)

type Metric = 'costRecouped' | 'jobCost' | 'resaleValue'

export default function PriceTrendChart() {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([
    'Garage Door Replacement',
    'Roofing Replacement (Asphalt Shingles)',
    'Window Replacement (Vinyl)',
    'Siding Replacement (Fiber-Cement)',
  ])
  const [metric, setMetric] = useState<Metric>('costRecouped')
  const [hoveredYear, setHoveredYear] = useState<number | null>(null)

  const toggleProject = (p: string) => {
    setSelectedProjects(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : prev.length < 5 ? [...prev, p] : prev
    )
  }

  const metricLabel = metric === 'costRecouped' ? 'Cost Recouped %' : metric === 'jobCost' ? 'Job Cost ($)' : 'Resale Value ($)'

  // Build chart data
  const chartData = selectedProjects.map((project, pi) => {
    const trend = getProjectTrend(project)
    return { project, color: COLORS[pi % COLORS.length], trend }
  })

  // Get value range for scaling
  const allValues = chartData.flatMap(d =>
    d.trend.map((t: any) => metric === 'costRecouped' ? t.costRecouped : metric === 'jobCost' ? t.jobCost : t.resaleValue)
  ).filter(Boolean) as number[]
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  const W = 700
  const H = 280
  const PAD = { top: 16, right: 16, bottom: 40, left: metric === 'costRecouped' ? 44 : 72 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const xPos = (year: number) => PAD.left + ((year - YEARS[0]) / (YEARS[YEARS.length - 1] - YEARS[0])) * chartW
  const yPos = (val: number) => PAD.top + chartH - ((val - minVal) / range) * chartH

  const formatVal = (v: number) => metric === 'costRecouped' ? `${v}%` : `$${(v / 1000).toFixed(0)}k`

  return (
    <div>
      {/* Metric selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(['costRecouped', 'jobCost', 'resaleValue'] as Metric[]).map(m => (
          <button key={m} onClick={() => setMetric(m)} style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(30,58,47,0.2)', background: metric === m ? '#1E3A2F' : '#fff', color: metric === m ? '#F8F4EE' : '#1E3A2F', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
            {m === 'costRecouped' ? 'ROI %' : m === 'jobCost' ? 'Job Cost' : 'Resale Value'}
          </button>
        ))}
      </div>

      {/* Project selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {CVV_TREND_PROJECTS.map((p, pi) => {
          const idx = selectedProjects.indexOf(p)
          const isSelected = idx >= 0
          const color = isSelected ? COLORS[idx % COLORS.length] : '#8A8A82'
          return (
            <button key={p} onClick={() => toggleProject(p)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', border: `1.5px solid ${isSelected ? color : 'rgba(30,58,47,0.15)'}`, background: isSelected ? color : '#fff', color: isSelected ? '#fff' : '#8A8A82', cursor: selectedProjects.length >= 5 && !isSelected ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: selectedProjects.length >= 5 && !isSelected ? 0.5 : 1 }}>
              {p}
            </button>
          )
        })}
        <span style={{ fontSize: '11px', color: '#8A8A82', alignSelf: 'center' }}>Select up to 5</span>
      </div>

      {/* SVG Chart */}
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: '400px', fontFamily: "'DM Sans', sans-serif" }}>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = PAD.top + chartH * (1 - pct)
            const val = minVal + range * pct
            return (
              <g key={pct}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="rgba(30,58,47,0.06)" strokeWidth="1" />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#8A8A82">{formatVal(Math.round(val))}</text>
              </g>
            )
          })}

          {/* Year labels + hover zones */}
          {YEARS.map(year => {
            const x = xPos(year)
            const note = MATERIAL_NOTES[year]
            return (
              <g key={year}>
                <line x1={x} x2={x} y1={PAD.top} y2={PAD.top + chartH} stroke={hoveredYear === year ? 'rgba(30,58,47,0.15)' : 'transparent'} strokeWidth="20" />
                <text x={x} y={H - 8} textAnchor="middle" fontSize="11" fill={hoveredYear === year ? '#1E3A2F' : '#8A8A82'} fontWeight={hoveredYear === year ? '600' : '400'}>{year}</text>
                <rect x={x - 10} y={PAD.top} width="20" height={chartH + 20} fill="transparent" onMouseEnter={() => setHoveredYear(year)} onMouseLeave={() => setHoveredYear(null)} style={{ cursor: 'default' }} />
              </g>
            )
          })}

          {/* Lines + dots */}
          {chartData.map(({ project, color, trend }) => {
            const points = trend.map((t: any) => {
              const val = metric === 'costRecouped' ? t.costRecouped : metric === 'jobCost' ? t.jobCost : t.resaleValue
              return { x: xPos(t.year), y: yPos(val), val, year: t.year }
            })
            if (points.length < 2) return null
            const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
            return (
              <g key={project}>
                <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {points.map(p => (
                  <g key={p.year}>
                    <circle cx={p.x} cy={p.y} r={hoveredYear === p.year ? 6 : 4} fill={color} stroke="#fff" strokeWidth="2" />
                    {hoveredYear === p.year && (
                      <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fill={color} fontWeight="600">{formatVal(p.val)}</text>
                    )}
                  </g>
                ))}
              </g>
            )
          })}
        </svg>

        {/* Hovered year context */}
        {hoveredYear && MATERIAL_NOTES[hoveredYear] && (
          <div style={{ marginTop: '12px', padding: '12px 16px', background: '#F8F4EE', borderRadius: '10px', borderLeft: '3px solid #C47B2B' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#C47B2B', marginBottom: '3px' }}>{hoveredYear} — {MATERIAL_NOTES[hoveredYear].headline}</div>
            <div style={{ fontSize: '12px', color: '#4A4A44', lineHeight: 1.6 }}>{MATERIAL_NOTES[hoveredYear].detail}</div>
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
          {chartData.map(({ project, color }) => (
            <div key={project} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '3px', background: color, borderRadius: '2px' }} />
              <span style={{ fontSize: '11px', color: '#4A4A44' }}>{project}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: '11px', color: '#8A8A82', marginTop: '10px', lineHeight: 1.6 }}>
        Data from the Remodeling Cost vs. Value Report 2019–2025 (costvsvalue.com). © Zonda Media. Material context sourced from NAHB, BLS Producer Price Index, and industry reports.
      </p>
    </div>
  )
}
