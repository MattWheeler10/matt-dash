<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface WeatherCurrent {
  temp: number
  apparentTemp: number
  windspeed: number
  humidity: number
  code: number
}

interface WeatherDay {
  date: string
  maxTemp: number
  minTemp: number
  code: number
}

interface NewsItem {
  title: string
  link: string
  pubDate: string
}

const weather = ref<WeatherCurrent | null>(null)
const forecast = ref<WeatherDay[]>([])
const news = ref<NewsItem[]>([])
const loading = ref(true)
const error = ref('')

const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Icy fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌧️' },
  61: { label: 'Light rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  80: { label: 'Showers', icon: '🌦️' },
  81: { label: 'Heavy showers', icon: '🌧️' },
  82: { label: 'Violent showers', icon: '⛈️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  99: { label: 'Thunderstorm', icon: '⛈️' },
}

function wmo(code: number) {
  return WMO[code] ?? { label: 'Unknown', icon: '🌡️' }
}

function shortDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short' })
}

async function fetchWeather() {
  const res = await fetch(
    '/api/weather/v1/forecast?latitude=53.4808&longitude=-2.2426' +
    '&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m' +
    '&daily=weathercode,temperature_2m_max,temperature_2m_min' +
    '&timezone=Europe%2FLondon&forecast_days=4'
  )
  if (!res.ok) throw new Error('Weather fetch failed')
  const data = await res.json()
  const c = data.current

  weather.value = {
    temp: Math.round(c.temperature_2m),
    apparentTemp: Math.round(c.apparent_temperature),
    windspeed: Math.round(c.windspeed_10m),
    humidity: c.relativehumidity_2m,
    code: c.weathercode,
  }

  // Skip today (index 0), show next 3 days
  forecast.value = data.daily.time.slice(1, 4).map((date: string, i: number) => ({
    date,
    maxTemp: Math.round(data.daily.temperature_2m_max[i + 1]),
    minTemp: Math.round(data.daily.temperature_2m_min[i + 1]),
    code: data.daily.weathercode[i + 1],
  }))
}

async function fetchNews() {
  const res = await fetch('/api/men/news/?service=rss')
  if (!res.ok) throw new Error('News fetch failed')
  const text = await res.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(text, 'text/xml')
  const items = xml.querySelectorAll('item')
  news.value = Array.from(items).slice(0, 8).map((item) => ({
    title: item.querySelector('title')?.textContent ?? '',
    link: item.querySelector('link')?.textContent ?? '#',
    pubDate: item.querySelector('pubDate')?.textContent ?? '',
  }))
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

onMounted(async () => {
  try {
    await Promise.all([fetchWeather(), fetchNews()])
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mcr-widget">
    <!-- Header -->
    <div class="mcr-header">
      <div class="mcr-header-left">
        <div class="mcr-bee">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="bee-svg">
            <!-- Body -->
            <ellipse cx="16" cy="18" rx="7" ry="9" fill="#f59e0b"/>
            <!-- Stripes -->
            <rect x="9" y="16" width="14" height="2.5" rx="1" fill="#1a1a1a"/>
            <rect x="9" y="20" width="14" height="2.5" rx="1" fill="#1a1a1a"/>
            <!-- Head -->
            <circle cx="16" cy="9" r="4" fill="#f59e0b"/>
            <!-- Antennae -->
            <line x1="14" y1="6" x2="11" y2="2" stroke="#1a1a1a" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="18" y1="6" x2="21" y2="2" stroke="#1a1a1a" stroke-width="1.2" stroke-linecap="round"/>
            <circle cx="11" cy="2" r="1" fill="#1a1a1a"/>
            <circle cx="21" cy="2" r="1" fill="#1a1a1a"/>
            <!-- Wings -->
            <ellipse cx="8" cy="14" rx="5" ry="3" fill="rgba(255,255,255,0.35)" transform="rotate(-20 8 14)"/>
            <ellipse cx="24" cy="14" rx="5" ry="3" fill="rgba(255,255,255,0.35)" transform="rotate(20 24 14)"/>
          </svg>
        </div>
        <div class="mcr-header-text">
          <span class="mcr-header-title">Manchester</span>
          <span class="mcr-header-sub">Weather &amp; News</span>
        </div>
      </div>
      <span v-if="weather" class="mcr-temp-badge">
        {{ wmo(weather.code).icon }} {{ weather.temp }}°C
      </span>
    </div>

    <div v-if="loading" class="mcr-state">
      <div class="mcr-spinner" />
      <span>Loading...</span>
    </div>
    <div v-else-if="error" class="mcr-state mcr-error">{{ error }}</div>

    <div v-else class="mcr-body">
      <!-- Weather panel -->
      <div class="mcr-weather-panel">
        <div v-if="weather" class="mcr-current">
          <div class="mcr-condition">
            <span class="mcr-condition-icon">{{ wmo(weather.code).icon }}</span>
            <div class="mcr-condition-text">
              <span class="mcr-big-temp">{{ weather.temp }}°C</span>
              <span class="mcr-condition-label">{{ wmo(weather.code).label }}</span>
            </div>
          </div>
          <div class="mcr-meta">
            <span class="mcr-meta-item">💨 {{ weather.windspeed }} km/h</span>
            <span class="mcr-meta-item">💧 {{ weather.humidity }}%</span>
            <span class="mcr-meta-item">Feels {{ weather.apparentTemp }}°C</span>
          </div>
        </div>

        <!-- 3-day forecast -->
        <div class="mcr-forecast">
          <div v-for="day in forecast" :key="day.date" class="mcr-forecast-day">
            <span class="forecast-day-name">{{ shortDay(day.date) }}</span>
            <span class="forecast-icon">{{ wmo(day.code).icon }}</span>
            <span class="forecast-max">{{ day.maxTemp }}°</span>
            <span class="forecast-min">{{ day.minTemp }}°</span>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="mcr-divider" />

      <!-- News panel -->
      <div class="mcr-news-panel">
        <div class="mcr-section-label">Manchester Evening News</div>
        <div class="mcr-news-list">
          <a
            v-for="item in news"
            :key="item.link"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="mcr-news-item"
          >
            <span class="mcr-news-title">{{ item.title }}</span>
            <span class="mcr-news-time">{{ timeAgo(item.pubDate) }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mcr-widget {
  background: #12131f;
  border: 1px solid #1a1a2e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Header */
.mcr-header {
  background: linear-gradient(135deg, #1a1200 0%, #92400e 50%, #d97706 100%);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-bottom: 2px solid #78350f;
}

.mcr-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mcr-bee {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.bee-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
}

.mcr-header-text {
  display: flex;
  flex-direction: column;
}

.mcr-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.mcr-header-sub {
  font-size: 10px;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mcr-temp-badge {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  background: rgba(0,0,0,0.25);
  padding: 3px 10px;
  border-radius: 4px;
}

/* State */
.mcr-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #6b7280;
  font-size: 13px;
}

.mcr-error { color: #ef4444; }

.mcr-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #2a2d3e;
  border-top-color: #d97706;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Body */
.mcr-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* Weather panel */
.mcr-weather-panel {
  padding: 12px 16px 10px;
  flex-shrink: 0;
}

.mcr-current {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.mcr-condition {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mcr-condition-icon {
  font-size: 28px;
  line-height: 1;
}

.mcr-condition-text {
  display: flex;
  flex-direction: column;
}

.mcr-big-temp {
  font-size: 22px;
  font-weight: 800;
  color: #f59e0b;
  line-height: 1.1;
}

.mcr-condition-label {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mcr-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-end;
}

.mcr-meta-item {
  font-size: 11px;
  color: #6b7280;
}

/* Forecast strip */
.mcr-forecast {
  display: flex;
  gap: 0;
  border-top: 1px solid #1f2133;
  padding-top: 8px;
}

.mcr-forecast-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 4px 0;
  border-right: 1px solid #1f2133;
}

.mcr-forecast-day:last-child { border-right: none; }

.forecast-day-name {
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.forecast-icon { font-size: 16px; line-height: 1; }

.forecast-max {
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
}

.forecast-min {
  font-size: 11px;
  color: #4b5563;
}

/* Divider */
.mcr-divider {
  height: 1px;
  background: #1f2133;
  flex-shrink: 0;
  margin: 0 16px;
}

/* News panel */
.mcr-news-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-height: 0;
  padding: 10px 16px 14px;
}

.mcr-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.mcr-news-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: #2a1f00 transparent;
}

.mcr-news-list::-webkit-scrollbar { width: 4px; }
.mcr-news-list::-webkit-scrollbar-track { background: transparent; }
.mcr-news-list::-webkit-scrollbar-thumb { background: #2a1f00; border-radius: 4px; }
.mcr-news-list::-webkit-scrollbar-thumb:hover { background: #4a3500; }

.mcr-news-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 0;
  border-bottom: 1px solid #1a1d2e;
  text-decoration: none;
  transition: padding-left 0.15s;
  cursor: pointer;
}

.mcr-news-item:last-child { border-bottom: none; }
.mcr-news-item:hover { padding-left: 4px; }
.mcr-news-item:hover .mcr-news-title { color: #f59e0b; }

.mcr-news-title {
  font-size: 12px;
  color: #d1d5db;
  line-height: 1.4;
  transition: color 0.15s;
}

.mcr-news-time {
  font-size: 10px;
  color: #4b5563;
}
</style>
