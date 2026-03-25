'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px',
    fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', color: '#1A1A18',
    boxSizing: 'border-box' as const
  }

  if (success) return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>Check your email</h2>
        <p style={{ fontSize: '14px', color: '#8A8A82', lineHeight: 1.7, marginBottom: '24px' }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account and set up your home.
        </p>
        <a href="/login" style={{ display: 'block', background: '#1E3A2F', color: '#F8F4EE', textDecoration: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>Go to sign in</a>
      </div>
    </main>
  )

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', color: '#1E3A2F', textDecoration: 'none' }}>
            H<em style={{ color: '#C47B2B', fontStyle: 'italic' }}>e</em>arth
          </a>
          <p style={{ fontSize: '14px', color: '#8A8A82', marginTop: '8px' }}>Create your free account</p>
        </div>

        {error && (
          <div style={{ background: '#FDECEA', color: '#9B2C2C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '5px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '5px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="At least 8 characters" required minLength={8} />
          </div>

          {/* Privacy and terms consent */}
          <p style={{ fontSize: '12px', color: '#8A8A82', lineHeight: 1.6, margin: '4px 0' }}>
            By creating an account you agree to our{' '}
            <a href="/terms" target="_blank" style={{ color: '#1E3A2F', fontWeight: 500, textDecoration: 'none' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" style={{ color: '#1E3A2F', fontWeight: 500, textDecoration: 'none' }}>Privacy Policy</a>.
            Your data is never sold. Sharing contractor jobs is always optional.
          </p>

          <button type="submit" disabled={loading} style={{
            width: '100%', background: '#C47B2B', color: '#fff',
            border: 'none', padding: '13px', borderRadius: '10px',
            fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif"
          }}>{loading ? 'Creating account...' : 'Create free account'}</button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#8A8A82', marginTop: '20px' }}>
          Already have an account? <a href="/login" style={{ color: '#1E3A2F', fontWeight: 500, textDecoration: 'none' }}>Sign in</a>
        </p>
      </div>
    </main>
  )
}