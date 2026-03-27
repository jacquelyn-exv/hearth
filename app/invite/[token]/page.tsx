"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string
  const [status, setStatus] = useState<'loading' | 'found' | 'notfound' | 'accepting' | 'done' | 'error'>('loading')
  const [invite, setInvite] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data } = await supabase
        .from('home_invites')
        .select('*, homes(address, city, state)')
        .eq('token', token)
        .eq('status', 'pending')
        .single()
      if (data) { setInvite(data); setStatus('found') }
      else setStatus('notfound')
    }
    if (token) load()
  }, [token])

  const accept = async () => {
    setStatus('accepting')
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      // Save token to localStorage and redirect to signup
      localStorage.setItem('hearth_invite_token', token)
      router.push('/signup?invite=' + token + '&email=' + encodeURIComponent(invite.email))
      return
    }
    // Insert into home_members
    const { error } = await supabase.from('home_members').upsert({
      home_id: invite.home_id,
      user_id: currentUser.id,
      email: currentUser.email,
      role: invite.role,
      status: 'approved',
      added_at: new Date().toISOString()
    }, { onConflict: 'home_id,user_id' })

    if (error) { setStatus('error'); return }

    // Mark invite as accepted
    await supabase.from('home_invites').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('token', token)
    setStatus('done')
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  const home = invite?.homes
  const address = home ? `${home.address}${home.city ? ', ' + home.city : ''}${home.state ? ', ' + home.state : ''}` : ''
  const roleLabel = invite?.role === 'co_owner' ? 'Co-owner' : invite?.role === 'property_manager' ? 'Property manager' : 'Viewer'

  return (
    <div style={{ background: '#F8F4EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid rgba(30,58,47,0.11)', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>

        {status === 'loading' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
            <p style={{ color: '#8A8A82', fontSize: '14px' }}>Loading your invitation...</p>
          </>
        )}

        {status === 'notfound' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>Invitation not found</h2>
            <p style={{ color: '#8A8A82', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>This invitation may have expired or already been accepted.</p>
            <a href="/dashboard" style={{ display: 'inline-block', background: '#1E3A2F', color: '#F8F4EE', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>Go to dashboard</a>
          </>
        )}

        {status === 'found' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏡</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>You've been invited</h2>
            <div style={{ background: '#F8F4EE', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', border: '1px solid rgba(30,58,47,0.10)' }}>
              <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>Property</div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F' }}>{address}</div>
            </div>
            <div style={{ background: '#EAF2EC', borderRadius: '12px', padding: '12px 18px', marginBottom: '28px', border: '1px solid rgba(61,122,90,0.15)' }}>
              <div style={{ fontSize: '13px', color: '#3D7A5A' }}>You will be added as a <strong>{roleLabel}</strong></div>
            </div>
            {!user && (
              <p style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '16px' }}>You will need to sign in or create a free account to accept.</p>
            )}
            <button onClick={accept} style={{ width: '100%', background: '#C47B2B', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {user ? 'Accept invitation' : 'Sign in to accept'}
            </button>
          </>
        )}

        {status === 'accepting' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
            <p style={{ color: '#8A8A82', fontSize: '14px' }}>Accepting invitation...</p>
          </>
        )}

        {status === 'done' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>You're in!</h2>
            <p style={{ color: '#8A8A82', fontSize: '14px', lineHeight: 1.7 }}>You now have access to this home. Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>Something went wrong</h2>
            <p style={{ color: '#8A8A82', fontSize: '14px', marginBottom: '20px' }}>Please try again or contact support.</p>
            <a href="/dashboard" style={{ display: 'inline-block', background: '#1E3A2F', color: '#F8F4EE', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>Go to dashboard</a>
          </>
        )}
      </div>
    </div>
  )
}
