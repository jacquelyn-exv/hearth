import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const RESEND_API_KEY = process.env.RESEND_API_KEY!
const ADMIN_EMAIL = 'jacquelyn.martin88@gmail.com'

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${RESEND_API_KEY}`},
    body:JSON.stringify({from:'Hearth <notifications@homehearth.app>',to,subject,html})
  })
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({error:'Unauthorized'},{status:401})
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30*24*60*60*1000)
  const {data:overdue}=await supabase.from('property_claims').select('*,homes(address,city,state,zip),requester:requester_id(email)').eq('status','pending').lt('submitted_at',thirtyDaysAgo.toISOString())
  let processed=0
  for(const claim of overdue||[]){
    await supabase.from('property_claims').update({status:'escalated',escalated_at:now.toISOString()}).eq('id',claim.id)
    const address=`${claim.homes?.address}, ${claim.homes?.city}, ${claim.homes?.state}`
    const days=Math.floor((now.getTime()-new Date(claim.submitted_at).getTime())/(1000*60*60*24))
    await sendEmail(ADMIN_EMAIL,`[Hearth Admin] Property claim escalated — ${address}`,
      `<div style="font-family:sans-serif;padding:24px;"><h2 style="color:#1E3A2F;">Claim escalated after ${days} days</h2><p>Property: <strong>${address}</strong></p><p>Requested by: ${claim.requester?.email}</p><p>Type: ${claim.request_type}</p>${claim.message?`<p>Note: ${claim.message}</p>`:''}<a href="https://homehearth.app/admin?tab=claims" style="display:inline-block;background:#1E3A2F;color:#F8F4EE;padding:12px 24px;border-radius:8px;text-decoration:none;">Review in admin →</a></div>`)
    if(claim.requester?.email) await sendEmail(claim.requester.email,`Your property claim is being reviewed — ${address}`,
      `<div style="font-family:sans-serif;padding:24px;"><h2 style="color:#1E3A2F;">Your claim is under review</h2><p>The owner of <strong>${address}</strong> did not respond within 30 days. The Hearth team will review your request and contact you within 5 business days.</p></div>`)
    processed++
  }
  const sevenLeft=new Date(now.getTime()-23*24*60*60*1000)
  const {data:warnings}=await supabase.from('property_claims').select('*,homes(address,city,state,zip,user_id)').eq('status','pending').lt('submitted_at',sevenLeft.toISOString()).gt('submitted_at',thirtyDaysAgo.toISOString())
  for(const claim of warnings||[]){
    if(!claim.homes?.user_id) continue
    const {data:op}=await supabase.from('user_profiles').select('email').eq('user_id',claim.homes.user_id).single()
    if(!op?.email) continue
    const addr=`${claim.homes.address}, ${claim.homes.city}, ${claim.homes.state}`
    const daysLeft=30-Math.floor((now.getTime()-new Date(claim.submitted_at).getTime())/(1000*60*60*24))
    await sendEmail(op.email,`${daysLeft} days left to respond to a property request on Hearth`,
      `<div style="font-family:sans-serif;padding:24px;"><h2 style="color:#C47B2B;">${daysLeft} days remaining</h2><p>Someone requested ${claim.request_type==='transfer'?'ownership transfer':'access'} for <strong>${addr}</strong>. Respond before the deadline to avoid Hearth admin review.</p><a href="https://homehearth.app/dashboard?tab=requests" style="display:inline-block;background:#1E3A2F;color:#F8F4EE;padding:12px 24px;border-radius:8px;text-decoration:none;">Respond now →</a></div>`)
  }
  return NextResponse.json({processed,warnings:warnings?.length||0})
}
