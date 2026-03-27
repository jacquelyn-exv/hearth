import { NextResponse } from 'next/server'

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8 // Earth radius in miles
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
  const radiusMiles = parseInt(searchParams.get('radius') || '50')
  if (!zip) return NextResponse.json({ zips: [] })

  try {
    // Get lat/lng for origin zip
    const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!geoRes.ok) return NextResponse.json({ zips: [zip] })
    const geoData = await geoRes.json()
    const lat = parseFloat(geoData.places?.[0]?.latitude)
    const lng = parseFloat(geoData.places?.[0]?.longitude)
    if (!lat || !lng) return NextResponse.json({ zips: [zip] })

    // Use Census ZIP code tabulation areas to find nearby zips
    // Free public API from GeoNames
    const nearbyRes = await fetch(
      `http://api.geonames.org/findNearbyPostalCodesJSON?lat=${lat}&lng=${lng}&radius=${radiusMiles}&maxRows=200&country=US&username=hearth_app`
    )

    if (nearbyRes.ok) {
      const nearbyData = await nearbyRes.json()
      const zips = (nearbyData.postalCodes || []).map((p: any) => p.postalCode)
      return NextResponse.json({ 
        zips: zips.length > 0 ? [zip, ...zips.filter((z: string) => z !== zip)] : [zip],
        lat, lng, count: zips.length
      })
    }

    return NextResponse.json({ zips: [zip], lat, lng })
  } catch (e: any) {
    return NextResponse.json({ zips: [zip], error: e.message })
  }
}
