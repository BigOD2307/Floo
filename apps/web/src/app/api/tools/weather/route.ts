import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth-utils"

/**
 * API météo utilisant Open-Meteo (gratuit, pas de clé API)
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { city, country } = await req.json()

    if (!city) {
      return NextResponse.json({ error: "city requis" }, { status: 400 })
    }

    // 1. Géocodage pour obtenir lat/lon
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr`
    const geoRes = await fetch(geoUrl)
    const geoData = await geoRes.json()

    if (!geoData.results || geoData.results.length === 0) {
      return NextResponse.json(
        { error: `Ville "${city}" non trouvée` },
        { status: 404 }
      )
    }

    const location = geoData.results[0]
    const { latitude, longitude, name, country: countryName } = location

    // 2. Récupérer la météo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`
    const weatherRes = await fetch(weatherUrl)
    const weatherData = await weatherRes.json()

    // Mapper les codes météo
    const weatherCodes: Record<number, string> = {
      0: "☀️ Ciel dégagé",
      1: "🌤️ Peu nuageux",
      2: "⛅ Partiellement nuageux",
      3: "☁️ Couvert",
      45: "🌫️ Brouillard",
      48: "🌫️ Brouillard givrant",
      51: "🌧️ Bruine légère",
      53: "🌧️ Bruine modérée",
      55: "🌧️ Bruine dense",
      61: "🌧️ Pluie légère",
      63: "🌧️ Pluie modérée",
      65: "🌧️ Pluie forte",
      71: "🌨️ Neige légère",
      73: "🌨️ Neige modérée",
      75: "🌨️ Neige forte",
      80: "🌦️ Averses légères",
      81: "🌦️ Averses modérées",
      82: "🌦️ Averses violentes",
      95: "⛈️ Orage",
      96: "⛈️ Orage avec grêle légère",
      99: "⛈️ Orage avec grêle forte",
    }

    const current = weatherData.current
    const daily = weatherData.daily

    const currentWeather = {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      condition: weatherCodes[current.weather_code] || "Inconnu",
    }

    const forecast = daily.time.map((date: string, i: number) => ({
      date,
      tempMax: daily.temperature_2m_max[i],
      tempMin: daily.temperature_2m_min[i],
      condition: weatherCodes[daily.weather_code[i]] || "Inconnu",
    }))

    return NextResponse.json({
      success: true,
      location: `${name}, ${countryName}`,
      current: currentWeather,
      forecast,
    })
  } catch (error) {
    console.error("❌ Erreur météo:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération météo" },
      { status: 500 }
    )
  }
}
