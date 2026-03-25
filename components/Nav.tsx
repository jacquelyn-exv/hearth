'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function Nav() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()
        setRole(roleData?.role || 'homeowner')
        await loadNotifications(user.id)
      }
      setLoading(false)
    }
    load()
  }, [])

  const loadNotifications = async (userId: string) => {
    const { data: homes } = await supabase
      .from('homes')
      .select('id, address')
      .eq('user_id', userId)

    if (!homes || homes.length === 0) return

    const homeIds = homes.map(h => h.id)
    const homeMap: Record<string, string> = {}
    homes.forEach(h => { homeMap[h.id] = h.address })

    const [{ data: memberRequests }, { data: transferRequests }] = await Promise.all([
      supabase.from('home_members')
        .select('*')
        .in('home_id', homeIds)
        .eq('status', 'pending'),
      supabase.from('ownership_transfers')
        .select('*')
        .in('home_id', homeIds)
        .eq('status', 'pending')
    ])

    const items: any[] = []

    memberRequests?.forEach(r => {
      items.push({
        id: r.id,
        type: r.role === 'co_owner' ? 'co_owner' : 'viewer',
        home_id: r.home_id,
        address: homeMap[r.home_id],
        user_id: r.user_id,
        created_at: r.created_at,
        table: 'home_members'
      })
    })

    transferRequests?.forEach(r => {
      items.push({
        id: r.id,
        type: 'transfer',
        home_id: r.home_id,
        address: homeMap[r.home_id],
        to_email: r.to_email,
        message: r.message,
        expires_at: r.expires_at,
        created_at: r.created_at,
        table: 'ownership_transfers'
      })
    })

    setNotifications(items)
  }

  const handleApprove = async (notif: any) => {
    if (notif.type === 'transfer') {
      await supabase.rpc('accept_ownership_transfer', { p_transfer_id: notif.id })
    } else {
      await supabase.rpc('approve_home_member', { p_member_id: notif.id })
    }
    setNotifications(prev => prev.filter(n => n.id !== notif.id))
  }

  const handleDecline = async (notif: any) => {
    if (notif.type === 'transfer') {
      await supabase.from('ownership_transfers').update({ status: 'declined' }).eq('id', notif.id)
    } else {
      await supabase.from('home_members').update({ status: 'declined' }).eq('id', notif.id)
    }
    setNotifications(prev => prev.filter(n => n.id !== notif.id))
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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

  const pendingCount = notifications.length

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
        H<em style={{ color: '#C47B2B', fontStyle: 'italic' }}>e</em>arth
      </a>

      <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexWrap: 'wrap' }}>
        <a href="/guides" style={linkStyle}>Guides</a>
        <a href="/neighbors" style={linkStyle}>Neighbor Network</a>
        <a href="/about" style={linkStyle}>About</a>

        {user ? (
          <>
            {role === 'admin' && (
              <a href="/admin" style={{ ...linkStyle, color: '#C47B2B' }}>Admin</a>
            )}
            <a href="/dashboard" style={linkStyle}>My Home</a>
            <a href="/log" style={linkStyle}>Contractor Log</a>
            <a href="/report" style={linkStyle}>Report Card</a>

            {/* Notification bell */}
            <div ref={bellRef} style={{ position: 'relative', marginLeft: '4px' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  position: 'relative', padding: '6px 8px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '18px' }}>🔔</span>
                {pendingCount > 0 && (
                  <div style={{
                    position: 'absolute', top: '2px', right: '2px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: '#C47B2B', color: '#fff',
                    fontSize: '10px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'DM Sans', sans-serif"
                  }}>{pendingCount}</div>
                )}
              </button>

              {/* Dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '48px', right: 0,
                  width: '380px', background: '#fff',
                  borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  border: '1px solid rgba(30,58,47,0.11)',
                  overflow: 'hidden', zIndex: 300
                }}>
                  <div style={{
                    padding: '14px 18px', borderBottom: '1px solid rgba(30,58,47,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>Notifications</h4>
                    {pendingCount > 0 && (
                      <span style={{ fontSize: '11px', color: '#8A8A82' }}>{pendingCount} pending</span>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
                      <p style={{ fontSize: '13px', color: '#8A8A82' }}>You&apos;re all caught up</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {notifications.map(notif => (
                        <div key={notif.id} style={{
                          padding: '14px 18px',
                          borderBottom: '1px solid rgba(30,58,47,0.06)'
                        }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '22px', flexShrink: 0 }}>
                              {notif.type === 'transfer' ? '🔑' : notif.type === 'co_owner' ? '🤝' : '👁️'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '3px' }}>
                                {notif.type === 'transfer'
                                  ? 'Ownership transfer request'
                                  : notif.type === 'co_owner'
                                  ? 'Co-owner access request'
                                  : 'View-only access request'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>
                                {notif.address}
                              </div>
                              {notif.type === 'transfer' && notif.message && (
                                <div style={{ fontSize: '12px', color: '#4A4A44', background: '#F8F4EE', borderRadius: '6px', padding: '6px 8px', marginBottom: '6px', fontStyle: 'italic' }}>
                                  &ldquo;{notif.message}&rdquo;
                                </div>
                              )}
                              {notif.type === 'transfer' && (
                                <div style={{ fontSize: '11px', color: '#C47B2B', marginBottom: '8px' }}>
                                  Auto-transfers {new Date(notif.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} if no action
                                </div>
                              )}
                              <div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '10px' }}>
                                {new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleApprove(notif)}
                                  style={{
                                    flex: 1, background: '#1E3A2F', color: '#F8F4EE',
                                    border: 'none', padding: '7px 12px', borderRadius: '6px',
                                    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                                    fontFamily: "'DM Sans', sans-serif"
                                  }}
                                >
                                  {notif.type === 'transfer' ? 'Approve transfer' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleDecline(notif)}
                                  style={{
                                    flex: 1, background: 'none',
                                    border: '1px solid rgba(155,44,44,0.3)',
                                    color: '#9B2C2C', padding: '7px 12px', borderRadius: '6px',
                                    fontSize: '12px', cursor: 'pointer',
                                    fontFamily: "'DM Sans', sans-serif"
                                  }}
                                >Decline</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{
              background: 'none', border: '1px solid rgba(248,244,238,0.2)',
              color: 'rgba(248,244,238,0.7)', fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
              marginLeft: '4px', whiteSpace: 'nowrap'
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