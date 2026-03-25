'use client'

import Nav from '@/components/Nav'

export default function Terms() {
  const sections = [
    {
      title: 'Acceptance of terms',
      body: `By creating an account or using Hearth, you agree to these Terms of Service. If you do not agree, please do not use the platform. We may update these terms from time to time and will notify you of significant changes.`
    },
    {
      title: 'What Hearth is',
      body: `Hearth is an informational platform for homeowners. It provides tools to track home system health, log contractor experiences, and access community-contributed pricing data. Hearth is not a licensed contractor, home inspector, real estate agent, financial advisor, or legal advisor.\n\nNothing on Hearth constitutes professional advice. Always consult qualified professionals before making decisions about your home, including hiring contractors, making repairs, or listing your home for sale.`
    },
    {
      title: 'Your account',
      body: `You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating your account. You may not create an account on behalf of someone else without their consent. You may not use Hearth for any unlawful purpose.\n\nWe reserve the right to suspend or terminate accounts that violate these terms, submit false or misleading information, or engage in behavior harmful to other users or the platform.`
    },
    {
      title: 'Content you submit',
      body: `When you log contractor jobs, share reviews, or submit any other content to Hearth, you represent that the information is accurate to the best of your knowledge. You retain ownership of your content. By submitting content, you grant Hearth a license to use, display, and aggregate that content to operate and improve the platform.\n\nYou may not submit content that is false, defamatory, harassing, or intended to harm a contractor's reputation without factual basis. Hearth is not responsible for the accuracy of user-submitted content but reserves the right to remove content that violates these terms.`
    },
    {
      title: 'The Neighbor Network',
      body: `Contractor reviews on the Neighbor Network are submitted by individual homeowners and reflect their personal experiences. Hearth does not verify the accuracy of reviews, contractor license status, insurance coverage, or pricing information.\n\nUse the Neighbor Network as one input in your decision-making process. Always verify contractor credentials independently, obtain multiple bids, and consult licensed professionals before hiring. Hearth is not responsible for the quality of work performed by any contractor listed or reviewed on the platform.`
    },
    {
      title: 'Home health scores',
      body: `Your home health score is an estimated indicator based on the information you provide. It is not a professional home inspection, appraisal, or engineering assessment. Scores are calculated using general industry lifespan data and may not reflect the actual condition of your home.\n\nDo not rely solely on your Hearth score when making decisions about maintenance, repairs, buying, or selling a home. Always consult licensed home inspectors and qualified contractors for professional assessments.`
    },
    {
      title: 'Sponsored content',
      body: `Hearth may display sponsored content from manufacturers and home services companies. All sponsored content is clearly labeled. Sponsors do not influence editorial content, community data, or health scores. Hearth does not accept payment to alter reviews or community data.\n\nLinks to third-party websites or services are provided for convenience only. Hearth is not responsible for the content, accuracy, or practices of third-party sites.`
    },
    {
      title: 'Disclaimer of warranties',
      body: `Hearth is provided "as is" without warranties of any kind, express or implied. We do not warrant that the platform will be uninterrupted, error-free, or completely secure. We do not warrant the accuracy, completeness, or usefulness of any information on the platform.`
    },
    {
      title: 'Limitation of liability',
      body: `To the maximum extent permitted by law, Hearth and its owners, operators, and affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to damages arising from contractor hiring decisions, home repair decisions, or reliance on platform data.\n\nOur total liability to you for any claim arising from your use of Hearth shall not exceed the amount you paid us in the 12 months preceding the claim (which for free users is zero).`
    },
    {
      title: 'Governing law',
      body: `These terms are governed by the laws of the State of Maryland, United States, without regard to conflict of law principles. Any disputes arising from these terms or your use of Hearth shall be resolved in the courts of Maryland.`
    },
    {
      title: 'Contact us',
      body: `If you have questions about these Terms of Service, please contact us at legal@hearthome.co.`
    },
  ]

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      <div style={{ background: '#1E3A2F', padding: '48px 32px 56px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '12px' }}>Legal</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#F8F4EE', marginBottom: '12px' }}>Terms of Service</h1>
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