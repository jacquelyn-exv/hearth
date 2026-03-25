'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (roleData?.role === 'admin') {
        window.location.href = '/admin'
        return
      }

      const { data: homes } = await supabase
        .from('homes')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (homes && homes.length > 0) {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/onboarding'
      }
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px',
    fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', background: '#fff', color: '#1A1A18',
    boxSizing: 'border-box' as const
  }

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', color: '#1E3A2F', textDecoration: 'none' }}>
            H<em style={{ color: '#C47B2B', fontStyle: 'italic' }}>e</em>arth
          </a>
          <p style={{ fontSize: '14px', color: '#8A8A82', marginTop: '8px' }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{ background: '#FDECEA', color: '#9B2C2C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '5px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1A1A18', marginBottom: '5px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', marginTop: '8px', background: '#1E3A2F', color: '#F8F4EE',
            border: 'none', padding: '12px', borderRadius: '10px',
            fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif"
          }}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#8A8A82', marginTop: '20px' }}>
          Don&apos;t have an account? <a href="/signup" style={{ color: '#1E3A2F', fontWeight: 500, textDecoration: 'none' }}>Set up your home</a>
        </p>
      </div>
    </main>
  )
}