<script setup lang="ts">
import WidgetBase from './components/WidgetBase.vue'
import ManUtdWidget from './components/ManUtdWidget.vue'
import PremierLeagueTable from './components/PremierLeagueTable.vue'
import F1Widget from './components/F1Widget.vue'
import F1StandingsWidget from './components/F1StandingsWidget.vue'
import ManchesterWidget from './components/ManchesterWidget.vue'
import TechWidget from './components/TechWidget.vue'
import MusicWidget from './components/MusicWidget.vue'
</script>

<template>
  <div class="dashboard">
    <div class="grid">

      <!-- ROW 1: Hero + two smalls -->
      <div class="col-6 row-3">
        <ManUtdWidget />
      </div>

      <div class="col-6 row-3">
        <F1Widget />
      </div>

      <!-- ROW 2: Three equal mediums -->
      <div class="col-4 row-3">
        <PremierLeagueTable />
      </div>

      <div class="col-4 row-3">
        <F1StandingsWidget />
      </div>

      <div class="col-4 row-3">
        <ManchesterWidget />
      </div>

      <!-- ROW 3: Tech + Music -->
      <div class="col-6 row-3">
        <TechWidget />
      </div>

      <div class="col-6 row-3">
        <MusicWidget />
      </div>

      <div class="col-3 row-1">
        <WidgetBase title="Widget H" icon="◈" />
      </div>

      <div class="col-3 row-1">
        <WidgetBase title="Widget I" icon="◈" />
      </div>

      <div class="col-3 row-1">
        <WidgetBase title="Widget J" icon="◈" />
      </div>

      <div class="col-3 row-1">
        <WidgetBase title="Widget K" icon="◈" />
      </div>

    </div>
  </div>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #app {
  min-height: 100%;
  width: 100%;
}

body {
  background: #0d0f1a;
  color: #e2e8f0;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  overflow-y: auto;
  overflow-x: hidden;
}

.dashboard {
  min-height: 100vh;
  width: 100%;
  padding: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: 120px;
  gap: 12px;
}

/* Column spans */
.col-3  { grid-column: span 3; }
.col-4  { grid-column: span 4; }
.col-6  { grid-column: span 6; }
.col-8  { grid-column: span 8; }
.col-9  { grid-column: span 9; }
.col-12 { grid-column: span 12; }

/* Row spans */
.row-1 { grid-row: span 1; }
.row-2 { grid-row: span 2; }
.row-3 { grid-row: span 3; }
.row-4 { grid-row: span 4; }
.row-5 { grid-row: span 5; }
</style>
