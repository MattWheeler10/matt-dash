<script setup lang="ts">
import { ref, onMounted } from 'vue'

const TEAM_ID = 66
const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY

interface StandingEntry {
  position: number
  points: number
  playedGames: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  form: string
}

interface NextMatch {
  homeTeam: string
  awayTeam: string
  homeCrest: string
  awayCrest: string
  date: string
  venue: string
  competition: string
}

interface NewsItem {
  title: string
  link: string
  pubDate: string
}

const standing = ref<StandingEntry | null>(null)
const upcomingMatches = ref<NextMatch[]>([])
const news = ref<NewsItem[]>([])
const loading = ref(true)
const error = ref('')

async function fetchStandings() {
  const res = await fetch('/api/football/v4/competitions/PL/standings', {
    headers: { 'X-Auth-Token': API_KEY },
  })
  if (!res.ok) throw new Error('Standings fetch failed')
  const data = await res.json()
  const table = data.standings[0].table
  const entry = table.find((t: any) => t.team.id === TEAM_ID)
  if (entry) {
    standing.value = {
      position: entry.position,
      points: entry.points,
      playedGames: entry.playedGames,
      won: entry.won,
      draw: entry.draw,
      lost: entry.lost,
      goalsFor: entry.goalsFor,
      goalsAgainst: entry.goalsAgainst,
      goalDifference: entry.goalDifference,
      form: entry.form ?? '',
    }
  }
}

async function fetchNextMatch() {
  const res = await fetch(
    `/api/football/v4/teams/${TEAM_ID}/matches?status=SCHEDULED&limit=2`,
    { headers: { 'X-Auth-Token': API_KEY } },
  )
  if (!res.ok) throw new Error('Matches fetch failed')
  const data = await res.json()
  upcomingMatches.value = (data.matches ?? []).slice(0, 2).map((m: any) => ({
    homeTeam: m.homeTeam.shortName,
    awayTeam: m.awayTeam.shortName,
    homeCrest: m.homeTeam.crest,
    awayCrest: m.awayTeam.crest,
    date: m.utcDate,
    venue: m.venue ?? 'TBC',
    competition: m.competition.name,
  }))
}

async function fetchNews() {
  const res = await fetch('/api/guardian/football/manchester-united/rss')
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

onMounted(async () => {
  if (!API_KEY) {
    error.value = 'Add VITE_FOOTBALL_API_KEY to .env.local'
    loading.value = false
    return
  }
  try {
    await Promise.all([fetchStandings(), fetchNextMatch(), fetchNews()])
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load data'
  } finally {
    loading.value = false
  }
})

function formatMatchDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    day: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  }
}

function ordinal(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return n + 'th'
  switch (n % 10) {
    case 1: return n + 'st'
    case 2: return n + 'nd'
    case 3: return n + 'rd'
    default: return n + 'th'
  }
}

function formColor(result: string) {
  if (result === 'W') return '#22c55e'
  if (result === 'D') return '#eab308'
  if (result === 'L') return '#ef4444'
  return '#4b5563'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
</script>

<template>
  <div class="utd-widget">
    <!-- Header -->
    <div class="utd-header">
      <div class="utd-header-left">
        <img
          src="https://crests.football-data.org/66.png"
          alt="Manchester United"
          class="utd-crest"
        />
        <div class="utd-name">
          <span class="utd-name-main">Manchester United</span>
          <span class="utd-name-sub">Premier League</span>
        </div>
      </div>
      <div class="utd-league-badge">
        <img
          src="@/assets/images/pl logo.png"
          alt="Premier League"
          class="utd-pl-badge"
        />
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="utd-state">
      <div class="utd-spinner" />
      <span>Loading...</span>
    </div>
    <div v-else-if="error" class="utd-state utd-error">
      <span>{{ error }}</span>
    </div>

    <!-- Content -->
    <div v-else class="utd-body">
      <!-- Standing -->
      <div class="utd-section utd-standing">
        <div class="utd-section-label">League Position</div>
        <div class="utd-position-number">{{ standing ? ordinal(standing.position) : '–' }}</div>
        <div class="utd-pts">{{ standing?.points }} pts</div>
        <div class="utd-record">
          <span>P{{ standing?.playedGames }}</span>
          <span class="win">W{{ standing?.won }}</span>
          <span class="draw">D{{ standing?.draw }}</span>
          <span class="loss">L{{ standing?.lost }}</span>
        </div>
        <div class="utd-gd">GD {{ (standing?.goalDifference ?? 0) > 0 ? '+' : '' }}{{ standing?.goalDifference }}</div>
        <div v-if="standing?.form" class="utd-form">
          <div class="utd-section-label" style="margin-bottom: 6px">Form</div>
          <div class="form-dots">
            <span
              v-for="(r, i) in standing.form.split(',')"
              :key="i"
              class="form-dot"
              :style="{ background: formColor(r) }"
            >{{ r }}</span>
          </div>
        </div>
      </div>

      <!-- Next Matches -->
      <div class="utd-section utd-next">
        <div class="utd-section-label">Upcoming</div>
        <div v-if="upcomingMatches.length" class="utd-matches-list">
          <div
            v-for="(match, i) in upcomingMatches"
            :key="i"
            class="utd-match-card"
            :class="{ 'utd-match-card--next': i > 0 }"
          >
            <div class="utd-match-row">
              <div class="utd-match-left">
                <div class="utd-match-comp">{{ match.competition }}</div>
                <div class="utd-match-teams">
                  <div class="utd-match-team">
                    <img :src="match.homeCrest" :alt="match.homeTeam" class="match-crest" />
                    <span>{{ match.homeTeam }}</span>
                  </div>
                  <div class="utd-match-vs">VS</div>
                  <div class="utd-match-team">
                    <img :src="match.awayCrest" :alt="match.awayTeam" class="match-crest" />
                    <span>{{ match.awayTeam }}</span>
                  </div>
                </div>
              </div>
              <div class="utd-match-meta">
                <div class="utd-match-time">{{ formatMatchDate(match.date).time }}</div>
                <div class="utd-match-date">{{ formatMatchDate(match.date).day }}</div>
                <div class="utd-match-venue">{{ match.venue }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="utd-no-match">No upcoming matches</div>
      </div>

      <!-- News -->
      <div class="utd-section utd-news">
        <div class="utd-section-label">News</div>
        <div class="utd-news-list">
          <a
            v-for="item in news"
            :key="item.link"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="utd-news-item"
          >
            <span class="utd-news-title">{{ item.title }}</span>
            <span class="utd-news-time">{{ timeAgo(item.pubDate) }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.utd-widget {
  background: #12131f;
  border: 1px solid #3a0a0a;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Header */
.utd-header {
  background: linear-gradient(135deg, #8b0000 0%, #da291c 50%, #b91c1c 100%);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-bottom: 2px solid #7f1d1d;
}

.utd-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.utd-crest {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
}

.utd-name {
  display: flex;
  flex-direction: column;
}

.utd-name-main {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
  line-height: 1.2;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.utd-name-sub {
  font-size: 10px;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.utd-pl-badge {
  width: 32px;
  height: 32px;
  object-fit: contain;
  opacity: 0.9;
}

/* State */
.utd-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #6b7280;
  font-size: 13px;
}

.utd-error {
  color: #ef4444;
}

.utd-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #2a2d3e;
  border-top-color: #da291c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Body */
.utd-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 0;
  min-height: 0;
}

.utd-section {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.utd-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 10px;
}

/* Standing */
.utd-standing {
  width: 160px;
  flex-shrink: 0;
  border-right: 1px solid #1f2133;
}

.utd-position-number {
  font-size: 52px;
  font-weight: 800;
  color: #da291c;
  line-height: 1;
  margin-bottom: 4px;
}

.utd-pts {
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.utd-record {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.utd-record .win { color: #22c55e; }
.utd-record .draw { color: #eab308; }
.utd-record .loss { color: #ef4444; }

.utd-gd {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
}

.form-dots {
  display: flex;
  gap: 4px;
}

.form-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

/* Next Match */
.utd-next {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #1f2133;
}

.utd-matches-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.utd-match-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.utd-match-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.utd-match-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.utd-match-card--next {
  padding-top: 12px;
  border-top: 1px solid #1f2133;
}

.utd-match-comp {
  font-size: 11px;
  color: #6b7280;
  background: #1a1d2e;
  padding: 3px 8px;
  border-radius: 4px;
  width: fit-content;
}

.utd-match-teams {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.utd-match-team {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.match-crest {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.utd-match-vs {
  font-size: 10px;
  font-weight: 700;
  color: #4b5563;
  letter-spacing: 0.1em;
  padding-left: 30px;
}

.utd-match-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  flex-shrink: 0;
  text-align: right;
}

.utd-match-date {
  font-size: 10px;
  font-weight: 600;
  color: #fbbf24;
}

.utd-match-time {
  font-size: 16px;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.1;
}

.utd-match-venue {
  font-size: 10px;
  color: #6b7280;
}

.utd-no-match {
  font-size: 13px;
  color: #4b5563;
  font-style: italic;
}

/* News */
.utd-news {
  flex: 1;
  min-width: 0;
}

.utd-news-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: #3a1515 transparent;
}

.utd-news-list::-webkit-scrollbar { width: 4px; }
.utd-news-list::-webkit-scrollbar-track { background: transparent; }
.utd-news-list::-webkit-scrollbar-thumb { background: #3a1515; border-radius: 4px; }
.utd-news-list::-webkit-scrollbar-thumb:hover { background: #5a2020; }

.utd-news-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 0;
  border-bottom: 1px solid #1a1d2e;
  text-decoration: none;
  transition: padding-left 0.15s;
  cursor: pointer;
}

.utd-news-item:last-child {
  border-bottom: none;
}

.utd-news-item:hover {
  padding-left: 4px;
}

.utd-news-item:hover .utd-news-title {
  color: #fca5a5;
}

.utd-news-title {
  font-size: 13px;
  color: #d1d5db;
  line-height: 1.4;
  transition: color 0.15s;
}

.utd-news-time {
  font-size: 11px;
  color: #4b5563;
}
</style>
