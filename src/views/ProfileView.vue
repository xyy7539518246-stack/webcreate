<script setup>
import { useUserStore } from '@/store/user'

// 个人中心页：学习记录、收藏、错题本（数据本地化存储）
const userStore = useUserStore()
</script>

<template>
  <div class="page">
    <h1 class="page__title">个人中心</h1>
    <p class="page__subtitle">学习记录 · 收藏 · 错题本（数据本地化存储）</p>

    <section class="page__section card">
      <h2>账号信息（占位）</h2>
      <p class="page__info">
        当前账号：{{ userStore.user?.username || '未登录' }}
      </p>
    </section>

    <section class="page__section card">
      <h2>学习记录 / 收藏 / 错题本（占位）</h2>
      <div class="page__placeholder">待接入：本地化学习数据</div>
    </section>
  </div>
</template>

<style scoped>
.page__title {
  font-size: 24px;
  margin-bottom: 4px;
}

.page__subtitle {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 20px;
}

.page__section {
  margin-bottom: 16px;
}

.page__section h2 {
  font-size: 16px;
  margin-bottom: 12px;
}

.page__info {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.page__placeholder {
  padding: 24px;
  border: 1px dashed #d5d9e0;
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  text-align: center;
}
</style>
