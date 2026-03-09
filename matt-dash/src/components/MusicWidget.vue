<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ChartTrack {
  position: number
  name: string
  artist: string
  artwork: string
  url: string
}


const charts = ref<ChartTrack[]>([])
const hiphopCharts = ref<ChartTrack[]>([])
const chartsError = ref('')
const hiphopError = ref('')
const loading = ref(true)

async function fetchItunesChart(url: string): Promise<ChartTrack[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const data = await res.json()
  const entries = data?.feed?.entry ?? []
  if (!entries.length) throw new Error('No chart data')
  return entries.map((r: any, i: number) => {
    const links = Array.isArray(r.link) ? r.link : [r.link]
    const url = links.find((l: any) => l?.attributes?.rel === 'alternate')?.attributes?.href
      ?? links[0]?.attributes?.href
      ?? '#'
    return {
      position: i + 1,
      name: r['im:name']?.label ?? '',
      artist: r['im:artist']?.label ?? '',
      artwork: r['im:image']?.[2]?.label ?? r['im:image']?.[0]?.label ?? '',
      url,
    }
  })
}

onMounted(async () => {
  await Promise.allSettled([
    fetchItunesChart('/api/itunes/gb/rss/topsongs/limit=10/json')
      .then(items => { charts.value = items })
      .catch(e => { chartsError.value = e.message }),
    fetchItunesChart('/api/itunes/gb/rss/topsongs/limit=10/genre=18/json')
      .then(items => { hiphopCharts.value = items })
      .catch(e => { hiphopError.value = e.message }),
  ])
  loading.value = false
})
</script>

<template>
  <div class="music-widget">
    <!-- Header -->
    <div class="music-header">
      <div class="music-header-left">
        <div class="music-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="note-svg">
            <path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/>
            <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="music-header-text">
          <span class="music-header-title">Music</span>
          <span class="music-header-sub">Charts &amp; Hip-Hop</span>
        </div>
      </div>
      <div class="music-header-right">
        <span class="chart-badge">🇬🇧 iTunes Charts</span>
      </div>
    </div>

    <div v-if="loading" class="music-state">
      <div class="music-spinner" />
      <span>Loading...</span>
    </div>

    <div v-else class="music-body">
      <!-- Charts column -->
      <div class="music-section">
        <div class="section-header">
          <span class="section-dot chart-dot" />
          <span class="section-label">Top 10 Songs</span>
        </div>
        <div v-if="chartsError" class="feed-error">{{ chartsError }}</div>
        <div v-else class="chart-list">
          <a
            v-for="track in charts"
            :key="track.url"
            :href="track.url"
            target="_blank"
            rel="noopener noreferrer"
            class="chart-item"
          >
            <span class="chart-pos" :class="{ 'top3': track.position <= 3 }">{{ track.position }}</span>
            <img :src="track.artwork" :alt="track.name" class="chart-artwork" />
            <div class="chart-info">
              <span class="chart-title">{{ track.name }}</span>
              <span class="chart-artist">{{ track.artist }}</span>
            </div>
          </a>
        </div>
      </div>

      <!-- Divider -->
      <div class="col-divider" />

      <!-- Hip-Hop column -->
      <div class="music-section">
        <div class="section-header">
          <span class="section-dot hiphop-dot" />
          <span class="section-label">Hip-Hop &amp; Rap</span>
        </div>
        <div v-if="hiphopError" class="feed-error">{{ hiphopError }}</div>
        <div v-else class="chart-list">
          <a
            v-for="track in hiphopCharts"
            :key="track.url"
            :href="track.url"
            target="_blank"
            rel="noopener noreferrer"
            class="chart-item"
          >
            <span class="chart-pos" :class="{ 'top3': track.position <= 3 }">{{ track.position }}</span>
            <img :src="track.artwork" :alt="track.name" class="chart-artwork" />
            <div class="chart-info">
              <span class="chart-title">{{ track.name }}</span>
              <span class="chart-artist">{{ track.artist }}</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.music-widget {
  background: #12131f;
  border: 1px solid #1a1a2e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Header */
.music-header {
  background: linear-gradient(135deg, #1a0533 0%, #6b21a8 55%, #a855f7 100%);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-bottom: 2px solid #581c87;
}

.music-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.music-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4));
}

.note-svg {
  width: 28px;
  height: 28px;
}

.music-header-text {
  display: flex;
  flex-direction: column;
}

.music-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.music-header-sub {
  font-size: 10px;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.chart-badge {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  background: rgba(0,0,0,0.25);
  padding: 3px 10px;
  border-radius: 4px;
}

/* State */
.music-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #6b7280;
  font-size: 13px;
}

.music-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #2a2d3e;
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Body */
.music-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.music-section {
  flex: 1 1 0;
  width: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  overflow: hidden;
  min-height: 0;
}

.col-divider {
  width: 1px;
  background: #1f2133;
  flex-shrink: 0;
  margin: 12px 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.section-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chart-dot { background: #a855f7; }
.hiphop-dot { background: #f59e0b; }

.section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
}

/* Chart list */
.chart-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  gap: 0;
  scrollbar-width: thin;
  scrollbar-color: #2d1a45 transparent;
}

.chart-list::-webkit-scrollbar { width: 4px; }
.chart-list::-webkit-scrollbar-track { background: transparent; }
.chart-list::-webkit-scrollbar-thumb { background: #2d1a45; border-radius: 4px; }
.chart-list::-webkit-scrollbar-thumb:hover { background: #4a2a70; }

.chart-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid #1a1d2e;
  text-decoration: none;
  transition: padding-left 0.15s;
  cursor: pointer;
}

.chart-item:last-child { border-bottom: none; }
.chart-item:hover { padding-left: 4px; }
.chart-item:hover .chart-title { color: #a855f7; }

.chart-pos {
  font-size: 12px;
  font-weight: 800;
  color: #4b5563;
  min-width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.chart-pos.top3 {
  color: #a855f7;
}

.chart-artwork {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.chart-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chart-title {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s;
}

.chart-artist {
  font-size: 10px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


.feed-error {
  font-size: 11px;
  color: #ef4444;
  padding: 6px 0;
}
</style>
