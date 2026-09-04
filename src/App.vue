<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'

const route = useRoute()

// 需要登录后访问的页面（登录页除外）
const requiresAuth = computed(() => route.meta.requiresAuth === true)
</script>

<template>
  <div class="app-shell">
    <NavBar v-if="!route.meta.hideNav" />
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}
</style>
