'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Nav() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const linkStyle = {
    color: 'rgba(248,244,238,0.65)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    padding: '6px 11px',
    borderRadius: '6px',
    textDecoration: 'none' as const,
    whiteSpace: 'nowrap' as const
  }

  if (loading) return (
    <nav style={{ background: '#1E3A2F', height: '58px', position: 'sticky', top: 0, zIndex: 200 }} />
  )

  return (
    <nav style={{
      background: '#1E3A2F', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 28px', height: '58px',
      position: 'sticky', top: 0, zIndex: 200
    }}>
      <a href="/" style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '21px', color: '#F8F4EE', textDecoration: 'none', flexShrink: 0
      }}>
        Hearth<span style={{ color: '#C47B2B', fontStyle: 'italic' }}>.</span>
      </a>

      <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexWrap: 'wrap' }}>
        <a href="/guides" style={linkStyle}>Guides</a>
        <a href="/neighbors" style={linkStyle}>Neighbor Network</a>
        <a href="/about" style={linkStyle}>About</a>

        {user ? (
          <>
            <a href="/dashboard" style={linkStyle}>My Home</a>
            <a href="/log" style={linkStyle}>Contractor Log</a>
            <a href="/report" style={linkStyle}>Report Card</a>
            <button onClick={handleLogout} style={{
              background: 'none', border: '1px solid rgba(248,244,238,0.2)',
              color: 'rgba(248,244,238,0.7)', fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px', padding: '6px 12px', borderRadius: '6px',
              cursor: 'pointer', marginLeft: '4px', whiteSpace: 'nowrap'
            }}>Sign out</button>
          </>
        ) : (
          <>
            <a href="/login" style={linkStyle}>Sign in</a>
            <a href="/signup" style={{
              background: '#C47B2B', color: '#fff',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
              fontWeight: 500, padding: '6px 14px', borderRadius: '6px',
              textDecoration: 'none', marginLeft: '4px', whiteSpace: 'nowrap'
            }}>Set up my home</a>
          </>
        )}
      </div>
    </nav>
  )
}