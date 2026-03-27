import React from 'react'

const T = {
  bg: '#F8F4EE',
  dark: '#1E3A2F',
  amber: '#C47B2B',
  green: '#6AAF8A',
  text: '#1A1A18',
  muted: '#8A8A82',
  border: 'rgba(30,58,47,0.10)',
  white: '#ffffff',
  red: '#9B2C2C',
  serif: "'Playfair Display', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
}

// ─── LIFESPAN TABLE ──────────────────────────────────────────

interface LifespanRow {
  material: string
  lifespan: string
  notes?: string
  quality?: 'good' | 'better' | 'best'
}

export function LifespanTable({ title, rows }: { title?: string; rows: LifespanRow[] }) {
  const qualityColor = { good: T.muted, better: T.amber, best: T.green }
  return (
    <div style={{ margin: '32px 0', borderRadius: '16px', border: `1px solid ${T.border}`, overflow: 'hidden', background: T.white }}>
      {title && (
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, background: T.bg }}>
          <p style={{ fontFamily: T.sans, fontWeight: 500, fontSize: '13px', color: T.dark }}>{title}</p>
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none' }}>
          <div>
            <span style={{ fontFamily: T.sans, fontSize: '14px', fontWeight: 500, color: T.text }}>{row.material}</span>
            {row.notes && <span style={{ fontFamily: T.sans, fontSize: '12px', color: T.muted, marginLeft: '8px' }}>{row.notes}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {row.quality && (
              <span style={{ fontFamily: T.sans, fontSize: '11px', fontWeight: 500, color: qualityColor[row.quality], textTransform: 'capitalize' }}>{row.quality}</span>
            )}
            <span style={{ fontFamily: T.sans, fontSize: '14px', fontWeight: 700, color: T.dark }}>{row.lifespan}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── FAILURE TIMELINE ────────────────────────────────────────

interface TimelineStage {
  age: string
  label: string
  description: string
  color: 'green' | 'amber' | 'orange' | 'red'
}

export function FailureTimeline({ title, stages }: { title?: string; stages: TimelineStage[] }) {
  const colorMap = {
    green: { dot: T.green, text: '#1E5C34', bg: 'rgba(106,175,138,0.08)', border: 'rgba(106,175,138,0.20)' },
    amber: { dot: T.amber, text: '#7A4A10', bg: 'rgba(196,123,43,0.08)', border: 'rgba(196,123,43,0.20)' },
    orange: { dot: '#D4722A', text: '#7A3810', bg: 'rgba(212,114,42,0.08)', border: 'rgba(212,114,42,0.20)' },
    red: { dot: T.red, text: T.red, bg: 'rgba(155,44,44,0.06)', border: 'rgba(155,44,44,0.15)' },
  }
  return (
    <div style={{ margin: '32px 0' }}>
      {title && <p style={{ fontFamily: T.sans, fontSize: '11px', fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>{title}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stages.map((stage, i) => {
          const c = colorMap[stage.color]
          return (
            <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: c.dot, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
                <span style={{ fontFamily: T.sans, color: T.white, fontWeight: 700, fontSize: '11px', textAlign: 'center', lineHeight: 1.2, padding: '0 4px' }}>{stage.age}</span>
              </div>
              <div style={{ flex: 1, background: c.bg, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '14px 18px' }}>
                <p style={{ fontFamily: T.sans, fontWeight: 600, fontSize: '14px', color: c.text, marginBottom: '4px' }}>{stage.label}</p>
                <p style={{ fontFamily: T.sans, fontSize: '13px', color: T.text, lineHeight: 1.65 }}>{stage.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── RED FLAG CHECKLIST ──────────────────────────────────────

interface RedFlag {
  flag: string
  severity?: 'watch' | 'urgent' | 'emergency'
}

export function RedFlagChecklist({ title, flags }: { title?: string; flags: RedFlag[] }) {
  const severityIcon = { watch: '👁', urgent: '⚠️', emergency: '🚨' }
  const severityColor = { watch: '#7A4A10', urgent: '#7A3810', emergency: T.red }
  return (
    <div style={{ margin: '32px 0', borderRadius: '16px', border: '1px solid rgba(155,44,44,0.15)', background: 'rgba(155,44,44,0.04)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(155,44,44,0.10)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🚩</span>
        <p style={{ fontFamily: T.sans, fontWeight: 600, fontSize: '13px', color: T.red }}>{title || 'Red flags to watch for'}</p>
      </div>
      {flags.map((flag, i) => (
        <div key={i} style={{ padding: '12px 20px', borderBottom: i < flags.length - 1 ? '1px solid rgba(155,44,44,0.08)' : 'none', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ flexShrink: 0, marginTop: '1px' }}>{flag.severity ? severityIcon[flag.severity] : '•'}</span>
          <span style={{ fontFamily: T.sans, fontSize: '13px', lineHeight: 1.6, color: flag.severity ? severityColor[flag.severity] : T.red }}>{flag.flag}</span>
        </div>
      ))}
    </div>
  )
}

// ─── CONTRACTOR QUESTIONS ────────────────────────────────────

interface ContractorQuestion {
  question: string
  whyItMatters: string
}

export function ContractorQuestions({ title, questions }: { title?: string; questions: ContractorQuestion[] }) {
  return (
    <div style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span>🔨</span>
        <h4 style={{ fontFamily: T.sans, fontWeight: 600, fontSize: '15px', color: T.dark }}>{title || 'Questions to ask your contractor'}</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {questions.map((q, i) => (
          <div key={i} style={{ background: T.white, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 18px' }}>
            <p style={{ fontFamily: T.sans, fontWeight: 500, fontSize: '14px', color: T.dark, marginBottom: '6px' }}>"{q.question}"</p>
            <p style={{ fontFamily: T.sans, fontSize: '12px', color: T.muted, lineHeight: 1.6 }}>{q.whyItMatters}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CALLOUT ─────────────────────────────────────────────────

type CalloutVariant = 'tip' | 'warning' | 'insight' | 'money'

const CALLOUT_CONFIG: Record<CalloutVariant, { icon: string; bg: string; border: string; titleColor: string; textColor: string }> = {
  tip: { icon: '💡', bg: 'rgba(58,124,168,0.07)', border: 'rgba(58,124,168,0.18)', titleColor: '#1A4A6E', textColor: '#2A5A80' },
  warning: { icon: '⚠️', bg: 'rgba(196,123,43,0.08)', border: 'rgba(196,123,43,0.20)', titleColor: '#7A4A10', textColor: '#7A4A10' },
  insight: { icon: '🔍', bg: T.bg, border: T.border, titleColor: T.dark, textColor: T.text },
  money: { icon: '💰', bg: 'rgba(106,175,138,0.08)', border: 'rgba(106,175,138,0.20)', titleColor: '#1E5C34', textColor: '#2A6040' },
}

export function Callout({ variant = 'tip', label, children }: { variant?: CalloutVariant; label?: string; children: React.ReactNode }) {
  const c = CALLOUT_CONFIG[variant]
  return (
    <div style={{ margin: '24px 0', borderRadius: '14px', border: `1px solid ${c.border}`, background: c.bg, padding: '18px 20px', display: 'flex', gap: '14px' }}>
      <span style={{ fontSize: '18px', flexShrink: 0 }}>{c.icon}</span>
      <div>
        {label && <p style={{ fontFamily: T.sans, fontWeight: 600, fontSize: '13px', color: c.titleColor, marginBottom: '6px' }}>{label}</p>}
        <div style={{ fontFamily: T.sans, fontSize: '13px', lineHeight: 1.7, color: c.textColor }}>{children}</div>
      </div>
    </div>
  )
}

// ─── STAT ROW ────────────────────────────────────────────────

interface StatCardProps { stat: string; label: string; context?: string }

export function StatRow({ stats }: { stats: StatCardProps[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`, gap: '16px', margin: '32px 0' }}>
      {stats.map((s, i) => (
        <div key={i} style={{ background: T.white, borderRadius: '14px', border: `1px solid ${T.border}`, padding: '20px', textAlign: 'center' }}>
          <p style={{ fontFamily: T.serif, fontSize: '32px', fontWeight: 400, color: T.dark, lineHeight: 1 }}>{s.stat}</p>
          <p style={{ fontFamily: T.sans, fontSize: '13px', fontWeight: 500, color: T.text, marginTop: '6px' }}>{s.label}</p>
          {s.context && <p style={{ fontFamily: T.sans, fontSize: '11px', color: T.muted, marginTop: '3px' }}>{s.context}</p>}
        </div>
      ))}
    </div>
  )
}

// ─── SECTION HEADER ──────────────────────────────────────────

export function SectionHeader({ id, icon, title, subtitle }: { id: string; icon?: string; title: string; subtitle?: string }) {
  return (
    <div id={id} style={{ paddingTop: '56px', paddingBottom: '16px', borderBottom: `2px solid ${T.border}`, marginBottom: '24px', scrollMarginTop: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        {icon && <span style={{ fontSize: '24px' }}>{icon}</span>}
        <h2 style={{ fontFamily: T.serif, fontSize: '28px', fontWeight: 400, color: T.dark }}>{title}</h2>
      </div>
      {subtitle && <p style={{ fontFamily: T.sans, fontSize: '15px', color: T.muted, lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  )
}

// ─── PROSE SECTION ───────────────────────────────────────────

export function ProseSection({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: T.sans, fontSize: '15px', lineHeight: 1.75, color: T.text }}>
      {children}
    </div>
  )
}
