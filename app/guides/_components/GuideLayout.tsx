'use client'

import { ReactNode, useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import type { GuideSection } from '@/types'

const T = {
  bg: '#F8F4EE',
  dark: '#1E3A2F',
  amber: '#C47B2B',
  green: '#6AAF8A',
  text: '#1A1A18',
  muted: '#8A8A82',
  border: 'rgba(30,58,47,0.10)',
  white: '#ffffff',
  serif: "'Playfair Display', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
}

interface GuideLayoutProps {
  title: string
  subtitle: string
  icon: string
  readTime: string
  lastUpdated: string
  sections: GuideSection[]
  children: ReactNode
  relatedGuides?: { slug: string; title: string; icon: string }[]
}

function ContentRequestForm({ relatedGuide }: { relatedGuide: string }) {
  const [question, setQuestion] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div style={{ background: 'rgba(106,175,138,0.10)', border: '1px solid rgba(106,175,138,0.25)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
        <p style={{ fontFamily: T.sans, fontWeight: 500, color: T.dark, fontSize: '15px' }}>Got it — thanks!</p>
        <p style={{ fontFamily: T.sans, color: T.muted, fontSize: '13px', marginTop: '6px' }}>We review every request and publish the most popular ones.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="What do you want to learn about?"
        rows={3}
        style={{ fontFamily: T.sans, fontSize: '14px', border: `1px solid ${T.border}`, borderRadius: '12px', padding: '14px 16px', resize: 'none', background: T.white, color: T.text, outline: 'none' }}
      />
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email (optional — we'll notify you when it's published)"
        style={{ fontFamily: T.sans, fontSize: '14px', border: `1px solid ${T.border}`, borderRadius: '12px', padding: '12px 16px', background: T.white, color: T.text, outline: 'none' }}
      />
      <button
        onClick={() => { if (question.trim()) { console.log({ question, email, relatedGuide }); setSubmitted(true) } }}
        disabled={!question.trim()}
        style={{ fontFamily: T.sans, fontSize: '14px', fontWeight: 500, background: question.trim() ? T.dark : 'rgba(30,58,47,0.3)', color: T.white, border: 'none', borderRadius: '12px', padding: '14px', cursor: question.trim() ? 'pointer' : 'not-allowed' }}
      >
        Submit request
      </button>
    </div>
  )
}

export default function GuideLayout({ title, subtitle, icon, readTime, lastUpdated, sections, children, relatedGuides = [] }: GuideLayoutProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.anchor || '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id) }) },
      { rootMargin: '-20% 0% -60% 0%', threshold: 0 }
    )
    sections.forEach(({ anchor }) => { const el = document.getElementById(anchor); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [sections])

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.sans, color: T.text }}>
      <Nav />

      {/* Hero */}
      <div style={{ background: T.dark, padding: '56px 32px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(196,123,43,0.12) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
            <a href="/guides" style={{ fontFamily: T.sans, fontSize: '13px', color: 'rgba(248,244,238,0.5)', textDecoration: 'none' }}>Guides</a>
            <span style={{ color: 'rgba(248,244,238,0.25)', fontSize: '13px' }}>/</span>
            <span style={{ fontFamily: T.sans, fontSize: '13px', color: 'rgba(248,244,238,0.75)' }}>{title}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <span style={{ fontSize: '40px' }}>{icon}</span>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontFamily: T.sans, fontSize: '13px', color: 'rgba(248,244,238,0.5)' }}>{readTime} read</span>
              <span style={{ color: 'rgba(248,244,238,0.2)' }}>·</span>
              <span style={{ fontFamily: T.sans, fontSize: '13px', color: 'rgba(248,244,238,0.5)' }}>
                Updated {new Date(lastUpdated).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          <h1 style={{ fontFamily: T.serif, fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 400, color: '#F8F4EE', lineHeight: 1.15, marginBottom: '16px', maxWidth: '760px' }}>
            {title}
          </h1>
          <p style={{ fontFamily: T.sans, fontSize: '17px', color: 'rgba(248,244,238,0.70)', lineHeight: 1.7, maxWidth: '640px', fontWeight: 300, marginBottom: '28px' }}>
            {subtitle}
          </p>

          {/* Section jump links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {sections.map(s => (
              <a key={s.anchor} href={`#${s.anchor}`} style={{ fontFamily: T.sans, fontSize: '12px', fontWeight: 500, color: 'rgba(248,244,238,0.70)', background: 'rgba(248,244,238,0.08)', border: '1px solid rgba(248,244,238,0.12)', borderRadius: '20px', padding: '6px 14px', textDecoration: 'none' }}>
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 32px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '48px', alignItems: 'start' }}>
        {/* Main content */}
        <article>{children}</article>

        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section nav */}
          <div style={{ background: T.white, borderRadius: '16px', border: `1px solid ${T.border}`, padding: '20px' }}>
            <p style={{ fontFamily: T.sans, fontSize: '11px', fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>In this guide</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {sections.map(s => (
                <a key={s.anchor} href={`#${s.anchor}`} style={{ fontFamily: T.sans, fontSize: '13px', padding: '8px 12px', borderRadius: '8px', textDecoration: 'none', background: activeSection === s.anchor ? 'rgba(196,123,43,0.10)' : 'transparent', color: activeSection === s.anchor ? T.amber : T.muted, fontWeight: activeSection === s.anchor ? 500 : 400 }}>
                  {s.title}
                </a>
              ))}
            </nav>
          </div>

          {/* CTA */}
          <div style={{ background: T.dark, borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontFamily: T.serif, fontSize: '17px', color: '#F8F4EE', marginBottom: '8px', fontWeight: 400 }}>Track your home in Hearth</p>
            <p style={{ fontFamily: T.sans, fontSize: '13px', color: 'rgba(248,244,238,0.65)', lineHeight: 1.6, marginBottom: '16px', fontWeight: 300 }}>Log your systems, get smart maintenance reminders, and build a verified history — free.</p>
            <a href="/signup" style={{ display: 'block', textAlign: 'center', background: T.amber, color: T.white, fontFamily: T.sans, fontSize: '13px', fontWeight: 500, padding: '10px', borderRadius: '8px', textDecoration: 'none' }}>
              Get started free
            </a>
          </div>

          {/* Related guides */}
          {relatedGuides.length > 0 && (
            <div style={{ background: T.white, borderRadius: '16px', border: `1px solid ${T.border}`, padding: '20px' }}>
              <p style={{ fontFamily: T.sans, fontSize: '11px', fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Related guides</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {relatedGuides.map(g => (
                  <a key={g.slug} href={`/guides/${g.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: T.sans, fontSize: '13px', color: T.text, textDecoration: 'none', padding: '6px 0' }}>
                    <span>{g.icon}</span><span>{g.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Content request footer */}
      <div style={{ borderTop: `1px solid ${T.border}`, background: T.white }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '64px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
          <h3 style={{ fontFamily: T.serif, fontSize: '24px', fontWeight: 400, color: T.dark, marginBottom: '8px' }}>Still have questions?</h3>
          <p style={{ fontFamily: T.sans, fontSize: '14px', color: T.muted, marginBottom: '24px', lineHeight: 1.6 }}>Tell us what you want to learn about and we'll write it.</p>
          <ContentRequestForm relatedGuide={title} />
        </div>
      </div>
    </div>
  )
}
