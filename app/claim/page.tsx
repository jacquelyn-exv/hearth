'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

const ROLE_OPTIONS = [
  { key: 'transfer', label: 'New owner — I purchased this home', desc: 'Request full ownership transfer. Current owner notified, 30 days to respond or it escalates to Hearth admin.', icon: '🔑' },
  { key: 'co_owner', label: 'Co-owner — I live here too', desc: 'Request co-owner access. Full read/write, can log jobs and assign tasks.', icon: '🤝' },
  { key: 'property_manager', label: 'Property manager', desc: 'Manage maintenance and contractors on behalf of the owner.', icon: '🏢' },
  { key: 'realtor', label: 'Realtor / agent', desc: 'View property history for listing or buyer representation. Read-only access.', icon: '🏷️' },
  { key: 'viewer', label: 'Viewer only', desc: 'Read-only access to home details and history.', icon: '👁️' },
]

const iS: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid rgba(30,58,47,0.2)',
  borderRadius: '8px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', background: '#fff', color: '#1A1A18', boxSizing: 'border-box',
}

export default function ClaimPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [homes, setHomes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedHome, setSelectedHome] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [pendingHome, setPendingHome] = useState<any>(null)
  const [myClaims, setMyClaims] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user || null)
      await loadHomes()
      if (user) {
        const res = await fetch(`/api/property-claims?user_id=${user.id}`)
        const data = await res.json()
        setMyClaims(Array.isArray(data) ? data : [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const loadHomes = async () => {
    const { data } = await supabase
      .from('homes')
      .select('id, address, city, state, zip, year_built, home_type, is_unclaimed, user_id')
      .order('created_at', { ascending: false })
      .limit(20)
    setHomes(data || [])
  }

  const handleSearch = async () => {
    if (!search.trim()) { loadHomes(); return }
    setSearching(true)
    const { data } = await supabase
      .from('homes')
      .select('id, address, city, state, zip, year_built, home_type, is_unclaimed, user_id')
      .or(`address.ilike.%${search}%,city.ilike.%${search}%,zip.ilike.%${search}%`)
      .limit(20)
    setHomes(data || [])
    setSearching(false)
  }

  const handleClaimClick = (home: any) => {
    if (!user) { setPendingHome(home); setShowAuthGate(true); return }
    setSelectedHome(home)
    setSelectedRole(home.is_unclaimed ? 'transfer' : '')
    setMessage('')
    setSubmitted(false)
  }

  const handleSubmit = async () => {
    if (!selectedRole || !selectedHome || !user) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/property-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_id: selectedHome.id, requester_id: user.id, requester_email: user.email, request_type: selectedRole, message: message || null })
      })
      const data = await res.json()
      if (data.status === 'approved') {
        window.location.href = '/dashboard?claimed=true'
      } else if (data.error) {
        alert(data.error)
      } else {
        setSubmitted(true)
        setMyClaims(prev => [{ home_id: selectedHome.id, request_type: selectedRole, status: 'pending', submitted_at: new Date().toISOString(), homes: selectedHome }, ...prev])
      }
    } catch (e) { alert('Something went wrong. Please try again.') }
    setSubmitting(false)
  }

  const getStatusBadge = (status: string) => {
    const s: Record<string, { label: string; bg: string; color: string }> = {
      pending: { label: 'Pending', bg: '#FAEEDA', color: '#633806' },
      approved: { label: 'Approved', bg: '#EAF3DE', color: '#27500A' },
      denied: { label: 'Denied', bg: '#FCEBEB', color: '#791F1F' },
      escalated: { label: 'Under review', bg: '#E6F1FB', color: '#0C447C' },
      cancelled: { label: 'Cancelled', bg: '#F5F5F5', color: '#8A8A82' },
    }
    const st = s[status] || s.pending
    return <span style={{ background: st.bg, color: st.color, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>{st.label}</span>
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#8A8A82' }}>Loading...</p>
    </div>
  )

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />
      <div style={{ background: '#1E3A2F', padding: '48px 32px 56px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '12px' }}>Property Registry</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px,4vw,40px)', fontWeight: 400, color: '#F8F4EE', marginBottom: '12px' }}>Find your home on Hearth</h1>
          <p style={{ fontSize: '14px', color: 'rgba(248,244,238,0.6)', lineHeight: 1.7, maxWidth: '520px' }}>Search for your property, claim it, or request access. Every home on Hearth carries its full maintenance history — even through ownership changes.</p>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 28px 64px' }}>

        {myClaims.filter((c: any) => c.status === 'pending' || c.status === 'escalated').length > 0 && (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#1E3A2F', marginBottom: '12px' }}>Your pending requests</h3>
            {myClaims.filter((c: any) => c.status === 'pending' || c.status === 'escalated').map((claim: any) => (
              <div key={claim.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(30,58,47,0.06)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{claim.homes?.address}</div>
                  <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>{ROLE_OPTIONS.find(r => r.key === claim.request_type)?.label} · {new Date(claim.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  {claim.status === 'escalated' && <div style={{ fontSize: '11px', color: '#0C447C', marginTop: '2px' }}>Under Hearth admin review</div>}
                </div>
                {getStatusBadge(claim.status)}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by address, city, or ZIP..."
            style={{ ...iS, flex: 1 }} />
          <button onClick={handleSearch} disabled={searching}
            style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {searching ? '...' : 'Search'}
          </button>
        </div>

        {homes.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>No homes found</h3>
            <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.7, marginBottom: '16px' }}>Can't find your property? Add it to Hearth and start tracking it today.</p>
            <a href="/onboarding" style={{ display: 'inline-block', background: '#1E3A2F', color: '#F8F4EE', textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>Add my home →</a>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: '#8A8A82' }}>{homes.length} propert{homes.length !== 1 ? 'ies' : 'y'} found</p>
            {homes.map((home: any) => {
              const isUnclaimed = home.is_unclaimed || !home.user_id
              const myExistingClaim = myClaims.find((c: any) => c.home_id === home.id)
              return (
                <div key={home.id} style={{ background: '#fff', border: `1px solid ${isUnclaimed ? 'rgba(196,123,43,0.3)' : 'rgba(30,58,47,0.11)'}`, borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F', marginBottom: '2px' }}>{home.address}</h3>
                      <p style={{ fontSize: '12px', color: '#8A8A82' }}>{home.city}{home.state ? `, ${home.state}` : ''}{home.zip ? ` ${home.zip}` : ''}</p>
                    </div>
                    <span style={{ background: isUnclaimed ? '#FAEEDA' : '#EAF3DE', color: isUnclaimed ? '#633806' : '#27500A', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, flexShrink: 0 }}>
                      {isUnclaimed ? 'Unclaimed' : 'Active'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {home.year_built && <div style={{ fontSize: '12px', color: '#8A8A82' }}>Built <strong style={{ color: '#1E3A2F' }}>{home.year_built}</strong></div>}
                    {home.home_type && <div style={{ fontSize: '12px', color: '#8A8A82', textTransform: 'capitalize' }}>{home.home_type.replace('_', ' ')}</div>}
                  </div>
                  {isUnclaimed && (
                    <div style={{ background: '#FBF0DC', borderRadius: '8px', padding: '9px 12px', marginBottom: '12px', fontSize: '12px', color: '#7A4A10', lineHeight: 1.5 }}>
                      This property has Hearth history but no current owner. Claim it to inherit all records.
                    </div>
                  )}
                  {myExistingClaim ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F8F4EE', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#8A8A82' }}>Your request:</span>
                      {getStatusBadge(myExistingClaim.status)}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!isUnclaimed && (
                        <button onClick={() => handleClaimClick({ ...home, requestMode: 'co_owner' })}
                          style={{ flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', padding: '9px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                          Request access
                        </button>
                      )}
                      <button onClick={() => handleClaimClick(home)}
                        style={{ flex: 1, background: '#C47B2B', color: '#fff', border: 'none', padding: '9px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        {isUnclaimed ? 'Claim this property' : 'Claim ownership'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAuthGate && pendingHome && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAuthGate(false) }}>
          <div style={{ background: '#F8F4EE', borderRadius: '20px', padding: '28px', maxWidth: '380px', width: '100%' }}>
            <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>🏠</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px', textAlign: 'center' }}>Create an account to claim</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.7, textAlign: 'center', marginBottom: '16px' }}>
              <strong style={{ color: '#1E3A2F' }}>{pendingHome.address}</strong> has Hearth history waiting for you. Create a free account to claim it.
            </p>
            <div style={{ background: '#EAF3DE', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#27500A', lineHeight: 1.5 }}>
              Your home history, system records, and maintenance log will transfer to your account.
            </div>
            <a href={`/signup?redirect=/claim&home_id=${pendingHome.id}`}
              style={{ display: 'block', background: '#1E3A2F', color: '#F8F4EE', textDecoration: 'none', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, textAlign: 'center', marginBottom: '8px' }}>
              Create free account
            </a>
            <a href={`/login?redirect=/claim&home_id=${pendingHome.id}`}
              style={{ display: 'block', background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#1E3A2F', textDecoration: 'none', padding: '13px', borderRadius: '10px', fontSize: '14px', textAlign: 'center', marginBottom: '8px' }}>
              Sign in to existing account
            </a>
            <button onClick={() => setShowAuthGate(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#8A8A82', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: '8px' }}>Cancel</button>
          </div>
        </div>
      )}

      {selectedHome && !submitted && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedHome(null) }}>
          <div style={{ background: '#F8F4EE', borderRadius: '20px 20px 0 0', padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F', marginBottom: '2px' }}>Request access</h2>
                <p style={{ fontSize: '12px', color: '#8A8A82' }}>{selectedHome.address} · {selectedHome.city}, {selectedHome.state}</p>
              </div>
              <button onClick={() => setSelectedHome(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#8A8A82' }}>✕</button>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', color: '#8A8A82', marginBottom: '10px' }}>Your relationship to this property</div>
            {ROLE_OPTIONS.map(role => (
              <div key={role.key} onClick={() => setSelectedRole(role.key)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', border: `1px solid ${selectedRole === role.key ? '#1E3A2F' : 'rgba(30,58,47,0.15)'}`, background: selectedRole === role.key ? '#EAF3DE' : '#fff', borderRadius: '10px', cursor: 'pointer', marginBottom: '6px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selectedRole === role.key ? '#1E3A2F' : 'rgba(30,58,47,0.3)'}`, background: selectedRole === role.key ? '#1E3A2F' : 'transparent', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedRole === role.key && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F', marginBottom: '2px' }}>{role.icon} {role.label}</div>
                  <div style={{ fontSize: '11px', color: '#8A8A82', lineHeight: 1.4 }}>{role.desc}</div>
                </div>
              </div>
            ))}
            {selectedRole === 'transfer' && (
              <div style={{ background: '#FAEEDA', borderRadius: '8px', padding: '10px 14px', margin: '10px 0', fontSize: '12px', color: '#633806', lineHeight: 1.5 }}>
                The current owner has 30 days to respond. If no response, this escalates to Hearth admin for review.
              </div>
            )}
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Optional note to current owner (e.g. closing date, agent name)"
              style={{ ...iS, minHeight: '70px', resize: 'vertical', margin: '12px 0' }} />
            <button onClick={handleSubmit} disabled={!selectedRole || submitting}
              style={{ width: '100%', background: selectedRole ? '#C47B2B' : 'rgba(196,123,43,0.3)', color: '#fff', border: 'none', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: selectedRole ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif" }}>
              {submitting ? 'Sending...' : 'Send request'}
            </button>
          </div>
        </div>
      )}

      {submitted && selectedHome && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#F8F4EE', borderRadius: '20px', padding: '32px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{selectedRole === 'transfer' ? '🔑' : selectedRole === 'co_owner' ? '🤝' : '📋'}</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '10px' }}>Request sent</h2>
            <p style={{ fontSize: '13px', color: '#8A8A82', lineHeight: 1.7, marginBottom: '20px' }}>
              {selectedRole === 'transfer' ? "The current owner has been notified. If they don't respond within 30 days, your request escalates to the Hearth team for review." : "The current owner has been notified and needs to approve your request. You'll receive an email once they respond."}
            </p>
            <div style={{ background: '#EAF3DE', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#27500A', lineHeight: 1.5 }}>
              Submitted today · Owner has 30 days to respond · Escalates {new Date(Date.now()+30*24*60*60*1000).toLocaleDateString('en-US',{month:'short',day:'numeric'})} if no response
            </div>
            <button onClick={() => { setSubmitted(false); setSelectedHome(null) }}
              style={{ width: '100%', background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Done
            </button>
          </div>
        </div>
      )}

      <footer style={{ background: '#1E3A2F', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#F8F4EE', marginBottom: '8px' }}>H<em style={{ color: '#C47B2B', fontStyle: 'italic' }}>e</em>arth</div>
        <p style={{ fontSize: '12px', color: 'rgba(248,244,238,0.4)' }}>Know your home. Own your home.</p>
      </footer>
    </main>
  )
}
