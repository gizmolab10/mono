<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import PrevNext from './PrevNext.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <PrevNext />
    </template>
  </Layout>
</template>
