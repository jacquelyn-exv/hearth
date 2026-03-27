import { NextResponse } from 'next/server'

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get('zip')
  const candidateZips = searchParams.get('candidates')?.split(',') || []
  const radiusMiles = parseInt(searchParams.get('radius') || '50')

  if (!zip || zip.length !== 5) return NextResponse.json({ zips: [] })

  try {
    // Get lat/lng for origin zip
    const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!geoRes.ok) return NextResponse.json({ zips: [zip] })
    const geoData = await geoRes.json()
    const place = geoData.places?.[0]
    if (!place) return NextResponse.json({ zips: [zip] })
    const lat = parseFloat(place.latitude)
    const lng = parseFloat(place.longitude)

    if (candidateZips.length === 0) {
      return NextResponse.json({ zips: [zip], lat, lng })
    }

    // Look up each candidate zip and filter by distance
    const nearby: string[] = [zip]
    
    await Promise.all(
      candidateZips
        .filter(z => z !== zip && z.length === 5)
        .map(async (candidateZip) => {
          try {
            const res = await fetch(`https://api.zippopotam.us/us/${candidateZip}`)
            if (!res.ok) return
            const data = await res.json()
            const p = data.places?.[0]
            if (!p) return
            const cLat = parseFloat(p.latitude)
            const cLng = parseFloat(p.longitude)
            const dist = haversineDistance(lat, lng, cLat, cLng)
            if (dist <= radiusMiles) nearby.push(candidateZip)
          } catch {}
        })
    )

    return NextResponse.json({ zips: nearby, lat, lng, count: nearby.length })
  } catch (e: any) {
    return NextResponse.json({ zips: [zip], error: e.message })
  }
}
