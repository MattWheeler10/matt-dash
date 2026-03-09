<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Session {
  name: string
  date: string
  time: string
  passed: boolean
}

interface RaceWeekend {
  raceName: string
  circuitName: string
  country: string
  locality: string
  round: string
  totalRounds: string
  sessions: Session[]
}

interface NewsItem {
  title: string
  link: string
  pubDate: string
}

interface NextRaceTeaser {
  raceName: string
  country: string
  locality: string
  round: string
  date: string
}

const race = ref<RaceWeekend | null>(null)
const nextRace = ref<NextRaceTeaser | null>(null)
const news = ref<NewsItem[]>([])
const loading = ref(true)
const error = ref('')

const countryToCode: Record<string, string> = {
  'Australia': 'au', 'Bahrain': 'bh', 'Saudi Arabia': 'sa', 'Japan': 'jp',
  'China': 'cn', 'USA': 'us', 'Italy': 'it', 'Monaco': 'mc', 'Canada': 'ca',
  'Spain': 'es', 'Austria': 'at', 'UK': 'gb', 'Hungary': 'hu', 'Belgium': 'be',
  'Netherlands': 'nl', 'Singapore': 'sg', 'Azerbaijan': 'az', 'Mexico': 'mx',
  'Brazil': 'br', 'Qatar': 'qa', 'UAE': 'ae', 'United States': 'us',
  'United Kingdom': 'gb', 'Great Britain': 'gb',
}

function getFlagUrl(country: string) {
  const code = countryToCode[country] ?? 'un'
  return `https://flagcdn.com/w80/${code}.png`
}

function parseSession(name: string, data: { date: string; time: string } | undefined): Session | null {
  if (!data) return null
  const dt = new Date(`${data.date}T${data.time}`)
  return {
    name,
    date: data.date,
    time: data.time,
    passed: dt.getTime() < Date.now(),
  }
}

async function fetchSchedule() {
  const res = await fetch('/api/f1/ergast/f1/current.json')
  if (!res.ok) throw new Error('Failed to fetch schedule')
  const data = await res.json()
  const races = data.MRData.RaceTable.Races
  const now = Date.now()

  const upcoming = races.find((r: any) => {
    const raceDate = new Date(`${r.date}T${r.time}`)
    return raceDate.getTime() + 86400000 > now
  }) ?? races[races.length - 1]

  if (upcoming) {
    const sessions: Session[] = []
    const fp1 = parseSession('FP1', upcoming.FirstPractice)
    const fp2 = parseSession('FP2', upcoming.SecondPractice)
    const fp3 = parseSession('FP3', upcoming.ThirdPractice)
    const sq = parseSession('Sprint Qualifying', upcoming.SprintQualifying)
    const sprint = parseSession('Sprint', upcoming.Sprint)
    const quali = parseSession('Qualifying', upcoming.Qualifying)
    const raceSession = parseSession('Race', { date: upcoming.date, time: upcoming.time })

    if (fp1) sessions.push(fp1)
    if (sq) sessions.push(sq)
    if (fp2) sessions.push(fp2)
    if (sprint) sessions.push(sprint)
    if (fp3) sessions.push(fp3)
    if (quali) sessions.push(quali)
    if (raceSession) sessions.push(raceSession)

    sessions.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())

    race.value = {
      raceName: upcoming.raceName,
      circuitName: upcoming.Circuit.circuitName,
      country: upcoming.Circuit.Location.country,
      locality: upcoming.Circuit.Location.locality,
      round: upcoming.round,
      totalRounds: String(races.length),
      sessions,
    }

    // Find the race after this one
    const currentIdx = races.indexOf(upcoming)
    const following = races[currentIdx + 1]
    if (following) {
      nextRace.value = {
        raceName: following.raceName,
        country: following.Circuit.Location.country,
        locality: following.Circuit.Location.locality,
        round: following.round,
        date: following.date,
      }
    }
  }
}

async function fetchNews() {
  const res = await fetch('/api/bbc-sport/sport/formula1/rss.xml')
  if (!res.ok) throw new Error('News fetch failed')
  const text = await res.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(text, 'text/xml')
  const items = xml.querySelectorAll('item')
  news.value = Array.from(items).slice(0, 6).map((item) => ({
    title: item.querySelector('title')?.textContent ?? '',
    link: item.querySelector('link')?.textContent ?? '#',
    pubDate: item.querySelector('pubDate')?.textContent ?? '',
  }))
}

onMounted(async () => {
  try {
    await Promise.all([fetchSchedule(), fetchNews()])
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load'
  } finally {
    loading.value = false
  }
})

function formatSessionDate(date: string, time: string) {
  const d = new Date(`${date}T${time}`)
  return {
    day: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  }
}

const nextSession = computed(() => {
  if (!race.value) return null
  return race.value.sessions.find(s => !s.passed) ?? null
})

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
</script>

<template>
  <div class="f1-widget">
    <!-- Header -->
    <div class="f1-header">
      <div class="f1-header-left">
        <img src="@/assets/images/f1 logo.png" alt="F1" class="f1-logo" />
        <div class="f1-header-text">
          <span class="f1-header-title">Formula 1</span>
          <span class="f1-header-sub">Race Weekend</span>
        </div>
      </div>
      <span v-if="race" class="f1-round">R{{ race.round }}/{{ race.totalRounds }}</span>
    </div>

    <div v-if="loading" class="f1-state">
      <div class="f1-spinner" />
      <span>Loading...</span>
    </div>
    <div v-else-if="error" class="f1-state f1-error">{{ error }}</div>

    <div v-else class="f1-body">
      <!-- Schedule -->
      <div class="f1-section f1-schedule">
        <div v-if="race" class="f1-race-info">
          <div class="f1-flag-row">
            <img :src="getFlagUrl(race.country)" :alt="race.country" class="f1-flag" />
            <div class="f1-race-location">
              <div class="f1-race-name">{{ race.raceName }}</div>
              <div class="f1-circuit">{{ race.circuitName }}</div>
              <div class="f1-locality">{{ race.locality }}, {{ race.country }}</div>
            </div>
          </div>
        </div>
        <div class="f1-sessions">
          <div
            v-for="s in race?.sessions"
            :key="s.name"
            class="f1-session"
            :class="{ passed: s.passed, next: nextSession === s }"
          >
            <span class="session-indicator" :class="{ active: nextSession === s }" />
            <span class="session-name">{{ s.name }}</span>
            <span class="session-day">{{ formatSessionDate(s.date, s.time).day }}</span>
            <span class="session-time">{{ formatSessionDate(s.date, s.time).time }}</span>
          </div>
        </div>

        <!-- Next race teaser -->
        <div v-if="nextRace" class="f1-next-teaser">
          <span class="f1-next-label">Up Next — R{{ nextRace.round }}</span>
          <div class="f1-next-row">
            <img :src="getFlagUrl(nextRace.country)" :alt="nextRace.country" class="f1-next-flag" />
            <div class="f1-next-info">
              <span class="f1-next-name">{{ nextRace.raceName }}</span>
              <span class="f1-next-date">{{ new Date(nextRace.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Car center divider -->
      <div class="f1-car-divider">
        <img src="@/assets/images/mclarenf1.png" alt="McLaren F1" class="f1-car-img" />
      </div>

      <!-- News -->
      <div class="f1-section f1-news">
        <div class="f1-section-label">News</div>
        <div class="f1-news-list">
          <a
            v-for="item in news"
            :key="item.link"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="f1-news-item"
          >
            <span class="f1-news-title">{{ item.title }}</span>
            <span class="f1-news-time">{{ timeAgo(item.pubDate) }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.f1-widget {
  background: #12131f;
  border: 1px solid #1a1a2e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Header */
.f1-header {
  background: linear-gradient(135deg, #1a0000 0%, #e8002d 60%, #ff1a1a 100%);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-bottom: 2px solid #b00020;
}

.f1-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.f1-logo {
  height: 36px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4));
}

.f1-header-text {
  display: flex;
  flex-direction: column;
}

.f1-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.f1-header-sub {
  font-size: 10px;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.f1-round {
  font-size: 13px;
  font-weight: 800;
  color: rgba(255,255,255,0.6);
  background: rgba(0,0,0,0.25);
  padding: 3px 8px;
  border-radius: 4px;
}

/* State */
.f1-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #6b7280;
  font-size: 13px;
}

.f1-error { color: #ef4444; }

.f1-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #2a2d3e;
  border-top-color: #e8002d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Body */
.f1-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.f1-section {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.f1-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 10px;
}

/* Schedule */
.f1-schedule {
  flex: 1;
  border-right: 1px solid #1f2133;
}

.f1-race-info {
  margin-bottom: 14px;
}

.f1-flag-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.f1-flag {
  width: 40px;
  height: 28px;
  object-fit: cover;
  border-radius: 3px;
  border: 1px solid #2a2d3e;
  flex-shrink: 0;
  margin-top: 2px;
}

.f1-race-location {
  display: flex;
  flex-direction: column;
}

.f1-race-name {
  font-size: 14px;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.3;
}

.f1-circuit {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.f1-locality {
  font-size: 10px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
}

.f1-sessions {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: #2a1015 transparent;
}

.f1-sessions::-webkit-scrollbar { width: 4px; }
.f1-sessions::-webkit-scrollbar-track { background: transparent; }
.f1-sessions::-webkit-scrollbar-thumb { background: #2a1015; border-radius: 4px; }
.f1-sessions::-webkit-scrollbar-thumb:hover { background: #4a1525; }

.f1-session {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid #1a1d2e;
  font-size: 12px;
}

.f1-session:last-child { border-bottom: none; }

.session-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2a2d3e;
  flex-shrink: 0;
}

.session-indicator.active {
  background: #e8002d;
  box-shadow: 0 0 6px rgba(232, 0, 45, 0.5);
}

.f1-session.passed { opacity: 0.4; }
.f1-session.next { opacity: 1; }
.f1-session.next .session-name { color: #e8002d; font-weight: 700; }

.session-name {
  color: #d1d5db;
  font-weight: 500;
  min-width: 80px;
}

.session-day {
  color: #6b7280;
  font-size: 11px;
  margin-left: auto;
}

.session-time {
  color: #e2e8f0;
  font-weight: 600;
  font-size: 12px;
  min-width: 42px;
  text-align: right;
}

/* Next race teaser */
.f1-next-teaser {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #1f2133;
  flex-shrink: 0;
}

.f1-next-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #4b5563;
  margin-bottom: 6px;
  display: block;
}

.f1-next-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.f1-next-flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
  border: 1px solid #2a2d3e;
  flex-shrink: 0;
}

.f1-next-info {
  display: flex;
  flex-direction: column;
}

.f1-next-name {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  line-height: 1.3;
}

.f1-next-date {
  font-size: 10px;
  color: #6b7280;
}

/* Car divider */
.f1-car-divider {
  width: 80px;
  height: 200px;
  margin: auto 16px;
}

.f1-car-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* News */
.f1-news {
  flex: 1;
  min-width: 0;
}

.f1-news-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: #2a1015 transparent;
}

.f1-news-list::-webkit-scrollbar { width: 4px; }
.f1-news-list::-webkit-scrollbar-track { background: transparent; }
.f1-news-list::-webkit-scrollbar-thumb { background: #2a1015; border-radius: 4px; }
.f1-news-list::-webkit-scrollbar-thumb:hover { background: #4a1525; }

.f1-news-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 0;
  border-bottom: 1px solid #1a1d2e;
  text-decoration: none;
  transition: padding-left 0.15s;
  cursor: pointer;
}

.f1-news-item:last-child { border-bottom: none; }
.f1-news-item:hover { padding-left: 4px; }
.f1-news-item:hover .f1-news-title { color: #e8002d; }

.f1-news-title {
  font-size: 13px;
  color: #d1d5db;
  line-height: 1.4;
  transition: color 0.15s;
}

.f1-news-time {
  font-size: 11px;
  color: #4b5563;
}
</style>
