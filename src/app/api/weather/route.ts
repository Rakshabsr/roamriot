import { NextRequest, NextResponse } from 'next/server'

// Uses Open-Meteo — completely free, no API key needed
// GET /api/weather?destination=Jaipur&days=5
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const destination = searchParams.get('destination')
  const days = Math.min(16, Math.max(1, Number(searchParams.get('days') ?? 7)))

  if (!destination) return NextResponse.json({ error: 'Missing destination' }, { status: 400 })

  try {
    // Step 1: Geocode destination → lat/lon
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`,
      { next: { revalidate: 3600 } } // cache 1h
    )
    const geoData = await geoRes.json()
    const place = geoData.results?.[0]
    if (!place) return NextResponse.json({ error: 'Destination not found' }, { status: 404 })

    const { latitude, longitude, timezone, country } = place

    // Step 2: Fetch daily forecast
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitude}&longitude=${longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max` +
      `&timezone=${encodeURIComponent(timezone ?? 'auto')}` +
      `&forecast_days=${days}`,
      { next: { revalidate: 1800 } } // cache 30min
    )
    const weatherData = await weatherRes.json()

    const daily = weatherData.daily
    if (!daily) return NextResponse.json({ error: 'Weather data unavailable' }, { status: 502 })

    const forecast = daily.time.map((date: string, i: number) => ({
      date,
      maxTemp: Math.round(daily.temperature_2m_max[i]),
      minTemp: Math.round(daily.temperature_2m_min[i]),
      rainChance: daily.precipitation_probability_max[i] ?? 0,
      windspeed: Math.round(daily.windspeed_10m_max[i] ?? 0),
      code: daily.weathercode[i] as number,
    }))

    return NextResponse.json({ forecast, country, timezone })
  } catch (err) {
    console.error('Weather API error:', err)
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 })
  }
}
