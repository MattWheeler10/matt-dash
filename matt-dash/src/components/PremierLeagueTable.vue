<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface TeamRow {
  position: number
  name: string
  shortName: string
  crest: string
  playedGames: number
  won: number
  draw: number
  lost: number
  goalDifference: number
  points: number
}

const table = ref<TeamRow[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const res = await fetch('/api/football/v4/competitions/PL/standings')
    if (!res.ok) throw new Error('Failed to fetch standings')
    const data = await res.json()
    table.value = data.standings[0].table.map((t: any) => ({
      position: t.position,
      name: t.team.name,
      shortName: t.team.shortName,
      crest: t.team.crest,
      playedGames: t.playedGames,
      won: t.won,
      draw: t.draw,
      lost: t.lost,
      goalDifference: t.goalDifference,
      points: t.points,
    }))
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load'
  } finally {
    loading.value = false
  }
})

function isManUtd(name: string) {
  return name.includes('Manchester United') || name.includes('Man United')
}
</script>

<template>
  <div class="pl-widget">
    <div class="pl-header">
      <img src="@/assets/images/pl logo.png" alt="PL" class="pl-logo" />
      <span class="pl-title">Premier League Table</span>
    </div>

    <div v-if="loading" class="pl-state">
      <div class="pl-spinner" />
    </div>
    <div v-else-if="error" class="pl-state pl-error">{{ error }}</div>

    <div v-else class="pl-table-wrap">
      <table class="pl-table">
        <thead>
          <tr>
            <th class="col-pos">#</th>
            <th class="col-team">Team</th>
            <th class="col-num">P</th>
            <th class="col-num">W</th>
            <th class="col-num">D</th>
            <th class="col-num">L</th>
            <th class="col-num">GD</th>
            <th class="col-num col-pts">Pts</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in table"
            :key="row.position"
            :class="{ 'utd-row': isManUtd(row.name) }"
          >
            <td class="col-pos">{{ row.position }}</td>
            <td class="col-team">
              <img :src="row.crest" :alt="row.shortName" class="team-crest" />
              <span class="team-name">{{ row.shortName }}</span>
            </td>
            <td class="col-num">{{ row.playedGames }}</td>
            <td class="col-num">{{ row.won }}</td>
            <td class="col-num">{{ row.draw }}</td>
            <td class="col-num">{{ row.lost }}</td>
            <td class="col-num">{{ row.goalDifference > 0 ? '+' : '' }}{{ row.goalDifference }}</td>
            <td class="col-num col-pts">{{ row.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.pl-widget {
  background: #1a1d2e;
  border: 1px solid #2a2d3e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.pl-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #2a2d3e;
  background: #151827;
  flex-shrink: 0;
}

.pl-logo {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.pl-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8b5cf6;
}

.pl-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 12px;
}

.pl-error { color: #ef4444; }

.pl-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #2a2d3e;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.pl-table-wrap {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: #2a2d3e transparent;
}

.pl-table-wrap::-webkit-scrollbar { width: 4px; }
.pl-table-wrap::-webkit-scrollbar-track { background: transparent; }
.pl-table-wrap::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 4px; }
.pl-table-wrap::-webkit-scrollbar-thumb:hover { background: #3d4160; }

.pl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.pl-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.pl-table th {
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

.pl-table th.col-team {
  text-align: left;
  padding-left: 8px;
}

.pl-table td {
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

.col-team {
  text-align: left !important;
  padding-left: 8px !important;
  display: flex;
  align-items: center;
  gap: 6px;
}

.team-crest {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.team-name {
  overflow: hidden;
  text-overflow: ellipsis;
  color: #d1d5db;
}

.col-num {
  width: 28px;
}

.col-pts {
  color: #e2e8f0 !important;
  font-weight: 700;
}

.utd-row {
  background: rgba(218, 41, 28, 0.1);
}

.utd-row td {
  color: #fca5a5;
}

.utd-row .col-pts {
  color: #da291c !important;
}

.utd-row .team-name {
  color: #fca5a5;
  font-weight: 600;
}

tr:hover {
  background: rgba(255, 255, 255, 0.03);
}
</style>
