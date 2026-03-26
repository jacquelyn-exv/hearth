import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { email, name } = await request.json()

  try {
    await resend.emails.send({
      from: 'Hearth <hello@homehearth.app>',
      to: email,
      subject: 'Welcome to Hearth — your home is in good hands',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="margin:0;padding:0;background:#F8F4EE;font-family:'DM Sans',system-ui,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F4EE;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(30,58,47,0.11);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:#1E3A2F;padding:32px 40px;text-align:center;">
                      <div style="font-family:Georgia,serif;font-size:28px;color:#F8F4EE;letter-spacing:-0.5px;">
                        H<em style="color:#C47B2B;font-style:italic;">e</em>arth
                      </div>
                      <div style="font-size:12px;color:rgba(248,244,238,0.5);margin-top:6px;letter-spacing:1px;text-transform:uppercase;">Know your home. Own your home.</div>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1E3A2F;margin:0 0 16px;line-height:1.2;">
                        Welcome${name ? `, ${name}` : ''} — your home is now in good hands.
                      </h1>
                      <p style="font-size:15px;color:#4A4A44;line-height:1.75;margin:0 0 24px;">
                        You've just set up something most homeowners never have — a complete, organized record of your home that gets smarter over time.
                      </p>

                      <!-- What you can do -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                        ${[
                          { icon: '📊', title: 'Check your health score', desc: 'See where your home stands across every major system.' },
                          { icon: '📋', title: 'Log your first contractor job', desc: 'Build your home\'s permanent maintenance record.' },
                          { icon: '👥', title: 'Browse your Neighbor Network', desc: 'See what your neighbors paid for contractor work.' },
                          { icon: '📖', title: 'Read a home guide', desc: 'Expert guidance on every system in your home.' },
                        ].map(item => `
                          <tr>
                            <td style="padding:10px 0;border-bottom:1px solid rgba(30,58,47,0.07);">
                              <table cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="font-size:22px;width:40px;vertical-align:top;padding-top:2px;">${item.icon}</td>
                                  <td style="padding-left:12px;">
                                    <div style="font-size:14px;font-weight:500;color:#1E3A2F;margin-bottom:2px;">${item.title}</div>
                                    <div style="font-size:13px;color:#8A8A82;">${item.desc}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        `).join('')}
                      </table>

                      <!-- CTA -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="https://homehearth.app/dashboard" style="display:inline-block;background:#1E3A2F;color:#F8F4EE;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:500;font-family:system-ui,sans-serif;">
                              Go to my dashboard →
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="font-size:13px;color:#8A8A82;line-height:1.7;margin:28px 0 0;text-align:center;">
                        Questions? Reply to this email anytime.<br/>
                        <a href="https://homehearth.app/privacy" style="color:#1E3A2F;">Privacy Policy</a> · 
                        <a href="https://homehearth.app/terms" style="color:#1E3A2F;">Terms of Service</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#F8F4EE;padding:20px 40px;text-align:center;border-top:1px solid rgba(30,58,47,0.08);">
                      <p style="font-size:11px;color:#8A8A82;margin:0;">
                        You're receiving this because you created a Hearth account.<br/>
                        Hearth · Saint Michaels, MD
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}