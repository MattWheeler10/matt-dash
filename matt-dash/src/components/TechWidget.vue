<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface NewsItem {
  title: string
  link: string
  pubDate: string
}

const techNews = ref<NewsItem[]>([])
const gamingNews = ref<NewsItem[]>([])
const techError = ref('')
const gamingError = ref('')
const loading = ref(true)

async function fetchFeed(url: string): Promise<NewsItem[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const text = await res.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(text, 'text/xml')
  const items = xml.querySelectorAll('item, entry')
  if (!items.length) throw new Error('No items in feed')
  return Array.from(items).slice(0, 8).map((item) => {
    const title = item.querySelector('title')?.textContent?.trim() ?? ''
    const linkEl = item.querySelector('link')
    const link = linkEl?.textContent?.trim() || linkEl?.getAttribute('href') || '#'
    const pubDate =
      item.querySelector('pubDate')?.textContent ??
      item.querySelector('published')?.textContent ??
      item.querySelector('updated')?.textContent ?? ''
    return { title, link, pubDate }
  })
}

onMounted(async () => {
  await Promise.allSettled([
    fetchFeed('/api/bbc-sport/news/technology/rss.xml')
      .then(items => { techNews.value = items })
      .catch(e => { techError.value = e.message }),
    fetchFeed('/api/gamespot/feeds/mashup')
      .then(items => { gamingNews.value = items })
      .catch(e => { gamingError.value = e.message }),
  ])
  loading.value = false
})

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
</script>

<template>
  <div class="tech-widget">
    <!-- Header -->
    <div class="tech-header">
      <div class="tech-header-left">
        <img src="@/assets/images/apple-logo.png" alt="Apple" class="header-logo apple-logo" />
        <div class="tech-header-text">
          <span class="tech-header-title">Tech &amp; Gaming</span>
          <span class="tech-header-sub">Latest Headlines</span>
        </div>
      </div>
      <img src="@/assets/images/xbox-logo.png" alt="Xbox" class="header-logo xbox-logo" />
    </div>

    <div v-if="loading" class="tech-state">
      <div class="tech-spinner" />
      <span>Loading...</span>
    </div>

    <div v-else class="tech-body">
      <!-- Tech news -->
      <div class="tech-section">
        <div class="section-header">
          <span class="section-dot tech-dot" />
          <span class="section-label">BBC Technology</span>
        </div>
        <div v-if="techError" class="feed-error">{{ techError }}</div>
        <div v-else class="news-list">
          <a
            v-for="item in techNews"
            :key="item.link"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="news-item tech-item"
          >
            <span class="news-title">{{ item.title }}</span>
            <span class="news-time">{{ timeAgo(item.pubDate) }}</span>
          </a>
        </div>
      </div>

      <!-- Divider -->
      <div class="col-divider" />

      <!-- Gaming news -->
      <div class="tech-section">
        <div class="section-header">
          <span class="section-dot gaming-dot" />
          <span class="section-label">GameSpot</span>
        </div>
        <div v-if="gamingError" class="feed-error">{{ gamingError }}</div>
        <div v-else class="news-list">
          <a
            v-for="item in gamingNews"
            :key="item.link"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="news-item gaming-item"
          >
            <span class="news-title">{{ item.title }}</span>
            <span class="news-time">{{ timeAgo(item.pubDate) }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tech-widget {
  background: #12131f;
  border: 1px solid #1a1a2e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Header */
.tech-header {
  background: linear-gradient(135deg, #0a0a0a 0%, #1c1c1e 50%, #2c2c2e 100%);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-bottom: 2px solid #3a3a3c;
}

.tech-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-logo {
  height: 32px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
}

.apple-logo {
  filter: brightness(0) invert(1) drop-shadow(0 1px 3px rgba(0,0,0,0.5));
}

.xbox-logo {
  height: 36px;
}

.tech-header-text {
  display: flex;
  flex-direction: column;
}

.tech-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #f5f5f7;
  line-height: 1.2;
}

.tech-header-sub {
  font-size: 10px;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}


/* State */
.tech-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #6b7280;
  font-size: 13px;
}

.tech-error { color: #ef4444; }

.feed-error {
  font-size: 11px;
  color: #ef4444;
  padding: 6px 0;
}

.tech-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #2a2d3e;
  border-top-color: #f5f5f7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Body */
.tech-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.tech-section {
  flex: 1;
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

.tech-dot { background: #0a84ff; }
.gaming-dot { background: #30d158; }

.section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
}

/* News lists */
.news-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: #1e2030 transparent;
}

.news-list::-webkit-scrollbar { width: 4px; }
.news-list::-webkit-scrollbar-track { background: transparent; }
.news-list::-webkit-scrollbar-thumb { background: #1e2030; border-radius: 4px; }
.news-list::-webkit-scrollbar-thumb:hover { background: #2a2d42; }

.news-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 0;
  border-bottom: 1px solid #1a1d2e;
  text-decoration: none;
  transition: padding-left 0.15s;
  cursor: pointer;
}

.news-item:last-child { border-bottom: none; }

.tech-item:hover .news-title { color: #0a84ff; }
.gaming-item:hover .news-title { color: #30d158; }
.news-item:hover { padding-left: 4px; }

.news-title {
  font-size: 12px;
  color: #d1d5db;
  line-height: 1.4;
  transition: color 0.15s;
}

.news-time {
  font-size: 10px;
  color: #4b5563;
}
</style>
