<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface DriverStanding {
  position: number
  code: string
  firstName: string
  lastName: string
  constructor: string
  points: number
  wins: number
}

const standings = ref<DriverStanding[]>([])
const loading = ref(true)
const error = ref('')
const season = ref('')

onMounted(async () => {
  try {
    // Try current season first, fall back to previous if empty
    let res = await fetch('/api/f1/ergast/f1/current/driverStandings.json')
    if (!res.ok) throw new Error('Failed to fetch standings')
    let data = await res.json()
    let lists = data.MRData.StandingsTable.StandingsLists

    if (!lists.length) {
      res = await fetch('/api/f1/ergast/f1/2025/driverStandings.json')
      if (!res.ok) throw new Error('Failed to fetch standings')
      data = await res.json()
      lists = data.MRData.StandingsTable.StandingsLists
    }

    if (lists.length) {
      season.value = lists[0].season
      standings.value = lists[0].DriverStandings.map((d: any) => ({
        position: parseInt(d.position),
        code: d.Driver.code,
        firstName: d.Driver.givenName,
        lastName: d.Driver.familyName,
        constructor: d.Constructors[0]?.name ?? '',
        points: parseFloat(d.points),
        wins: parseInt(d.wins),
      }))
    }
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load'
  } finally {
    loading.value = false
  }
})

const teamColors: Record<string, string> = {
  'McLaren': '#ff8000',
  'Red Bull': '#3671c6',
  'Ferrari': '#e8002d',
  'Mercedes': '#27f4d2',
  'Aston Martin': '#229971',
  'Alpine': '#0093cc',
  'Williams': '#64c4ff',
  'RB': '#6692ff',
  'Kick Sauber': '#52e252',
  'Haas F1 Team': '#b6babd',
}

function getTeamColor(name: string) {
  for (const [key, color] of Object.entries(teamColors)) {
    if (name.includes(key)) return color
  }
  return '#6b7280'
}
</script>

<template>
  <div class="f1s-widget">
    <div class="f1s-header">
      <img src="@/assets/images/f1 logo.png" alt="F1" class="f1s-logo" />
      <span class="f1s-title">Driver Standings {{ season }}</span>
    </div>

    <div v-if="loading" class="f1s-state">
      <div class="f1s-spinner" />
    </div>
    <div v-else-if="error" class="f1s-state f1s-error">{{ error }}</div>

    <div v-else class="f1s-table-wrap">
      <table class="f1s-table">
        <thead>
          <tr>
            <th class="col-pos">#</th>
            <th class="col-driver">Driver</th>
            <th class="col-num">W</th>
            <th class="col-num col-pts">Pts</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in standings" :key="d.position">
            <td class="col-pos">{{ d.position }}</td>
            <td class="col-driver">
              <span class="team-bar" :style="{ background: getTeamColor(d.constructor) }" />
              <span class="driver-name">
                <span class="driver-first">{{ d.firstName.charAt(0) }}.</span>
                <span class="driver-last">{{ d.lastName }}</span>
              </span>
              <span class="driver-team">{{ d.constructor }}</span>
            </td>
            <td class="col-num">{{ d.wins }}</td>
            <td class="col-num col-pts">{{ d.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.f1s-widget {
  background: #1a1d2e;
  border: 1px solid #2a2d3e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.f1s-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #2a2d3e;
  background: #151827;
  flex-shrink: 0;
}

.f1s-logo {
  height: 22px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.f1s-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e8002d;
}

.f1s-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 12px;
}

.f1s-error { color: #ef4444; }

.f1s-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #2a2d3e;
  border-top-color: #e8002d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.f1s-table-wrap {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: #2a2d3e transparent;
}

.f1s-table-wrap::-webkit-scrollbar { width: 4px; }
.f1s-table-wrap::-webkit-scrollbar-track { background: transparent; }
.f1s-table-wrap::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 4px; }
.f1s-table-wrap::-webkit-scrollbar-thumb:hover { background: #3d4160; }

.f1s-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.f1s-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.f1s-table th {
  background: #151827;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 9px;
  letter-spacing: 0.05em;
  padding: 6px 4px;
  text-align: center;
  border-bottom: 1px solid #2a2d3e;
}

.f1s-table th.col-driver {
  text-align: left;
  padding-left: 8px;
}

.f1s-table td {
  padding: 5px 4px;
  text-align: center;
  color: #9ca3af;
  border-bottom: 1px solid #1f2133;
  white-space: nowrap;
}

.col-pos {
  width: 24px;
  color: #6b7280;
  font-weight: 600;
}

.col-driver {
  text-align: left !important;
  padding-left: 8px !important;
  display: flex;
  align-items: center;
  gap: 6px;
}

.team-bar {
  width: 3px;
  height: 18px;
  border-radius: 2px;
  flex-shrink: 0;
}

.driver-name {
  display: flex;
  gap: 3px;
  min-width: 0;
}

.driver-first {
  color: #6b7280;
  font-size: 10px;
}

.driver-last {
  color: #d1d5db;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
}

.driver-team {
  color: #4b5563;
  font-size: 9px;
  margin-left: auto;
  flex-shrink: 0;
}

.col-num { width: 32px; }

.col-pts {
  color: #e2e8f0 !important;
  font-weight: 700;
}

tr:hover {
  background: rgba(255, 255, 255, 0.03);
}
</style>
