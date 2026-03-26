'use client'

import Nav from '@/components/Nav'

export default function Privacy() {
  const sections = [
    {
      title: 'Who we are',
      body: `Hearth is a homeowner intelligence platform that helps you track your home's health, log contractor jobs, and connect with your neighbors' verified contractor experiences. We are committed to protecting your personal information and being transparent about how we use it.`
    },
    {
      title: 'What we collect',
      body: `We collect information you provide directly: your email address and password when you create an account; your home address, year built, home type, and square footage; details about your home systems including install years, materials, and replacement history; contractor job records including company names, dates, prices, ratings, and notes; and optional home details such as bedrooms, bathrooms, garage, basement, and amenities.\n\nWe do not collect payment information. We do not track your location beyond the zip code you provide. We do not collect data about your device or browsing behavior beyond what is necessary to operate the platform.`
    },
    {
      title: 'How we use your data',
      body: `We use your data to calculate and display your home health score; to power your personal dashboard, contractor log, and report card; to contribute anonymously to the Neighbor Network when you choose to share a job; and to improve the platform over time.\n\nWe never sell your personal data to third parties. We never share your individually identifiable data with contractors, manufacturers, or advertisers. Sponsored placements in the platform are clearly labeled and do not involve sharing your personal information with sponsors.`
    },
    {
      title: 'The Neighbor Network',
      body: `When you log a contractor job and choose to share it, only the following information is contributed to the Neighbor Network: the contractor name, system type, service description, job date (month and year only), price paid, quality rating, refer status, and tags. Your name, email, address, and home details are never shared. Your user ID and home ID are stripped before the data becomes publicly visible.\n\nSharing is always opt-in. You can toggle sharing on or off for any job at any time from your contractor log.`
    },
    {
      title: 'Data storage and security',
      body: `Your data is stored securely using Supabase, a SOC 2 compliant database platform. All data is encrypted in transit using HTTPS. Row-level security policies ensure that each user can only access their own data. Passwords are hashed and never stored in plain text.\n\nWe take security seriously and regularly audit our access policies. However, no system is completely immune to security risks. We encourage you to use a strong, unique password for your Hearth account.`
    },
    {
      title: 'Your rights',
      body: `You have the right to access all data we hold about you. You have the right to correct any inaccurate information. You have the right to export your data at any time. You have the right to delete your account and all associated data permanently. You have the right to opt out of anonymous data sharing at any time.\n\nTo exercise any of these rights, contact us at jacquelyn@exp-ventures.com.`
    },
    {
      title: 'Data retention',
      body: `We retain your data for as long as your account is active. If you delete your account, all personally identifiable data is permanently deleted within 30 days. Anonymized, aggregated data that has already been contributed to the Neighbor Network may be retained in aggregate form.`
    },
    {
      title: 'Children',
      body: `Hearth is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.`
    },
    {
      title: 'Changes to this policy',
      body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by a prominent notice on the platform. Your continued use of Hearth after changes are posted constitutes your acceptance of the updated policy.`
    },
    {
      title: 'Contact us',
      body: `If you have questions about this Privacy Policy or how we handle your data, please contact us at jacquelyn@exp-ventures.com.`
    },
  ]

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      <div style={{ background: '#1E3A2F', padding: '48px 32px 56px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '12px' }}>Legal</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#F8F4EE', marginBottom: '12px' }}>Privacy Policy</h1>
          <p style={{ fontSize: '14px', color: 'rgba(248,244,238,0.5)' }}>Last updated: March 2026</p>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 32px 80px' }}>
        {sections.map((section, i) => (
          <div key={section.title} style={{ marginBottom: '40px', paddingBottom: '40px', borderBottom: i < sections.length - 1 ? '1px solid rgba(30,58,47,0.08)' : 'none' }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '12px' }}>{section.title}</h2>
            {section.body.split('\n\n').map((para, j) => (
              <p key={j} style={{ fontSize: '15px', color: '#4A4A44', lineHeight: 1.8, marginBottom: '10px' }}>{para}</p>
            ))}
          </div>
        ))}
      </div>

      <footer style={{ background: '#1E3A2F', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#F8F4EE', marginBottom: '8px' }}>
          H<em style={{ color: '#C47B2B', fontStyle: 'italic' }}>e</em>arth
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(248,244,238,0.4)', marginBottom: '12px' }}>Know your home. Own your home.</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/privacy" style={{ fontSize: '12px', color: 'rgba(248,244,238,0.45)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: '12px', color: 'rgba(248,244,238,0.45)', textDecoration: 'none' }}>Terms of Service</a>
          <a href="/guides" style={{ fontSize: '12px', color: 'rgba(248,244,238,0.45)', textDecoration: 'none' }}>Guides</a>
          <a href="/neighbors" style={{ fontSize: '12px', color: 'rgba(248,244,238,0.45)', textDecoration: 'none' }}>Neighbor Network</a>
        </div>
      </footer>
    </main>
  )
}