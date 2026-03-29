import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const RESEND_API_KEY = process.env.RESEND_API_KEY!

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:`Bearer ${RESEND_API_KEY}`},
    body:JSON.stringify({from:'Hearth <notifications@homehearth.app>',to,bcc:'jacquelyn@exp-ventures.com',subject,html})
  })
}

export async function POST(request: Request) {
  try {
    const {home_id,requester_id,requester_email,request_type,message}=await request.json()
    if(!home_id||!requester_id||!request_type) return NextResponse.json({error:'Missing required fields'},{status:400})
    const {data:existing}=await supabase.from('property_claims').select('id').eq('home_id',home_id).eq('requester_id',requester_id).eq('status','pending').single()
    if(existing) return NextResponse.json({error:'You already have a pending request for this property'},{status:409})
    const {data:claim,error:claimError}=await supabase.from('property_claims').insert({home_id,requester_id,request_type,message:message||null,status:'pending'}).select().single()
    if(claimError) throw claimError
    const {data:home}=await supabase.from('homes').select('address,city,state,zip,user_id,is_unclaimed').eq('id',home_id).single()
    const address=`${home?.address}, ${home?.city}, ${home?.state} ${home?.zip}`
    if(home?.is_unclaimed||!home?.user_id){
      await supabase.from('property_claims').update({status:'approved',responded_at:new Date().toISOString()}).eq('id',claim.id)
      await supabase.from('homes').update({user_id:requester_id,is_unclaimed:false}).eq('id',home_id)
      await supabase.from('home_ownership_history').insert({home_id,user_id:requester_id,role:'primary',started_at:new Date().toISOString()})
      return NextResponse.json({status:'approved',message:'Unclaimed property — you are now the owner.'})
    }
    const {data:ownerData}=await supabase.auth.admin.getUserById(home.user_id)
    const ownerEmail=ownerData?.user?.email
    if(ownerEmail){
      const roleLabels:Record<string,string>={transfer:'ownership transfer',co_owner:'co-owner access',property_manager:'property manager access',realtor:'realtor/agent access',viewer:'view-only access'}
      const roleLabel=roleLabels[request_type]||request_type
      await sendEmail(ownerEmail,`Someone requested ${roleLabel} for your home on Hearth`,
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <div style="background:#1E3A2F;padding:20px;border-radius:12px;margin-bottom:24px;"><h1 style="color:#F8F4EE;font-size:20px;margin:0;font-weight:400;">H<em style="color:#C47B2B">e</em>arth</h1></div>
          <h2 style="color:#1E3A2F;font-weight:400;">New ${roleLabel} request</h2>
          <p style="color:#666;line-height:1.7;"><strong>${requester_email}</strong> has requested <strong>${roleLabel}</strong> for <strong>${address}</strong>.</p>
          ${message?`<div style="background:#F8F4EE;border-radius:8px;padding:14px;margin:16px 0;font-size:14px;color:#444;font-style:italic;">"${message}"</div>`:''}
          <div style="background:#FAEEDA;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:#633806;">You have <strong>30 days</strong> to respond. If no action is taken, this request will be reviewed by the Hearth team.</div>
          <div style="display:flex;gap:12px;margin:24px 0;">
            <a href="https://homehearth.app/dashboard?tab=requests&claim=${claim.id}&action=approve" style="flex:1;display:block;background:#1E3A2F;color:#F8F4EE;padding:14px;border-radius:8px;text-decoration:none;font-weight:500;text-align:center;">Approve</a>
            <a href="https://homehearth.app/dashboard?tab=requests&claim=${claim.id}&action=deny" style="flex:1;display:block;background:none;border:1px solid #ccc;color:#444;padding:14px;border-radius:8px;text-decoration:none;font-weight:500;text-align:center;">Deny</a>
          </div>
        </div>`)
    }
    await supabase.from('home_ownership_history').insert({home_id,user_id:requester_id,role:`pending_${request_type}`,started_at:new Date().toISOString()})
    return NextResponse.json({status:'pending',claim_id:claim.id})
  } catch(e:any){return NextResponse.json({error:e.message},{status:500})}
}

export async function PATCH(request: Request) {
  try {
    const {claim_id,action,owner_id}=await request.json()
    const {data:claim}=await supabase.from('property_claims').select('*,homes(address,city,state,zip,user_id)').eq('id',claim_id).single()
    if(!claim) return NextResponse.json({error:'Claim not found'},{status:404})
    if(claim.homes?.user_id!==owner_id) return NextResponse.json({error:'Unauthorized'},{status:403})
    const now=new Date().toISOString()
    if(action==='approve'){
      await supabase.from('property_claims').update({status:'approved',responded_at:now}).eq('id',claim_id)
      if(claim.request_type==='transfer'){
        const prevOwnerId=claim.homes.user_id
        await supabase.from('home_members').upsert({home_id:claim.home_id,user_id:prevOwnerId,role:'former_owner',access_level:'read_only',access_frozen_at:now})
        await supabase.from('homes').update({user_id:claim.requester_id,transferred_at:now,original_owner_id:prevOwnerId}).eq('id',claim.home_id)
        await supabase.from('home_ownership_history').update({ended_at:now,end_reason:'transferred'}).eq('home_id',claim.home_id).eq('user_id',prevOwnerId).is('ended_at',null)
        await supabase.from('home_ownership_history').insert({home_id:claim.home_id,user_id:claim.requester_id,role:'primary',started_at:now})
        const {data:rp}=await supabase.auth.admin.getUserById(claim.requester_id)
        const re=rp?.user?.email
        const addr=`${claim.homes.address}, ${claim.homes.city}, ${claim.homes.state}`
        if(re) await sendEmail(re,`Your ownership transfer was approved — ${addr}`,
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h2 style="color:#1E3A2F;">Transfer approved</h2><p>You are now the owner of <strong>${addr}</strong> on Hearth.</p><a href="https://homehearth.app/dashboard" style="display:inline-block;background:#1E3A2F;color:#F8F4EE;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">View your home →</a></div>`)
      } else {
        const roleMap:Record<string,string>={co_owner:'co_owner',property_manager:'property_manager',realtor:'viewer',viewer:'viewer'}
        await supabase.from('home_members').upsert({home_id:claim.home_id,user_id:claim.requester_id,role:roleMap[claim.request_type]||'viewer',access_level:['viewer','realtor'].includes(claim.request_type)?'read_only':'full',status:'approved'})
      }
    } else if(action==='deny'){
      await supabase.from('property_claims').update({status:'denied',responded_at:now}).eq('id',claim_id)
      const {data:rp}=await supabase.auth.admin.getUserById(claim.requester_id)
      const re=rp?.user?.email
      const addr=`${claim.homes.address}, ${claim.homes.city}, ${claim.homes.state}`
      if(re) await sendEmail(re,`Your access request was not approved — ${addr}`,
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h2 style="color:#1E3A2F;">Request not approved</h2><p>The current owner of <strong>${addr}</strong> did not approve your request.</p><p style="color:#666;font-size:13px;">If you believe this is an error, contact support@homehearth.app</p></div>`)
    }
    return NextResponse.json({status:action==='approve'?'approved':'denied'})
  } catch(e:any){return NextResponse.json({error:e.message},{status:500})}
}

export async function GET(request: Request) {
  const {searchParams}=new URL(request.url)
  const home_id=searchParams.get('home_id'), user_id=searchParams.get('user_id'), admin=searchParams.get('admin')
  let query=supabase.from('property_claims').select('*,homes(address,city,state,zip)')
  if(home_id) query=query.eq('home_id',home_id)
  if(user_id) query=query.eq('requester_id',user_id)
  if(admin==='escalated') query=query.eq('status','escalated').order('escalated_at',{ascending:true})
  const {data,error}=await query.order('submitted_at',{ascending:false})
  if(error) return NextResponse.json({error:error.message},{status:500})
  return NextResponse.json(data)
}
