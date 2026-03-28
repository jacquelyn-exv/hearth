'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getAppreciationPct, estimateCurrentValue, STATE_NAMES } from '@/lib/fhfaHpi'

const CVV_PROJECTS: Record<string, { roi: number; context: string; category: 'high' | 'low' | 'mid' }> = {
  garage_door: { roi: 268, context: 'Best ROI of any project — returns more than 2.5x the investment at resale.', category: 'high' },
  siding: { roi: 114, context: 'One of the few projects that recoups more than it costs.', category: 'high' },
  entry_door: { roi: 85, context: 'Curb appeal at the front door pays — fiberglass holds up better than steel.', category: 'high' },
  windows: { roi: 76, context: 'Signals to buyers the home has been maintained.', category: 'high' },
  roofing: { roi: 68, context: 'A new roof is one of the first things buyers inspect.', category: 'high' },
  gutters: { roi: 0, context: 'Protects foundation drainage — buyers flag deferred gutters in inspection.', category: 'mid' },
}

const HIGH_ROI = [
  { name: 'Garage door replacement', roi: 268 },
  { name: 'Fiber-cement siding', roi: 114 },
  { name: 'Fiberglass entry door', roi: 85 },
  { name: 'Vinyl window replacement', roi: 76 },
  { name: 'Asphalt roof replacement', roi: 68 },
]

const LOW_ROI = [
  { name: 'Upscale kitchen remodel', roi: 36 },
  { name: 'Primary suite addition', roi: 32 },
  { name: 'Solar installation', roi: 30 },
  { name: 'Upscale bathroom remodel', roi: 42 },
  { name: 'Backyard patio (concrete)', roi: 48 },
]

const iS: any = { width: '100%', padding: '9px 12px', border: '1px solid rgba(30,58,47,0.2)', borderRadius: '8px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", background: '#fff', color: '#1A1A18', outline: 'none' }
const cardS: any = { background: '#fff', border: '1px solid rgba(30,58,47,0.11)', borderRadius: '16px', padding: '20px' }
const rowS: any = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '0.5px solid rgba(30,58,47,0.08)' }
const statS: any = { background: '#F8F4EE', borderRadius: '8px', padding: '10px', textAlign: 'center' as const }
const pillG: any = { display: 'inline-block', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '20px', background: '#EAF2EC', color: '#27500A' }
const pillA: any = { display: 'inline-block', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '20px', background: '#FBF0DC', color: '#633806' }
const pillR: any = { display: 'inline-block', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '20px', background: '#FDECEA', color: '#791F1F' }
const tipS: any = { padding: '16px 18px', border: '0.5px solid rgba(30,58,47,0.11)', borderRadius: '12px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginBottom: '12px' }

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: '6px' }}>
      <button onClick={() => setOpen(!open)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer', color: 'rgba(248,244,238,0.7)', fontWeight: 700, lineHeight: '16px', padding: 0, verticalAlign: 'middle' }}>?</button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'absolute', bottom: '24px', left: '-8px', background: '#1E3A2F', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 14px', width: '260px', fontSize: '12px', color: 'rgba(248,244,238,0.85)', lineHeight: 1.6, zIndex: 100, cursor: 'pointer' }}>
          {text}
          <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.4)', marginTop: '6px' }}>Tap to close</div>
        </div>
      )}
    </span>
  )
}

function InfoTooltipDark({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: '6px' }}>
      <button onClick={() => setOpen(!open)} style={{ background: 'rgba(30,58,47,0.1)', border: '1px solid rgba(30,58,47,0.2)', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer', color: '#8A8A82', fontWeight: 700, lineHeight: '14px', padding: 0, verticalAlign: 'middle' }}>?</button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'absolute', bottom: '24px', left: '-8px', background: '#1E3A2F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 14px', width: '260px', fontSize: '12px', color: 'rgba(248,244,238,0.85)', lineHeight: 1.6, zIndex: 100, cursor: 'pointer' }}>
          {text}
          <div style={{ fontSize: '10px', color: 'rgba(248,244,238,0.4)', marginTop: '6px' }}>Tap to close</div>
        </div>
      )}
    </span>
  )
}

function calcRemainingBalance(principal: number, annualRate: number, termYears: number, yearsPaid: number): number {
  const r = annualRate / 100 / 12
  const n = termYears * 12
  const p = yearsPaid * 12
  if (r === 0) return Math.max(0, principal - (principal / n) * p)
  const mp = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  const balance = principal * Math.pow(1 + r, p) - mp * (Math.pow(1 + r, p) - 1) / r
  return Math.max(0, Math.round(balance))
}

function calcMonthlyPayment(principal: number, annualRate: number, termYears: number): number {
  const r = annualRate / 100 / 12
  const n = termYears * 12
  if (r === 0) return Math.round(principal / n)
  return Math.round(principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))
}

function calcTotalInterest(principal: number, annualRate: number, termYears: number): number {
  const mp = calcMonthlyPayment(principal, annualRate, termYears)
  return Math.max(0, Math.round(mp * termYears * 12 - principal))
}

function calcExtraSavings(principal: number, annualRate: number, termYears: number): { saved: number; yearsCut: number } {
  const r = annualRate / 100 / 12
  const n = termYears * 12
  if (r === 0 || principal <= 0 || termYears <= 0) return { saved: 0, yearsCut: 0 }
  const mp = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  const extra = mp / 12
  const newMp = mp + extra
  let bal = principal, months = 0, totalPaid = 0
  while (bal > 0.01 && months < n * 2) {
    const interest = bal * r
    const prinPaid = Math.min(newMp - interest, bal)
    bal -= prinPaid
    totalPaid += newMp
    months++
  }
  const origTotal = mp * n
  return { saved: Math.max(0, Math.round(origTotal - totalPaid)), yearsCut: Math.max(0, Math.round((n - months) / 12)) }
}

export function FinancialTab({ home, jobs, systems, deferred, thisYearSpend, thisYearJobs }: {
  home: any; jobs: any[]; systems: any[]; deferred: number; thisYearSpend: number; thisYearJobs: number
}) {
  const [details, setDetails] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [purchasePrice, setPurchasePrice] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [purchaseYear, setPurchaseYear] = useState('')
  const [loanTerm, setLoanTerm] = useState('30')
  const [interestRate, setInterestRate] = useState('')
  const [valueOverride, setValueOverride] = useState('')
  const [hasRefinanced, setHasRefinanced] = useState(false)
  const [refiYear, setRefiYear] = useState('')
  const [refiTerm, setRefiTerm] = useState('30')
  const [refiRate, setRefiRate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!home?.id) return
    supabase.from('home_details').select('*').eq('home_id', home.id).single().then(({ data }: { data: any }) => {
      if (data) {
        setDetails(data)
        if (data.purchase_price) setPurchasePrice(String(data.purchase_price))
        if (data.down_payment) setDownPayment(String(data.down_payment))
        if (data.purchase_year) setPurchaseYear(String(data.purchase_year))
        if (data.loan_term) setLoanTerm(String(data.loan_term))
        if (data.interest_rate) setInterestRate(String(data.interest_rate))
        if (data.estimated_value_override) setValueOverride(String(data.estimated_value_override))
        if (data.has_refinanced) setHasRefinanced(true)
        if (data.refi_year) setRefiYear(String(data.refi_year))
        if (data.refi_term) setRefiTerm(String(data.refi_term))
        if (data.refi_rate) setRefiRate(String(data.refi_rate))
      }
    })
  }, [home?.id])

  const save = async () => {
    setSaving(true)
    await supabase.from('home_details').update({
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      down_payment: downPayment ? parseFloat(downPayment) : null,
      purchase_year: purchaseYear ? parseInt(purchaseYear) : null,
      loan_term: loanTerm ? parseInt(loanTerm) : null,
      interest_rate: interestRate ? parseFloat(interestRate) : null,
      estimated_value_override: valueOverride ? parseFloat(valueOverride) : null,
      has_refinanced: hasRefinanced,
      refi_year: refiYear ? parseInt(refiYear) : null,
      refi_term: refiTerm ? parseInt(refiTerm) : null,
      refi_rate: refiRate ? parseFloat(refiRate) : null,
    }).eq('home_id', home.id)
    const { data } = await supabase.from('home_details').select('*').eq('home_id', home.id).single()
    if (data) {
      setDetails(data)
      if (data.purchase_price) setPurchasePrice(String(data.purchase_price))
      if (data.down_payment) setDownPayment(String(data.down_payment))
      if (data.purchase_year) setPurchaseYear(String(data.purchase_year))
      if (data.loan_term) setLoanTerm(String(data.loan_term))
      if (data.interest_rate) setInterestRate(String(data.interest_rate))
      if (data.estimated_value_override) setValueOverride(String(data.estimated_value_override))
      if (data.has_refinanced) setHasRefinanced(!!data.has_refinanced)
      if (data.refi_year) setRefiYear(String(data.refi_year))
      if (data.refi_term) setRefiTerm(String(data.refi_term))
      if (data.refi_rate) setRefiRate(String(data.refi_rate))
    }
    setSaving(false)
    setEditing(false)
  }

  const pp = details?.purchase_price || 0
  const dp = details?.down_payment || 0
  const py = details?.purchase_year || 0
  const stateAbbr = home?.state || 'MD'
  const currentYear = new Date().getFullYear()
  const loanPrincipal = Math.max(0, pp - dp)

  // Use refi terms if refinanced, otherwise original loan terms
  const activeRefi = hasRefinanced && refiYear && refiRate
  const lt = activeRefi ? (parseInt(refiTerm) || 30) : (details?.loan_term || 30)
  const ir = activeRefi ? parseFloat(refiRate) : (details?.interest_rate || 0)
  const loanStartYear = activeRefi ? parseInt(refiYear) : py
  const yearsPaid = loanStartYear ? Math.max(0, currentYear - loanStartYear) : 0
  const activeLoanPrincipal = activeRefi ? (details?.refi_rate ? calcRemainingBalance(loanPrincipal, details?.interest_rate || ir, details?.loan_term || lt, py ? Math.max(0, parseInt(refiYear) - py) : 0) : loanPrincipal) : loanPrincipal

  const fhfaEst = pp && py ? estimateCurrentValue(pp, stateAbbr, py) : null
  const appreciationPct = pp && py ? getAppreciationPct(stateAbbr, py) : 0
  const estValue = details?.estimated_value_override || fhfaEst?.mid || 0
  const remainingBal = activeLoanPrincipal && ir && lt ? calcRemainingBalance(activeLoanPrincipal, ir, lt, yearsPaid) : 0
  const estEquity = estValue ? (remainingBal ? estValue - remainingBal : (dp || 0) + Math.round(pp * (appreciationPct / 100))) : 0
  const equityPct = estValue ? Math.round((estEquity / estValue) * 100) : 0
  const totalInterest = activeLoanPrincipal && ir && lt ? calcTotalInterest(activeLoanPrincipal, ir, lt) : 0
  const remainingInterest = remainingBal && ir && lt ? calcTotalInterest(remainingBal, ir, Math.max(1, lt - yearsPaid)) : 0
  const interestPaidEst = Math.max(0, totalInterest - remainingInterest)
  const monthlyPmt = activeLoanPrincipal && ir && lt ? calcMonthlyPayment(activeLoanPrincipal, ir, lt) : 0
  const extraSavings = remainingBal && ir && lt ? calcExtraSavings(remainingBal, ir, Math.max(1, lt - yearsPaid)) : null
  const budget1pct = estValue ? Math.round(estValue * 0.01) : 0
  const agentFee = estValue ? Math.round(estValue * 0.055) : 0
  const closingCost = estValue ? Math.round(estValue * 0.02) : 0
  const netProceeds = estValue ? estValue - agentFee - closingCost - remainingBal : 0
  const hasBasic = !!(pp && dp && py)
  const hasLoan = !!(hasBasic && ir && lt)
  const activeRate = ir
  const freddie = { rate30: 6.81, rate15: 6.10 }

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString()
  const fmtK = (n: number) => n >= 1000 ? '$' + Math.round(n / 1000) + 'k' : fmt(n)

  const milestones = [
    { pct: 20, label: '20% equity', desc: 'Remove PMI · save $200–400/mo' },
    { pct: 25, label: '25% equity', desc: 'Better HELOC rates · stronger borrowing position' },
    { pct: 40, label: '40% equity', desc: 'Prime HELOC terms' },
    { pct: 50, label: '50% equity', desc: 'Strong sale position' },
  ]

  return (
    <div style={{ display: 'grid', gap: '20px' }}>

      {/* DARK HEADER */}
      <div style={{ background: '#1E3A2F', borderRadius: '16px', padding: '28px 32px' }}>
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'rgba(248,244,238,0.45)', marginBottom: '16px' }}>Financial Intelligence · powered by your purchase details</div>
        {!hasBasic ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '14px', color: 'rgba(248,244,238,0.7)', marginBottom: '12px' }}>Add your purchase details below to unlock your equity dashboard</div>
            <button onClick={() => setEditing(true)} style={{ background: '#C47B2B', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Add purchase details</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '18px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.5)', marginBottom: '5px' }}>Estimated home value</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 600, color: '#F8F4EE', marginBottom: '2px' }}>{estValue ? fmt(estValue) : '—'}</div>
                <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.4)' }}>{details?.estimated_value_override ? 'Your estimate' : `FHFA HPI · ${STATE_NAMES[stateAbbr] || stateAbbr} +${appreciationPct}% since ${py}`}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.5)', marginBottom: '5px' }}>
                  Estimated equity
                  <InfoTooltip text="Equity is the portion of your home you actually own — the difference between what your home is worth and what you still owe on your mortgage. It grows as your home appreciates in value and as you pay down your loan. If your home is worth $568,000 and you owe $306,000, your equity is $262,000." />
                </div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 600, color: '#6AAF8A', marginBottom: '2px' }}>{estEquity ? fmt(estEquity) : '—'}</div>
                <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.4)' }}>{remainingBal ? 'Value minus remaining balance' : 'Based on down payment + appreciation'}</div>
              </div>
              {hasLoan && <div>
                <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.5)', marginBottom: '5px' }}>Remaining balance</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 600, color: '#F8F4EE', marginBottom: '2px' }}>{fmt(remainingBal)}</div>
                <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.4)' }}>Est. after {yearsPaid} yrs of payments</div>
              </div>}
              {hasLoan && <div>
                <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.5)', marginBottom: '5px' }}>Interest paid to date</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 600, color: '#E2A96A', marginBottom: '2px' }}>{fmt(interestPaidEst)}</div>
                <div style={{ fontSize: '11px', color: 'rgba(248,244,238,0.4)' }}>Of {fmt(totalInterest)} total over loan life</div>
              </div>}
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ width: `${Math.min(100, Math.max(0, equityPct))}%`, height: '100%', background: '#6AAF8A', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(248,244,238,0.35)' }}>
              <span>Purchase {fmt(pp)} · {py}</span><span>{equityPct}% equity built</span><span>Est. value {estValue ? fmt(estValue) : '—'} today</span>
            </div>
          </>
        )}
      </div>

      {/* PURCHASE DETAILS + VALUE + RATES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={cardS}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F' }}>Purchase details</div>
            <button onClick={() => setEditing(!editing)} style={{ fontSize: '12px', color: '#3D7A5A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0 }}>{editing ? 'Cancel' : 'Edit'}</button>
          </div>
          <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '1rem' }}>These 4 fields drive everything above. Loan details unlock more.</div>
          {editing ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Purchase price <span style={{ color: '#9B2C2C' }}>*</span></label><input value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} style={iS} placeholder="e.g. 400000" type="number" /></div>
              <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Down payment <span style={{ color: '#9B2C2C' }}>*</span></label><input value={downPayment} onChange={e => setDownPayment(e.target.value)} style={iS} placeholder="e.g. 80000" type="number" /></div>
              <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Purchase year <span style={{ color: '#9B2C2C' }}>*</span></label><input value={purchaseYear} onChange={e => setPurchaseYear(e.target.value)} style={iS} placeholder="e.g. 2018" type="number" min="1970" max={currentYear} /></div>
              <div style={{ padding: '8px 10px', background: '#EAF2EC', borderRadius: '8px', fontSize: '11px', color: '#27500A', lineHeight: 1.5 }}>Add loan term + interest rate to unlock personalized mortgage savings calculations</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Loan term</label><select value={loanTerm} onChange={e => setLoanTerm(e.target.value)} style={iS}><option value="30">30 years</option><option value="25">25 years</option><option value="20">20 years</option><option value="15">15 years</option></select></div>
                <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Interest rate %</label><input value={interestRate} onChange={e => setInterestRate(e.target.value)} style={iS} placeholder="e.g. 6.5" type="number" step="0.01" /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Your own value estimate (optional)</label><input value={valueOverride} onChange={e => setValueOverride(e.target.value)} style={iS} placeholder="e.g. 550000" type="number" /></div>
              <div style={{ borderTop: '0.5px solid rgba(30,58,47,0.1)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', color: '#1E3A2F', fontWeight: 500 }}>Have you refinanced?</label>
                  <button onClick={() => setHasRefinanced(!hasRefinanced)} style={{ background: hasRefinanced ? '#1E3A2F' : '#F8F4EE', color: hasRefinanced ? '#F8F4EE' : '#8A8A82', border: '1px solid rgba(30,58,47,0.2)', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{hasRefinanced ? 'Yes' : 'No'}</button>
                </div>
                {hasRefinanced && (
                  <div style={{ display: 'grid', gap: '10px', padding: '12px', background: '#F8F4EE', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#8A8A82', lineHeight: 1.5 }}>Enter your refinanced loan details — these replace the original terms for mortgage calculations. Your purchase year stays the same for home value estimates.</div>
                    <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Year you refinanced</label><input value={refiYear} onChange={e => setRefiYear(e.target.value)} style={iS} placeholder="e.g. 2021" type="number" min="1990" max={currentYear} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>New loan term</label><select value={refiTerm} onChange={e => setRefiTerm(e.target.value)} style={iS}><option value="30">30 years</option><option value="25">25 years</option><option value="20">20 years</option><option value="15">15 years</option></select></div>
                      <div><label style={{ display: 'block', fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>New interest rate %</label><input value={refiRate} onChange={e => setRefiRate(e.target.value)} style={iS} placeholder="e.g. 5.25" type="number" step="0.01" /></div>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={save} disabled={saving || !purchasePrice || !downPayment || !purchaseYear} style={{ background: '#1E3A2F', color: '#F8F4EE', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving || !purchasePrice || !downPayment || !purchaseYear ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save details'}</button>
            </div>
          ) : (
            <div>
              <div style={rowS}><span style={{ fontSize: '13px', color: '#8A8A82' }}>Purchase price <span style={{ color: '#9B2C2C', fontSize: '10px' }}>required</span></span><span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{pp ? fmt(pp) : <span style={{ color: '#C47B2B' }}>Not set</span>}</span></div>
              <div style={rowS}><span style={{ fontSize: '13px', color: '#8A8A82' }}>Down payment <span style={{ color: '#9B2C2C', fontSize: '10px' }}>required</span></span><span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{dp ? `${fmt(dp)} · ${pp ? Math.round(dp / pp * 100) : 0}%` : <span style={{ color: '#C47B2B' }}>Not set</span>}</span></div>
              <div style={rowS}><span style={{ fontSize: '13px', color: '#8A8A82' }}>Purchase year <span style={{ color: '#9B2C2C', fontSize: '10px' }}>required</span></span><span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{py || <span style={{ color: '#C47B2B' }}>Not set</span>}</span></div>
              <div style={rowS}><span style={{ fontSize: '13px', color: '#8A8A82' }}>State</span><span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{STATE_NAMES[stateAbbr] || stateAbbr}</span></div>
              <div style={rowS}><span style={{ fontSize: '13px', color: '#8A8A82' }}>Loan term <span style={{ fontSize: '10px', color: '#C47B2B' }}>unlocks more</span></span><span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{details?.loan_term ? `${details.loan_term} years` : <span style={{ color: '#8A8A82' }}>Not set</span>}</span></div>
              <div style={rowS}><span style={{ fontSize: '13px', color: '#8A8A82' }}>Interest rate <span style={{ fontSize: '10px', color: '#C47B2B' }}>unlocks more</span></span><span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{details?.interest_rate ? `${details.interest_rate}%` : <span style={{ color: '#8A8A82' }}>Not set</span>}</span></div>
              <div style={rowS}><span style={{ fontSize: '13px', color: '#8A8A82' }}>Refinanced</span><span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{hasRefinanced ? `Yes · ${refiYear || '—'} · ${refiTerm}yr · ${refiRate}%` : 'No'}</span></div>
              <div style={{ ...rowS, borderBottom: 'none' }}><span style={{ fontSize: '13px', color: '#8A8A82' }}>Value estimate <span style={{ fontSize: '10px', color: '#8A8A82' }}>optional</span></span><span style={{ fontSize: '12px', color: '#3D7A5A', cursor: 'pointer' }} onClick={() => setEditing(true)}>{details?.estimated_value_override ? fmt(details.estimated_value_override) : 'Override →'}</span></div>
              {!hasBasic && <button onClick={() => setEditing(true)} style={{ marginTop: '12px', width: '100%', background: '#C47B2B', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Add purchase details</button>}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={cardS}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '3px' }}>Value estimate</div>
            <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '10px' }}>{fhfaEst ? `FHFA HPI · ${STATE_NAMES[stateAbbr] || stateAbbr} · +${appreciationPct}% since ${py}` : 'Add purchase details to see your estimate'}</div>
            {fhfaEst ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div style={statS}><div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Low</div><div style={{ fontSize: '16px', fontWeight: 500, color: '#1E3A2F' }}>{fmtK(fhfaEst.low)}</div></div>
                  <div style={{ background: '#EAF2EC', borderRadius: '8px', padding: '10px', textAlign: 'center' as const }}><div style={{ fontSize: '11px', color: '#27500A', marginBottom: '3px' }}>{details?.estimated_value_override ? 'Your estimate' : 'Mid estimate'}</div><div style={{ fontSize: '16px', fontWeight: 500, color: '#27500A' }}>{fmtK(estValue)}</div></div>
                  <div style={statS}><div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>High</div><div style={{ fontSize: '16px', fontWeight: 500, color: '#1E3A2F' }}>{fmtK(fhfaEst.high)}</div></div>
                </div>
                <div style={{ fontSize: '11px', color: '#8A8A82', lineHeight: 1.6, marginBottom: '6px' }}>This uses regional average appreciation from the FHFA HPI. It is not an appraisal and should not be used for financial decisions without professional verification.</div>
              </>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#8A8A82', fontSize: '13px' }}>Add purchase price, year and state to see your estimated value range.</div>
            )}
            <div style={{ fontSize: '11px', color: '#8A8A82' }}>Source: <a href="https://www.fhfa.gov/data/hpi" target="_blank" rel="noopener noreferrer" style={{ color: '#3D7A5A' }}>FHFA House Price Index®</a> · fhfa.gov · Public domain U.S. government data.</div>
          </div>

          <div style={cardS}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '3px' }}>Current avg mortgage rates</div>
            <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '10px' }}>Freddie Mac weekly survey{ir ? ` · compare to your ${ir}%` : ''}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={statS}><div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>30-year fixed avg</div><div style={{ fontSize: '20px', fontWeight: 500, color: '#1E3A2F' }}>{freddie.rate30}%</div>{ir ? <div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>vs your {ir}%</div> : null}</div>
              <div style={statS}><div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>15-year fixed avg</div><div style={{ fontSize: '20px', fontWeight: 500, color: '#1E3A2F' }}>{freddie.rate15}%</div><div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>lower rate, higher payment</div></div>
            </div>
            {ir ? (
              <div style={{ padding: '8px 10px', background: ir <= freddie.rate30 ? '#EAF2EC' : '#FDECEA', borderRadius: '8px', fontSize: '11px', color: ir <= freddie.rate30 ? '#27500A' : '#791F1F', lineHeight: 1.6 }}>
                {ir <= freddie.rate30 ? `Your rate of ${ir}% is at or below today's 30-yr average. Refinancing likely not beneficial right now unless switching to 15-yr.` : `Your rate of ${ir}% is above today's average of ${freddie.rate30}%. It may be worth exploring refinancing options.`}
                {' '}<a href="https://www.consumerfinance.gov/owning-a-home/explore-rates/" target="_blank" rel="noopener noreferrer" style={{ color: ir <= freddie.rate30 ? '#27500A' : '#791F1F', fontWeight: 500 }}>Explore rates at CFPB →</a>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* EQUITY MILESTONES + SELL TODAY */}
      {hasBasic && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={cardS}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '3px' }}>
              Equity milestone tracker
              <InfoTooltipDark text="Each milestone unlocks new financial options — more equity means lower borrowing costs, better loan terms, and a stronger position when you sell." />
            </div>
            <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '12px' }}>What each milestone unlocks for you</div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {milestones.map(m => {
                const reached = equityPct >= m.pct
                const close = !reached && equityPct >= m.pct - 10
                return (
                  <div key={m.pct} style={{ padding: '10px 12px', background: reached ? '#EAF2EC' : '#F8F4EE', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontSize: '12px', fontWeight: 500, color: reached ? '#27500A' : '#1E3A2F' }}>{m.label}</div><div style={{ fontSize: '11px', color: reached ? '#3D7A5A' : '#8A8A82', marginTop: '2px' }}>{m.desc}</div></div>
                    <span style={reached ? pillG : close ? pillA : { ...pillA, background: '#F8F4EE', color: '#8A8A82', border: '0.5px solid rgba(30,58,47,0.15)' }}>{reached ? 'Reached' : close ? 'In progress' : 'Not yet'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={cardS}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '3px' }}>
              If you sold today
              <InfoTooltipDark text="This is your equity in cash — what you would walk away with after paying off your mortgage and covering the costs of selling. The actual amount varies by agent commission, local closing costs, and your exact payoff balance." />
            </div>
            <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '12px' }}>Estimated net proceeds after costs</div>
            {estValue ? (
              <>
                <div style={rowS}><span style={{ fontSize: '13px', color: '#8A8A82' }}>Est. sale price</span><span style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A2F' }}>{fmt(estValue)}</span></div>
                <div style={rowS}><span style={{ fontSize: '13px', color: '#8A8A82' }}>Agent commission (~5.5%)</span><span style={{ fontSize: '13px', color: '#791F1F' }}>–{fmt(agentFee)}</span></div>
                <div style={rowS}><span style={{ fontSize: '13px', color: '#8A8A82' }}>Closing costs (~2%)</span><span style={{ fontSize: '13px', color: '#791F1F' }}>–{fmt(closingCost)}</span></div>
                {remainingBal > 0 && <div style={rowS}><span style={{ fontSize: '13px', color: '#8A8A82' }}>Remaining mortgage</span><span style={{ fontSize: '13px', color: '#791F1F' }}>–{fmt(remainingBal)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: netProceeds > 0 ? '#EAF2EC' : '#FDECEA', borderRadius: '8px', marginTop: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: netProceeds > 0 ? '#27500A' : '#791F1F' }}>Est. cash in hand</span>
                  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: netProceeds > 0 ? '#27500A' : '#791F1F' }}>~{fmt(netProceeds)}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#8A8A82', lineHeight: 1.6 }}>Agent fees, closing costs, and payoff vary. This is an estimate only. Consult a licensed real estate professional for an accurate net sheet.</div>
              </>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#8A8A82', fontSize: '13px' }}>Add purchase details to see your estimated net proceeds.</div>
            )}
          </div>
        </div>
      )}

      {/* PROJECT ROI */}
      <div style={cardS}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <div><div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '3px' }}>Project ROI impact</div><div style={{ fontSize: '12px', color: '#8A8A82' }}>Every logged job · estimated resale context using national averages</div></div>
          <span style={pillG}>{jobs.length} job{jobs.length !== 1 ? 's' : ''} logged</span>
        </div>
        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#8A8A82', fontSize: '13px' }}>No jobs logged yet. Log a job to see its estimated ROI impact.</div>
        ) : (
          <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
            {jobs.map((job: any) => {
              const price = job.final_price || job.quoted_price
              const sysKey = job.system_type?.toLowerCase().replace(/ /g, '_')
              const cvv = CVV_PROJECTS[sysKey]
              const isHigh = cvv?.category === 'high'
              const bg = isHigh ? '#EAF2EC' : '#F8F4EE'
              const color = isHigh ? '#27500A' : '#1E3A2F'
              const sub = isHigh ? '#3D7A5A' : '#8A8A82'
              return (
                <div key={job.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: bg, borderRadius: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color, marginBottom: '2px' }}>
                      {job.company_name || 'Unlisted contractor'} · {job.system_type?.replace(/_/g, ' ')}
                      {job.job_date ? ` · ${new Date(job.job_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                    </div>
                    <div style={{ fontSize: '11px', color: sub, lineHeight: 1.5 }}>{cvv ? cvv.context : 'Log more details to see resale context for this project.'}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {price ? <div style={{ fontSize: '13px', fontWeight: 500, color }}>{fmt(price)}</div> : <div style={{ fontSize: '11px', color: '#8A8A82' }}>No price logged</div>}
                    {cvv?.roi > 0 && <div style={{ fontSize: '11px', color: sub, marginTop: '2px' }}>{cvv.roi}% avg ROI</div>}
                    {isHigh && <div style={{ fontSize: '11px', color: '#3D7A5A', marginTop: '2px' }}>Adds value ✓</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div style={{ padding: '10px 12px', background: '#F8F4EE', borderRadius: '8px', fontSize: '11px', color: '#8A8A82', lineHeight: 1.6 }}>ROI context uses national averages from the Remodeling Cost vs. Value Report (costvsvalue.com) © 2025 Zonda Media. Actual impact depends on quality of work, materials, and local market. Not a guarantee of value.</div>
      </div>

      {/* HIGH VS LOW ROI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={cardS}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '3px' }}>Projects that add real value</div>
          <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '12px' }}>High ROI at resale · national averages · 2025</div>
          {HIGH_ROI.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < HIGH_ROI.length - 1 ? '0.5px solid rgba(30,58,47,0.08)' : 'none' }}>
              <span style={{ fontSize: '13px', color: '#1E3A2F' }}>{p.name}</span><span style={pillG}>{p.roi}%</span>
            </div>
          ))}
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#8A8A82' }}>Source: <a href="https://www.costvsvalue.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3D7A5A' }}>costvsvalue.com</a> · © 2025 Zonda Media</div>
        </div>
        <div style={cardS}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '3px' }}>Projects that rarely pay off</div>
          <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '12px' }}>Do for enjoyment — not for equity</div>
          {LOW_ROI.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < LOW_ROI.length - 1 ? '0.5px solid rgba(30,58,47,0.08)' : 'none' }}>
              <span style={{ fontSize: '13px', color: '#1E3A2F' }}>{p.name}</span><span style={p.roi < 40 ? pillR : pillA}>{p.roi}%</span>
            </div>
          ))}
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#8A8A82' }}>Source: <a href="https://www.costvsvalue.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3D7A5A' }}>costvsvalue.com</a> · © 2025 Zonda Media</div>
        </div>
      </div>

      {/* FINANCIALLY SAVVY TIPS */}
      <div style={cardS}>
        <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '3px' }}>Become a financially savvy homeowner</div>
        <div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '1.25rem' }}>Educational strategies to build equity faster and manage costs smarter. This is not financial advice — consult a licensed professional for guidance specific to your situation.</div>

        <div style={{ ...tipS, borderLeft: '3px solid #3D7A5A' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#27500A', marginBottom: '8px' }}>Make one extra mortgage payment per year</div>
          <div style={{ fontSize: '12px', color: '#4A4A44', lineHeight: 1.7, marginBottom: '12px' }}>Most homeowners do not realize that making just one extra mortgage payment per year can dramatically shorten their loan and save tens of thousands in interest — without refinancing, changing lenders, or doing anything complicated. The math works because every extra dollar goes directly to principal, which reduces the balance that future interest is calculated on.</div>
          {hasLoan && extraSavings ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '12px' }}>
              <div style={statS}><div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Extra per month</div><div style={{ fontSize: '18px', fontWeight: 500, color: '#1E3A2F' }}>+{fmt(monthlyPmt / 12)}</div><div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>1/12 of your payment</div></div>
              <div style={{ background: '#EAF2EC', borderRadius: '8px', padding: '10px', textAlign: 'center' as const }}><div style={{ fontSize: '11px', color: '#27500A', marginBottom: '3px' }}>Interest saved</div><div style={{ fontSize: '18px', fontWeight: 500, color: '#27500A' }}>~{fmtK(extraSavings.saved)}</div><div style={{ fontSize: '11px', color: '#3D7A5A', marginTop: '2px' }}>based on your loan</div></div>
              <div style={statS}><div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '3px' }}>Years cut</div><div style={{ fontSize: '18px', fontWeight: 500, color: '#1E3A2F' }}>~{extraSavings.yearsCut} yrs</div><div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>off your term</div></div>
            </div>
          ) : (
            <div style={{ padding: '8px 10px', background: '#FBF0DC', borderRadius: '8px', fontSize: '11px', color: '#7A4A10', marginBottom: '12px' }}>Add your loan term and interest rate above to see your personalized savings calculation.</div>
          )}
          <div style={{ padding: '10px 12px', background: '#F8F4EE', borderRadius: '8px', fontSize: '12px', color: '#4A4A44', lineHeight: 1.6, marginBottom: '10px' }}><strong style={{ color: '#1E3A2F' }}>How to do it:</strong> Divide your monthly payment by 12 and add that to each monthly payment. Or save it up and make one lump extra payment each December. Tell your loan servicer to apply it to the principal balance — not future interest or escrow. Check your statement each month to confirm.</div>
          <div style={{ padding: '10px 12px', background: '#FBF0DC', borderRadius: '8px', fontSize: '12px', color: '#7A4A10', lineHeight: 1.6, marginBottom: '10px' }}><strong style={{ color: '#7A4A10' }}>Check first:</strong> Some mortgages have prepayment penalties, though federal law limits these to the first 3 years on most loans. Verify with your servicer before starting. Make sure you have a solid emergency fund before directing extra money to your mortgage — liquid savings should come first.</div>
          <a href="https://www.consumerfinance.gov/ask-cfpb/how-does-paying-down-a-mortgage-work-en-1943/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#3D7A5A', textDecoration: 'none' }}>How paying down a mortgage works · CFPB.gov →</a>
        </div>

        <div style={{ ...tipS, borderLeft: '3px solid #3D7A5A' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#27500A', marginBottom: '8px' }}>Switch to bi-weekly payments — the extra payment that happens automatically</div>
          <div style={{ fontSize: '12px', color: '#4A4A44', lineHeight: 1.7, marginBottom: '12px' }}>Instead of paying your full mortgage once a month, pay half every two weeks. Because there are 52 weeks in a year, you end up making 26 half-payments — which equals 13 full payments instead of 12. That 13th payment sneaks in automatically without you ever feeling like you made an extra payment.</div>
          {monthlyPmt > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={statS}><div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '6px' }}>Monthly schedule</div><div style={{ fontSize: '13px', color: '#8A8A82', marginBottom: '3px' }}>12 × {fmt(monthlyPmt)}</div><div style={{ fontSize: '16px', fontWeight: 500, color: '#1E3A2F' }}>{fmt(monthlyPmt * 12)} / yr</div></div>
              <div style={{ background: '#EAF2EC', borderRadius: '8px', padding: '10px' }}><div style={{ fontSize: '11px', color: '#27500A', marginBottom: '6px' }}>Bi-weekly schedule</div><div style={{ fontSize: '13px', color: '#3D7A5A', marginBottom: '3px' }}>26 × {fmt(monthlyPmt / 2)}</div><div style={{ fontSize: '16px', fontWeight: 500, color: '#27500A' }}>{fmt(monthlyPmt * 13)} / yr</div><div style={{ fontSize: '11px', color: '#3D7A5A', marginTop: '4px', fontWeight: 500 }}>+{fmt(monthlyPmt)} extra · automatically</div></div>
            </div>
          )}
          <div style={{ padding: '10px 12px', background: '#F8F4EE', borderRadius: '8px', fontSize: '12px', color: '#4A4A44', lineHeight: 1.6, marginBottom: '10px' }}><strong style={{ color: '#1E3A2F' }}>Why this works so well:</strong> If you are paid bi-weekly, your mortgage aligns with your paycheck rhythm. Two months per year you will receive 3 paychecks instead of 2 — that is where the 13th full payment comes from. Same interest savings as the extra payment strategy above.</div>
          <div style={{ padding: '10px 12px', background: '#FBF0DC', borderRadius: '8px', fontSize: '12px', color: '#7A4A10', lineHeight: 1.6 }}><strong style={{ color: '#7A4A10' }}>Important:</strong> Do not pay a third party to set up bi-weekly payments — some companies charge $300+ for this service. Contact your loan servicer directly to set it up for free, or simply make an extra half-payment each month on your own schedule.</div>
        </div>

        <div style={{ ...tipS, borderLeft: '3px solid #C47B2B' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#7A4A10', marginBottom: '8px' }}>Use your equity to finance projects smartly — not high-interest debt</div>
          <div style={{ fontSize: '12px', color: '#4A4A44', lineHeight: 1.7, marginBottom: '12px' }}>You have built equity in your home. That equity can work for you when it is time for a major project — at far lower interest rates than personal loans or credit cards. On a $20,000 project the rate difference means thousands of dollars in real savings.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: '#EAF2EC', borderRadius: '8px', padding: '12px', textAlign: 'center' as const }}><div style={{ fontSize: '12px', fontWeight: 500, color: '#27500A', marginBottom: '4px' }}>HELOC</div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#27500A' }}>~8%</div><div style={{ fontSize: '11px', color: '#3D7A5A', marginTop: '4px', lineHeight: 1.4 }}>Secured by home · revolving credit</div></div>
            <div style={statS}><div style={{ fontSize: '12px', fontWeight: 500, color: '#1E3A2F', marginBottom: '4px' }}>Personal loan</div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#1E3A2F' }}>~15%</div><div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '4px', lineHeight: 1.4 }}>Unsecured · fixed term</div></div>
            <div style={{ background: '#FDECEA', borderRadius: '8px', padding: '12px', textAlign: 'center' as const }}><div style={{ fontSize: '12px', fontWeight: 500, color: '#791F1F', marginBottom: '4px' }}>Credit card</div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#791F1F' }}>~24%</div><div style={{ fontSize: '11px', color: '#9B2C2C', marginTop: '4px', lineHeight: 1.4 }}>Highest cost · avoid for large projects</div></div>
          </div>
          <div style={{ padding: '10px 12px', background: '#F8F4EE', borderRadius: '8px', fontSize: '12px', color: '#4A4A44', lineHeight: 1.6, marginBottom: '10px' }}><strong style={{ color: '#1E3A2F' }}>Cash-out refinancing</strong> is another option — you replace your existing mortgage with a larger one and take the difference as cash. This made sense when rates were low but at current rates it means replacing your entire mortgage balance at a higher rate. Run the numbers carefully with a licensed professional before considering this route.</div>
          <div style={{ padding: '10px 12px', background: '#FBF0DC', borderRadius: '8px', fontSize: '12px', color: '#7A4A10', lineHeight: 1.6, marginBottom: '10px' }}><strong style={{ color: '#7A4A10' }}>Critical warning:</strong> A HELOC uses your home as collateral. If you cannot repay it, you risk foreclosure. Only use it for projects that protect or improve your home value — not vacations, cars, or discretionary spending. Always borrow the minimum needed and have a clear repayment plan.</div>
          <a href="https://www.consumerfinance.gov/ask-cfpb/what-is-a-home-equity-line-of-credit-heloc-en-1015/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#C47B2B', textDecoration: 'none' }}>What is a HELOC? · CFPB.gov →</a>
        </div>

        <div style={{ ...tipS, borderLeft: '3px solid #C47B2B' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#7A4A10', marginBottom: '8px' }}>Budget 1% of your home value annually for maintenance</div>
          <div style={{ fontSize: '12px', color: '#4A4A44', lineHeight: 1.7, marginBottom: '12px' }}>The 1% rule is one of the most widely cited guidelines in homeownership — and one of the most ignored. Setting aside 1% of your home value each year creates a maintenance reserve that keeps small problems from becoming expensive emergencies. Deferred maintenance does not stay the same; it compounds. A $500 roof repair ignored for two years can become a $6,000 replacement.</div>
          {budget1pct > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: '#EAF2EC', borderRadius: '8px', padding: '12px', textAlign: 'center' as const }}><div style={{ fontSize: '11px', color: '#27500A', marginBottom: '4px' }}>Your 1% target</div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#27500A' }}>{fmt(budget1pct)}</div><div style={{ fontSize: '11px', color: '#3D7A5A', marginTop: '2px' }}>per year</div></div>
              <div style={statS}><div style={{ fontSize: '11px', color: '#8A8A82', marginBottom: '4px' }}>Monthly reserve</div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#1E3A2F' }}>{fmt(budget1pct / 12)}</div><div style={{ fontSize: '11px', color: '#8A8A82', marginTop: '2px' }}>per month</div></div>
              <div style={{ background: thisYearSpend >= budget1pct ? '#EAF2EC' : '#FDECEA', borderRadius: '8px', padding: '12px', textAlign: 'center' as const }}><div style={{ fontSize: '11px', color: thisYearSpend >= budget1pct ? '#27500A' : '#791F1F', marginBottom: '4px' }}>Spent this year</div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: thisYearSpend >= budget1pct ? '#27500A' : '#791F1F' }}>{fmt(thisYearSpend)}</div><div style={{ fontSize: '11px', color: thisYearSpend >= budget1pct ? '#3D7A5A' : '#9B2C2C', marginTop: '2px' }}>{thisYearSpend >= budget1pct ? 'On track' : `${fmt(budget1pct - thisYearSpend)} behind`}</div></div>
            </div>
          )}
          <div style={{ padding: '10px 12px', background: '#F8F4EE', borderRadius: '8px', fontSize: '12px', color: '#4A4A44', lineHeight: 1.6, marginBottom: '10px' }}><strong style={{ color: '#1E3A2F' }}>Older homes need more.</strong> If your home was built before 1980 or is in a climate with harsh winters or high humidity, budget closer to 2% ({budget1pct > 0 ? fmt(budget1pct * 2) : 'double your target'}/year). Major systems like HVAC, roofing, and plumbing have finite lifespans — the older your home, the more likely you are to face a large replacement in any given year.</div>
          <div style={{ padding: '10px 12px', background: '#F8F4EE', borderRadius: '8px', fontSize: '12px', color: '#4A4A44', lineHeight: 1.6, marginBottom: '10px' }}><strong style={{ color: '#1E3A2F' }}>Tip:</strong> Open a dedicated high-yield savings account labeled home maintenance and automate a monthly transfer of {budget1pct > 0 ? fmt(budget1pct / 12) : 'your target amount'}. When a repair comes up, you are paying from reserves — not from your emergency fund or a credit card.</div>
          <a href="https://www.consumerfinance.gov/owning-a-home/process/close/homeownership-costs/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#C47B2B', textDecoration: 'none' }}>Homeownership costs guide · CFPB.gov →</a>
        </div>

        <div style={{ ...tipS, borderLeft: '3px solid #185FA5' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#0C447C', marginBottom: '8px' }}>Mortgage interest may be tax deductible — do not leave money on the table</div>
          <div style={{ fontSize: '12px', color: '#4A4A44', lineHeight: 1.7, marginBottom: '12px' }}>If you itemize deductions on your federal tax return, the interest you pay on your mortgage may be deductible — up to $750,000 of loan principal for loans originated after December 2017. Many homeowners miss this or do not realize it applies to them. In the early years of a mortgage when most of your payment is interest, this deduction can be significant.</div>
          <div style={{ padding: '10px 12px', background: '#E6F1FB', borderRadius: '8px', fontSize: '12px', color: '#0C447C', lineHeight: 1.6, marginBottom: '10px' }}>
            <strong style={{ color: '#0C447C' }}>For reference:</strong> {hasLoan && interestPaidEst > 0 ? `In year ${yearsPaid} of your loan, roughly ${fmt(Math.round(interestPaidEst / Math.max(1, yearsPaid)))} of your annual payments went toward interest. At a 22% federal tax bracket, that is potentially ${fmt(Math.round(interestPaidEst / Math.max(1, yearsPaid)) * 0.22)} in tax savings if you itemize.` : 'Add your loan details above to see an estimate of your potential interest deduction.'} Your actual benefit depends on whether itemizing beats the standard deduction for your situation.
          </div>
          <div style={{ padding: '10px 12px', background: '#FBF0DC', borderRadius: '8px', fontSize: '12px', color: '#7A4A10', lineHeight: 1.6, marginBottom: '10px' }}><strong style={{ color: '#7A4A10' }}>Important:</strong> Tax rules change and individual situations vary. Always consult a licensed tax professional or CPA before making decisions based on potential deductions. Hearth cannot provide tax advice.</div>
          <a href="https://www.irs.gov/publications/p936" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#185FA5', textDecoration: 'none' }}>IRS Publication 936 — Home mortgage interest deduction →</a>
        </div>

        <div style={{ ...tipS, borderLeft: '3px solid #3D7A5A', marginBottom: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#27500A', marginBottom: '8px' }}>Document everything — it pays off when you sell</div>
          <div style={{ fontSize: '12px', color: '#4A4A44', lineHeight: 1.7, marginBottom: '12px' }}>A buyer who can see every repair, upgrade, inspection, and contractor job logged for your home has no uncertainty to negotiate with. Uncertainty is the buyer most powerful tool — it is what drives inspection credits, price reductions, and extended closing timelines. A well-documented home removes that leverage entirely.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: '#FDECEA', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#791F1F', marginBottom: '6px' }}>Without records</div>
              {['Buyer assumes worst case on every system', 'Inspector flags unknowns as risks', 'Buyer requests $10–30k in credits', 'Longer days on market', 'Final price further from asking'].map(t => <div key={t} style={{ fontSize: '11px', color: '#9B2C2C', lineHeight: 1.5, marginBottom: '3px' }}>· {t}</div>)}
            </div>
            <div style={{ background: '#EAF2EC', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#27500A', marginBottom: '6px' }}>With Hearth records</div>
              {['Every system history is recorded', 'Inspector has context for every flag', 'Fewer surprises · buyers feel confident', 'Closes 8–12 days faster on average', 'Stronger asking price position'].map(t => <div key={t} style={{ fontSize: '11px', color: '#3D7A5A', lineHeight: 1.5, marginBottom: '3px' }}>· {t}</div>)}
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: '#F8F4EE', borderRadius: '8px', fontSize: '12px', color: '#4A4A44', lineHeight: 1.6 }}><strong style={{ color: '#1E3A2F' }}>The transfer advantage:</strong> When you are ready to sell, Hearth generates a complete home history report that transfers to the next owner. Every job logged, every system documented, every contractor rated. This is the record buyers and their agents want — and realtors can use it as a selling point from day one of the listing.</div>
        </div>

        <div style={{ marginTop: '14px', padding: '12px 14px', background: '#F8F4EE', borderRadius: '8px', fontSize: '11px', color: '#8A8A82', lineHeight: 1.7 }}>
          All figures shown are illustrative examples based on publicly available research and mortgage mathematics. Actual interest savings depend on your specific loan balance, interest rate, remaining term, and payment timing. Tax information is general in nature and does not constitute tax advice. This page is educational content only and does not constitute financial, legal, tax, or real estate advice. Hearth is not a licensed financial advisor, lender, real estate broker, or tax professional. Always consult licensed professionals before making financial decisions. Free HUD-approved housing counseling: <a href="https://www.consumerfinance.gov/find-a-housing-counselor/" target="_blank" rel="noopener noreferrer" style={{ color: '#8A8A82' }}>consumerfinance.gov/find-a-housing-counselor</a>
        </div>
      </div>

      {/* MAINTENANCE SPENDING */}
      <div style={cardS}>
        <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A2F', marginBottom: '12px' }}>Maintenance spending</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <div style={statS}><div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>Spent this year</div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 600, color: '#1E3A2F' }}>{fmt(thisYearSpend)}</div></div>
          <div style={statS}><div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>Deferred liability</div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 600, color: deferred > 0 ? '#9B2C2C' : '#3D7A5A' }}>{deferred > 0 ? `~${fmt(deferred)}` : '$0'}</div></div>
          <div style={statS}><div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>Jobs logged total</div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 600, color: '#1E3A2F' }}>{jobs.length}</div></div>
          <div style={statS}><div style={{ fontSize: '12px', color: '#8A8A82', marginBottom: '4px' }}>Buyer risk at sale</div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 600, color: deferred > 0 ? '#C47B2B' : '#3D7A5A' }}>{deferred > 0 ? `~${fmt(deferred * 2.1)}` : '$0'}</div></div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ fontSize: '11px', color: '#8A8A82', lineHeight: 1.7, padding: '12px 16px', background: '#F8F4EE', borderRadius: '8px' }}>
        Home value estimates based on FHFA House Price Index® regional averages (fhfa.gov) and are not appraisals. Mortgage rate data from Freddie Mac Primary Mortgage Market Survey. ROI figures from Remodeling 2025 Cost vs. Value Report (costvsvalue.com) © Zonda Media. Financial tips are educational only and do not constitute financial, legal, or tax advice. Hearth is not a licensed financial advisor, real estate broker, lender, or tax professional. Always consult licensed professionals before making financial decisions related to your home.
      </div>

    </div>
  )
}
