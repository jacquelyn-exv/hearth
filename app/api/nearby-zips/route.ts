import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get('zip')
  const radiusMiles = parseInt(searchParams.get('radius') || '50')
  if (!zip || zip.length !== 5) return NextResponse.json({ zips: [] })

  try {
    // Get lat/lng for origin zip using zippopotam (free, no key)
    const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!geoRes.ok) return NextResponse.json({ zips: [zip] })
    const geoData = await geoRes.json()
    const place = geoData.places?.[0]
    if (!place) return NextResponse.json({ zips: [zip] })
    const lat = parseFloat(place.latitude)
    const lng = parseFloat(place.longitude)
    const state = place['state abbreviation']

    // Use OpenDataSoft free zip code API with geo distance filter
    const url = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/us-zip-code-latitude-and-longitude/records?select=zip&where=distance(geo_point_2d%2C%20geom%27POINT(${lng}%20${lat})%27%2C%20${radiusMiles}mi)&limit=200`
    
    const odsRes = await fetch(url)
    if (odsRes.ok) {
      const odsData = await odsRes.json()
      const zips = (odsData.results || [])
        .map((r: any) => r.zip)
        .filter(Boolean)
        .filter((z: string) => z !== zip)
      const allZips = [zip, ...zips]
      return NextResponse.json({ zips: allZips, lat, lng, count: allZips.length })
    }

    return NextResponse.json({ zips: [zip], lat, lng })
  } catch (e: any) {
    return NextResponse.json({ zips: [zip], error: e.message })
  }
}
