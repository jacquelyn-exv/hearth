import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { email, role, inviterName, homeAddress, token, firstName, lastName } = await request.json()
  const inviteeName = firstName && lastName ? firstName + ' ' + lastName : firstName || null

  const roleLabel = role === 'co_owner' ? 'co-owner' : role === 'property_manager' ? 'property manager' : 'viewer'
  const acceptUrl = `https://homehearth.app/invite/${token}`

  try {
    await resend.emails.send({
      from: 'Hearth <hello@homehearth.app>',
      to: email,
      subject: `${inviterName} invited you to a home on Hearth`,
      replyTo: 'hello@homehearth.app',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#F8F4EE;font-family:'DM Sans',system-ui,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F4EE;padding:40px 20px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(30,58,47,0.11);">
                <tr>
                  <td style="background:#1E3A2F;padding:32px 40px;text-align:center;">
                    <div style="font-family:Georgia,serif;font-size:28px;color:#F8F4EE;">H<em style="color:#C47B2B;font-style:italic;">e</em>arth</div>
                    <div style="font-size:12px;color:rgba(248,244,238,0.5);margin-top:6px;letter-spacing:1px;text-transform:uppercase;">Know your home. Own your home.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <div style="font-size:40px;text-align:center;margin-bottom:20px;">🏡</div>
                    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1E3A2F;margin:0 0 12px;text-align:center;">${inviteeName ? 'Hi ' + inviteeName + ', you' : 'You'}'ve been invited</h1>
                    <p style="font-size:15px;color:#4A4A44;line-height:1.75;margin:0 0 24px;text-align:center;">
                      <strong>${inviterName}</strong> has invited you to access their home on Hearth as a <strong>${roleLabel}</strong>.
                    </p>
                    <div style="background:#F8F4EE;border-radius:12px;padding:16px 20px;margin-bottom:28px;border:1px solid rgba(30,58,47,0.10);">
                      <div style="font-size:12px;color:#8A8A82;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Property</div>
                      <div style="font-size:15px;font-weight:500;color:#1E3A2F;">${homeAddress}</div>
                    </div>
                    <div style="background:#EAF2EC;border-radius:12px;padding:14px 20px;margin-bottom:28px;border:1px solid rgba(61,122,90,0.15);">
                      <div style="font-size:13px;color:#3D7A5A;line-height:1.6;">
                        As a <strong>${roleLabel}</strong> you will be able to ${role === 'co_owner' ? 'view and edit home details, log maintenance, and manage tasks' : role === 'property_manager' ? 'view home details and assigned tasks' : 'view home details and maintenance history'}.
                      </div>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td align="center">
                        <a href="${acceptUrl}" style="display:inline-block;background:#C47B2B;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:500;">
                          Accept invitation →
                        </a>
                      </td></tr>
                    </table>
                    <p style="font-size:12px;color:#8A8A82;text-align:center;margin:20px 0 0;line-height:1.6;">
                      This invitation expires in 7 days.<br/>
                      If you don't have a Hearth account, you'll be able to create one after clicking the link.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#F8F4EE;padding:20px 40px;text-align:center;border-top:1px solid rgba(30,58,47,0.08);">
                    <p style="font-size:11px;color:#8A8A82;margin:0;">Hearth · Saint Michaels, MD</p>
                  </td>
                </tr>
              </table>
            </td></tr>
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
