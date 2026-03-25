import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const getWeatherInfo = (code: number) => {
  if (code === 0) return { desc: 'Clear sky', emoji: '☀️' }
  if (code <= 2) return { desc: 'Partly cloudy', emoji: '⛅' }
  if (code === 3) return { desc: 'Overcast', emoji: '☁️' }
  if (code <= 49) return { desc: 'Foggy', emoji: '🌫️' }
  if (code <= 59) return { desc: 'Drizzle', emoji: '🌦️' }
  if (code <= 69) return { desc: 'Rain', emoji: '🌧️' }
  if (code <= 79) return { desc: 'Snow', emoji: '❄️' }
  if (code <= 84) return { desc: 'Rain showers', emoji: '🌧️' }
  if (code <= 94) return { desc: 'Thunderstorm', emoji: '⛈️' }
  return { desc: 'Stormy', emoji: '🌩️' }
}

const getStormType = (code: number, windspeed: number, precip: number) => {
  if (windspeed >= 58) return { type: 'high_wind', label: 'High wind event', systems: ['roof', 'siding', 'fencing', 'deck', 'gutters'] }
  if (code >= 96) return { type: 'thunderstorm_hail', label: 'Thunderstorm with hail', systems: ['roof', 'siding', 'windows', 'gutters', 'hvac'] }
  if (code >= 80 && code <= 84) return { type: 'heavy_rain', label: 'Heavy rain event', systems: ['gutters', 'sump_pump', 'roof', 'windows'] }
  if (code >= 71 && code <= 77) return { type: 'snow_ice', label: 'Snow / ice event', systems: ['roof', 'gutters', 'plumbing', 'hvac'] }
  if (code >= 95) return { type: 'thunderstorm', label: 'Thunderstorm', systems: ['roof', 'siding', 'windows', 'electrical'] }
  if (windspeed >= 39) return { type: 'wind', label: 'Wind event', systems: ['roof', 'siding', 'fencing', 'deck'] }
  if (precip > 25) return { type: 'rain', label: 'Significant rainfall', systems: ['gutters', 'sump_pump', 'windows'] }
  return null
}

const getHomeTip = (code: number, temp: number, precip: number) => {
  if (precip > 60) return '🌧 Rain expected — good time to check gutters and downspouts'
  if (code === 0 && temp > 75) return '☀️ Great day to inspect your roof and exterior'
  if (code <= 2 && temp > 60) return '🌤 Good conditions for outdoor home maintenance'
  if (temp < 32) return '❄️ Check pipes and weatherstripping for cold weather gaps'
  if (temp > 90) return '🌡️ High heat — check HVAC filters and efficiency'
  if (code >= 80) return '⛈️ Storm incoming — secure outdoor furniture and check drainage'
  if (precip > 30) return '🌦 Rain possible — check window seals and basement for moisture'
  return '🏠 Good day to walk your property and note anything that needs attention'
}

const SYSTEM_INSPECT_GUIDE: Record<string, { what: string, look_for: string }> = {
  roof: { what: 'Roof', look_for: 'Missing, cracked, or dented shingles. Granules in gutters. Soft spots or sagging. Check from ground level with binoculars first.' },
  siding: { what: 'Siding', look_for: 'Dents, cracks, holes, or displaced panels. Look for areas where siding has pulled away from the wall. Check caulking around windows and doors.' },
  windows: { what: 'Windows', look_for: 'Cracked or broken glass. Damaged frames or seals. Condensation between panes indicating seal failure. Check screens for tears.' },
  gutters: { what: 'Gutters', look_for: 'Dents, separated seams, or gutters pulled away from fascia. Check downspouts are clear and directing water away from foundation.' },
  hvac: { what: 'HVAC', look_for: 'Dents or damage to outdoor unit fins. Debris inside or around unit. Unit should be level — settling after storms can cause tilt.' },
  fencing: { what: 'Fencing', look_for: 'Leaning or collapsed sections. Broken boards or pickets. Posts that have shifted. Gate hardware that no longer lines up.' },
  deck: { what: 'Deck', look_for: 'Loose or lifted boards. Damaged railings. Check structural posts for movement. Look for water pooling that could accelerate rot.' },
  sump_pump: { what: 'Sump pump', look_for: 'Test by pouring water into the pit — it should activate. Check discharge line is clear and draining away from foundation.' },
  plumbing: { what: 'Plumbing', look_for: 'Check exposed pipes in unheated spaces for cracks from freezing. Look for water stains on ceilings that could indicate burst pipes.' },
  electrical: { what: 'Electrical', look_for: 'Check GFCI outlets for tripped breakers after storms. Look for scorch marks around outlets. If you smell burning, call an electrician immediately.' }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get('zip') || ''
  const city = searchParams.get('city') || ''
  const state = searchParams.get('state') || ''

  if (!zip && !city) {
    return NextResponse.json({ error: 'No location provided' }, { status: 400 })
  }

  try {
    let latitude: number = 0
    let longitude: number = 0
    let locationName = city || zip
    let locationState = state

    // Try zippopotam.us first for US zip codes
    if (zip) {
      try {
        const zipRes = await fetch(`https://api.zippopotam.us/us/${zip}`)
        if (zipRes.ok) {
          const zipData = await zipRes.json()
          latitude = parseFloat(zipData.places[0].latitude)
          longitude = parseFloat(zipData.places[0].longitude)
          locationName = zipData.places[0]['place name']
          locationState = zipData.places[0]['state abbreviation']
        }
      } catch {}
    }

    // Fallback to Open-Meteo geocoding
    if (!latitude && !longitude) {
      const query = city ? `${city} ${state}`.trim() : zip
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
      )
      const geoData = await geoRes.json()
      if (geoData.results && geoData.results.length > 0) {
        latitude = geoData.results[0].latitude
        longitude = geoData.results[0].longitude
        locationName = geoData.results[0].name
        locationState = geoData.results[0].admin1
      }
    }

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Current weather + 30 day history
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,windspeed_10m,precipitation_probability&daily=weathercode,windspeed_10m_max,precipitation_sum&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&past_days=30`
    )
    const weatherData = await weatherRes.json()
    const current = weatherData.current
    const daily = weatherData.daily

    const { desc, emoji } = getWeatherInfo(current.weathercode)
    const temp = Math.round(current.temperature_2m)
    const precip = current.precipitation_probability

    // Check for storm events in past 30 days
    const stormEvents: any[] = []
    if (daily?.time) {
      for (let i = 0; i < daily.time.length; i++) {
        const code = daily.weathercode[i]
        const wind = daily.windspeed_10m_max[i]
        const rain = daily.precipitation_sum[i]
        const storm = getStormType(code, wind, rain)

        if (storm) {
          const eventDate = daily.time[i]
          const { data: existing } = await supabase
            .from('storm_events')
            .select('id')
            .eq('zip', zip || city)
            .eq('event_date', eventDate)
            .eq('event_type', storm.type)
            .limit(1)

          if (!existing || existing.length === 0) {
            await supabase.from('storm_events').insert({
              zip: zip || city,
              event_type: storm.type,
              severity: wind >= 58 ? 'severe' : wind >= 39 ? 'moderate' : 'minor',
              event_date: eventDate,
              affected_systems: storm.systems,
              max_windspeed: wind,
              max_precipitation: rain,
              weather_code: code,
              notes: storm.label
            })
          }

          stormEvents.push({
            date: eventDate,
            type: storm.type,
            label: storm.label,
            systems: storm.systems,
            windspeed: wind,
            precipitation: rain
          })
        }
      }
    }

    const recentStorm = stormEvents.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0] || null

    const inspectionGuides = recentStorm
      ? recentStorm.systems.map((s: string) => SYSTEM_INSPECT_GUIDE[s]).filter(Boolean)
      : []

    return NextResponse.json({
      temp,
      desc,
      emoji,
      tip: getHomeTip(current.weathercode, temp, precip),
      precip,
      city: locationName,
      state: locationState,
      windspeed: Math.round(current.windspeed_10m),
      recentStorm,
      inspectionGuides,
      stormCount: stormEvents.length
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}