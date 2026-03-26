'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

const CATEGORIES = [
  { key: 'warranty',   label: 'Warranties',             icon: '🛡️', color: '#EAF2EC', textColor: '#3D7A5A' },
  { key: 'permit',     label: 'Permits & Inspections',   icon: '📋', color: '#E6F2F8', textColor: '#3A7CA8' },
  { key: 'manual',     label: 'Appliance Manuals',       icon: '📖', color: '#FBF0DC', textColor: '#C47B2B' },
  { key: 'insurance',  label: 'Insurance Summary',       icon: '🏛️', color: '#F5EAE7', textColor: '#8B3A2A' },
  { key: 'invoice',    label: 'Invoices & Quotes',       icon: '🧾', color: '#EAF2EC', textColor: '#3D7A5A' },
  { key: 'hoa',        label: 'HOA Documents',           icon: '🏘️', color: '#F0EEF8', textColor: '#5A4A8A' },
  { key: 'inspection', label: 'Home Inspection Reports', icon: '🔍', color: '#FBF0DC', textColor: '#C47B2B' },
  { key: 'other',      label: 'Other',                   icon: '📁', color: '#F5F5F5', textColor: '#8A8A82' },
]

const SYSTEMS = [
  'Roof', 'Siding', 'Windows', 'Doors', 'Gutters', 'Deck',
  'Driveway', 'Fencing', 'HVAC', 'Water Heater', 'Electrical',
  'Plumbing', 'Sump Pump', 'Chimney', 'Whole Home', 'Other',
]

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function Documents() {
  const [user, setUser] = useState<any>(null)
  const [home, setHome] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [search, setSearch] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [docDesc, setDocDesc] = useState('')
  const [docCategory, setDocCategory] = useState('other')
  const [docSystem, setDocSystem] = useState('')
  const [docExpires, setDocExpires] = useState('')
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)

      const { data: homes } = await supabase
        .from('homes').select('*').eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false }).limit(1)

      if (!homes || homes.length === 0) { window.location.href = '/onboarding'; return }
      setHome(homes[0])

      const { data: documents } = await supabase
        .from('home_documents')
        .select('*')
        .eq('home_id', homes[0].id)
        .order('created_at', { ascending: false })
      setDocs(documents || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setUploadError('Only PDF, JPG, and PNG files are accepted.')
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      setUploadError('File must be under 10MB.')
      return
    }
    setUploadError('')
    setFile(f)
    if (!docName) setDocName(f.name.replace(/\.[^/.]+$/, ''))
  }

  const handleUpload = async () => {
    if (!file || !docName.trim()) { setUploadError('Please select a file and enter a name.'); return }
    setUploading(true)
    setUploadError('')
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${user.id}/${home.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('home-documents')
        .upload(filePath, file, { contentType: file.type })
      if (uploadErr) throw uploadErr
      const { data: doc } = await supabase.from('home_documents').insert({
        home_id: home.id,
        user_id: user.id,
        name: docName.trim(),
        description: docDesc.trim() || null,
        category: docCategory,
        system_type: docSystem || null,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        expires_at: docExpires || null,
      }).select().single()
      if (doc) setDocs(prev => [doc, ...prev])
      setFile(null); setDocName(''); setDocDesc(''); setDocCategory('other')
      setDocSystem(''); setDocExpires(''); setShowUpload(false)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: any) {
      setUploadError(e.message)
    }
    setUploading(false)
  }

  const handleDownload = async (doc: any) => {
    const { data } = await supabase.storage
      .from('home-documents')
      .createSignedUrl(doc.file_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const handleDelete = async (doc: any) => {
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    await supabase.storage.from('home-documents').remove([doc.file_path])
    await supabase.from('home_documents').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  const filteredDocs = docs.filter(d => {
    const matchCategory = filterCategory === 'all' || d.category === filterCategory
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const formatSize = (bytes: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid rgba(30,58,47,0.2)',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    background: '#fff',
    color: '#1A1A18',
    boxSizing: 'border-box',
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#8A8A82' }}>Loading documents...</p>
    </div>
  )

  const docsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    docs: filteredDocs.filter(d => d.category === cat.key),
  })).filter(cat => cat.docs.length > 0)

  const expiringDocs = docs.filter(d => {
    if (!d.expires_at) return false
    const days = Math.ceil((new Date(d.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 90 && days > 0
  })

  const activeCategory = CATEGORIES.find(c => c.key === filterCategory)
  const displayGroups = filterCategory === 'all'
    ? docsByCategory
    : activeCategory
      ? [{ ...activeCategory, docs: filteredDocs }]
      : []

  return (
    <main style={{ background: '#F8F4EE', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      <div style={{ background: '#1E3A2F', padding: '36px 32px 40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#6AAF8A', marginBottom: '8px' }}>Document Vault</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 4vw, 36px)', color: '#F8F4EE', fontWeight: 400, marginBottom: '6px' }}>
                {home?.address}
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(248,244,238,0.55)' }}>
                {docs.length} document{docs.length !== 1 ? 's' : ''} stored · Transfers with your home
              </p>
            </div>
            <button
              onClick={() => setShowUpload(!showUpload)}
              style={{ background: '#C47B2B', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
            >
              + Upload document
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 28px 64px' }}>

        <div style={{ background: '#EAF2EC', border: '1px solid rgba(61,122,90,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>🔒</span>
          <div style={{ fontSize: '12px', color: '#3D7A5A', lineHeight: 1.6 }}>
            <strong>Your documents are private.</strong> Only you and approved co-owners can access them. Only upload home-related documents like warranties, permits, and manuals. Do not upload documents containing personal financial, tax, or identity information.
          </div>
        </div>

        {expiringDocs.length > 0 && (
          <div style={{ background: '#FBF0DC', border: '1px solid rgba(196,123,43,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#7A4A10', marginBottom: '6px' }}>
              ⚠️ {expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''} expiring soon
            </div>
            {expiringDocs.map(d => {
              const days = Math.ceil((new Date(d.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <div key={d.id} style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '2px' }}>
                  {d.name} — expires in {days} days
                </div>
              )
            })}
          </div>
        )}

        {showUpload && (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#1E3A2F', marginBottom: '16px' }}>Upload a document</h3>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed rgba(30,58,47,0.2)', borderRadius: '12px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: file ? '#EAF2EC' : '#F8F4EE', marginBottom: '16px' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{file ? '✅' : '📎'}</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F', marginBottom: '4px' }}>
                {file ? file.name : 'Click to select a file'}
              </div>
              <div style={{ fontSize: '12px', color: '#8A8A82' }}>
                {file ? formatSize(file.size) : 'PDF, JPG, or PNG · Max 10MB'}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>Document name *</label>
                <input value={docName} onChange={e => setDocName(e.target.value)} style={inputStyle} placeholder="e.g. Roof warranty 2021" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>Description (optional)</label>
                <input value={docDesc} onChange={e => setDocDesc(e.target.value)} style={inputStyle} placeholder="e.g. 10-year workmanship warranty from ABC Roofing" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>Category *</label>
                  <select value={docCategory} onChange={e => setDocCategory(e.target.value)} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>Related system (optional)</label>
                  <select value={docSystem} onChange={e => setDocSystem(e.target.value)} style={inputStyle}>
                    <option value="">None</option>
                    {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>Expiration date (optional — for warranties)</label>
                <input type="date" value={docExpires} onChange={e => setDocExpires(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {uploadError && (
              <div style={{ background: '#FDECEA', color: '#9B2C2C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '12px' }}>
                {uploadError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                style={{ flex: 2, background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: uploading || !file ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: uploading || !file ? 0.6 : 1 }}
              >
                {uploading ? 'Uploading...' : 'Upload document'}
              </button>
              <button
                onClick={() => { setShowUpload(false); setFile(null); setUploadError('') }}
                style={{ flex: 1, background: 'none', border: '1px solid rgba(30,58,47,0.2)', color: '#8A8A82', padding: '11px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {docs.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
            />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
              <option value="all">All categories</option>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
            </select>
          </div>
        )}

        {docs.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <button
              onClick={() => setFilterCategory('all')}
              style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: '1px solid rgba(30,58,47,0.15)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: filterCategory === 'all' ? '#1E3A2F' : '#fff', color: filterCategory === 'all' ? '#F8F4EE' : '#1E3A2F' }}
            >
              All ({docs.length})
            </button>
            {CATEGORIES.filter(c => docs.some(d => d.category === c.key)).map(cat => (
              <button
                key={cat.key}
                onClick={() => setFilterCategory(cat.key)}
                style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: `1px solid ${cat.textColor}33`, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: filterCategory === cat.key ? cat.textColor : cat.color, color: filterCategory === cat.key ? '#fff' : cat.textColor }}
              >
                {cat.icon} {cat.label} ({docs.filter(d => d.category === cat.key).length})
              </button>
            ))}
          </div>
        )}

        {docs.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '56px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#1E3A2F', marginBottom: '8px' }}>No documents yet</h3>
            <p style={{ fontSize: '14px', color: '#8A8A82', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto 24px' }}>
              Store warranties, permits, inspection reports, and manuals here. They transfer automatically when you pass ownership of your home.
            </p>
            <button
              onClick={() => setShowUpload(true)}
              style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              Upload your first document
            </button>
          </div>
        )}

        {filteredDocs.length > 0 && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {displayGroups.map(cat => (
              <div key={cat.key} style={{ background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(30,58,47,0.08)', display: 'flex', alignItems: 'center', gap: '10px', background: cat.color }}>
                  <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                  <h4 style={{ fontSize: '14px', fontWeight: 500, color: cat.textColor }}>{cat.label}</h4>
                  <span style={{ fontSize: '12px', color: cat.textColor, opacity: 0.7, marginLeft: 'auto' }}>{cat.docs.length} file{cat.docs.length !== 1 ? 's' : ''}</span>
                </div>
                {cat.docs.map((doc: any, i: number) => {
                  const isExpiring = doc.expires_at && Math.ceil((new Date(doc.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 90
                  const isPdf = doc.file_type === 'application/pdf'
                  const isImage = doc.file_type?.startsWith('image/')
                  return (
                    <div key={doc.id} style={{ padding: '14px 20px', borderBottom: i < cat.docs.length - 1 ? '1px solid rgba(30,58,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ fontSize: '24px', flexShrink: 0 }}>
                        {isPdf ? '📄' : isImage ? '🖼️' : '📎'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#1E3A2F' }}>{doc.name}</span>
                          {doc.system_type && (
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: '#EDE8E0', color: '#8A8A82' }}>{doc.system_type}</span>
                          )}
                          {isExpiring && (
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: '#FBF0DC', color: '#C47B2B' }}>⏰ Expires soon</span>
                          )}
                        </div>
                        {doc.description && (
                          <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '2px' }}>{doc.description}</div>
                        )}
                        <div style={{ fontSize: '11px', color: '#8A8A82' }}>
                          {formatSize(doc.file_size)}
                          {doc.expires_at && ` · Expires ${new Date(doc.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                          {` · Added ${new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          onClick={() => handleDownload(doc)}
                          style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
                        >
                          {isImage ? 'View' : 'Download'}
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          style={{ background: 'none', border: '1px solid rgba(155,44,44,0.2)', color: '#9B2C2C', padding: '7px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {filteredDocs.length === 0 && docs.length > 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8A8A82', fontSize: '14px' }}>
            No documents match your search.
          </div>
        )}
      </div>
    </main>
  )
}