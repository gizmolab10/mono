<script setup lang="ts">
import { usePrevNext } from 'vitepress/dist/client/theme-default/composables/prev-next'
import VPLink from 'vitepress/dist/client/theme-default/components/VPLink.vue'

const control = usePrevNext()
</script>

<template>
  <div v-if="control.prev?.link || control.next?.link" class="nav-prev-next">
    <VPLink v-if="control.prev?.link" :href="control.prev.link" class="nav-link prev" :title="control.prev.text" :no-icon="true">
      ←
    </VPLink>
    <VPLink v-if="control.next?.link" :href="control.next.link" class="nav-link next" :title="control.next.text" :no-icon="true">
      →
    </VPLink>
  </div>
</template>

<style scoped>
.nav-prev-next {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-size: 16px;
  transition: color 0.2s, background-color 0.2s;
}

.nav-link:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}
</style>
