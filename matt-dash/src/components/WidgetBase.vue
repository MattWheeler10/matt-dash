<script setup lang="ts">
defineProps<{
  title: string
  icon?: string
}>()
</script>

<template>
  <div class="widget">
    <div class="widget-header">
      <span v-if="icon" class="widget-icon">{{ icon }}</span>
      <span class="widget-title">{{ title }}</span>
    </div>
    <div class="widget-content">
      <slot>
        <div class="placeholder">
          <span>Coming soon</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.widget {
  background: #1a1d2e;
  border: 1px solid #2a2d3e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  transition: border-color 0.2s;
}

.widget:hover {
  border-color: #3d4160;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #2a2d3e;
  background: #151827;
  flex-shrink: 0;
}

.widget-icon {
  font-size: 16px;
  line-height: 1;
}

.widget-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b7280;
}

.widget-content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #374151;
  font-size: 13px;
  font-style: italic;
  border: 1px dashed #2a2d3e;
  border-radius: 8px;
}
</style>
