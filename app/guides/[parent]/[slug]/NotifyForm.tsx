'use client'

import { useState } from 'react'

export function NotifyForm({ topic }: { topic: string }) {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  if (done) return (
    <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', color: '#3D7A5A', fontWeight: 500 }}>
      Got it — we will email you when it is published.
    </p>
  )

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        style={{ flex: 1, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', border: '1px solid rgba(30,58,47,0.15)', borderRadius: '10px', padding: '10px 14px', outline: 'none', background: '#F8F4EE' }}
      />
      <button
        onClick={() => { if (email.trim()) { console.log({ email, topic }); setDone(true) } }}
        style={{ background: '#1E3A2F', color: '#F8F4EE', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 500, border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        Notify me
      </button>
    </div>
  )
}
