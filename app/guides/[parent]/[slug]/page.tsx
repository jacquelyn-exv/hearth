import { CLUSTER_ARTICLES } from '@/lib/clusterArticles'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import { NotifyForm } from './NotifyForm'

const GUIDE_LABELS: Record<string, { title: string; icon: string }> = {
  'roof': { title: 'Roof', icon: '🏠' },
  'siding': { title: 'Siding', icon: '🪵' },
  'gutters': { title: 'Gutters, Fascia & Soffits', icon: '🌧️' },
  'windows': { title: 'Windows', icon: '🪟' },
  'entry-doors': { title: 'Entry Doors', icon: '🚪' },
  'sliding-doors': { title: 'Sliding Glass Doors', icon: '🪟' },
  'hvac': { title: 'HVAC', icon: '❄️' },
  'water-heater': { title: 'Water Heater', icon: '🔥' },
}

export async function generateStaticParams() {
  return CLUSTER_ARTICLES.map(a => ({ parent: a.parentGuide, slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ parent: string; slug: string }> }) {
  const { parent, slug } = await params
  const article = CLUSTER_ARTICLES.find(a => a.parentGuide === parent && a.slug === slug)
  if (!article) return {}
  return { title: article.title + ' — Hearth', description: article.description }
}

export default async function ArticleStubPage({ params }: { params: Promise<{ parent: string; slug: string }> }) {
  const { parent, slug } = await params
  const article = CLUSTER_ARTICLES.find(a => a.parentGuide === parent && a.slug === slug)
  if (!article) notFound()

  const guide = GUIDE_LABELS[parent]
  const related = CLUSTER_ARTICLES.filter(a => a.parentGuide === parent && a.slug !== slug).slice(0, 5)

  return (
    <div style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#1A1A18' }}>
      <Nav />

      <div style={{ background: '#1E3A2F', padding: '56px 32px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(196,123,43,0.12) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <a href="/guides" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', color: 'rgba(248,244,238,0.50)', textDecoration: 'none' }}>Guides</a>
            <span style={{ color: 'rgba(248,244,238,0.25)' }}>/</span>
            <a href={'/guides/' + parent} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', color: 'rgba(248,244,238,0.50)', textDecoration: 'none' }}>{guide?.icon} {guide?.title}</a>
            <span style={{ color: 'rgba(248,244,238,0.25)' }}>/</span>
            <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', color: 'rgba(248,244,238,0.75)' }}>Article</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 400, color: '#F8F4EE', lineHeight: 1.15, marginBottom: '16px' }}>{article!.title}</h1>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '16px', color: 'rgba(248,244,238,0.65)', lineHeight: 1.7, fontWeight: 300 }}>{article!.description}</p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '56px 32px' }}>

        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid rgba(196,123,43,0.20)', padding: '40px', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✍️</div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>This article is being written</h2>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', color: '#8A8A82', lineHeight: 1.7, marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px' }}>
            We are actively working on this topic. In the meantime the full guide below covers this and much more.
          </p>
          <a href={'/guides/' + parent} style={{ display: 'inline-block', background: '#1E3A2F', color: '#F8F4EE', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', fontWeight: 500, padding: '12px 28px', borderRadius: '10px', textDecoration: 'none' }}>
            Read the full {guide?.title} guide
          </a>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(30,58,47,0.10)', padding: '28px', marginBottom: '32px' }}>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A2F', marginBottom: '6px' }}>Want this article sooner?</p>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', color: '#8A8A82', marginBottom: '16px', lineHeight: 1.6 }}>Leave your email and we will notify you the moment this is published.</p>
          <NotifyForm topic={article!.title} />
        </div>

        {related.length > 0 && (
          <div>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '11px', fontWeight: 600, color: '#8A8A82', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>More {guide?.title} articles</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {related.map(a => (
                <a key={a.slug} href={'/guides/' + parent + '/' + a.slug} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(30,58,47,0.10)', padding: '14px 16px', textDecoration: 'none' }}>
                  <span style={{ color: '#C47B2B', fontSize: '12px', marginTop: '3px', flexShrink: 0 }}>→</span>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>{a.title}</p>
                    <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '12px', color: '#8A8A82' }}>{a.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: '#1E3A2F', padding: '56px 32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 400, color: '#F8F4EE', marginBottom: '8px' }}>Track your home in Hearth</h3>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', color: 'rgba(248,244,238,0.65)', fontWeight: 300 }}>Log your systems, get smart maintenance reminders, and build a verified history — free.</p>
          </div>
          <a href="/signup" style={{ background: '#C47B2B', color: '#ffffff', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', fontWeight: 500, padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Set up my home</a>
        </div>
      </div>
    </div>
  )
}
