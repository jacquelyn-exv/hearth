'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async () => {
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
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main style={{ background: '#F8F4EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📬</div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '12px' }}>Check your email</h2>
          <p style={{ fontSize: '14px', color: '#8A8A82', lineHeight: 1.6 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account and get your home health score.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', color: '#1E3A2F', marginBottom: '8px' }}>
            Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
          </div>
          <p style={{ fontSize: '14px', color: '#8A8A82' }}>Create your free account</p>
        </div>

        {error && (
          <div style={{ background: '#FDECEA', color: '#9B2C2C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff' }}
            placeholder="you@example.com"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '6px' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignup()}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff' }}
            placeholder="At least 6 characters"
          />
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          style={{ width: '100%', background: '#C47B2B', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#8A8A82', marginTop: '20px' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#1E3A2F', fontWeight: 500 }}>Sign in</a>
        </p>
      </div>
    </main>
  )
}