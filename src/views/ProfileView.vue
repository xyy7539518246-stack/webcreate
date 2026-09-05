<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import courses from '@/data/courses.json'

// 个人中心页：账号信息、学习方向、学习记录（数据本地化存储）
const userStore = useUserStore()

const lanes = courses.roadmap

// 当前方向名称
const currentLaneName = computed(() => {
  const direction = userStore.user?.direction
  const lane = lanes.find((l) => l.lane === direction)
  return lane ? lane.laneName : '未选择'
})

function chooseDirection(lane) {
  userStore.setDirection(lane)
}
</script>

<template>
  <div class="page">
    <h1 class="page__title">个人中心</h1>
    <p class="page__subtitle">账号信息 · 学习方向 · 学习记录（数据本地化存储）</p>

    <section class="page__section card">
      <h2>账号信息</h2>
      <p class="page__info">
        当前账号：{{ userStore.user?.username || '未登录' }}
      </p>
    </section>

    <section class="page__section card">
      <h2>学习方向</h2>
      <template v-if="userStore.isLoggedIn">
        <p class="page__info">当前方向：{{ currentLaneName }}</p>
        <div class="direction-tabs">
          <button
            v-for="l in lanes"
            :key="l.lane"
            class="direction-tab"
            :class="{ 'direction-tab--active': userStore.user?.direction === l.lane }"
            @click="chooseDirection(l.lane)"
          >
            {{ l.laneName }}
          </button>
          <button
            v-if="userStore.user?.direction"
            class="direction-tab direction-tab--clear"
            @click="chooseDirection('')"
          >
            清除方向
          </button>
        </div>
        <p class="page__hint">选择后将同步到首页「我的学习路线」区块</p>
      </template>
      <p v-else class="page__placeholder">登录后可选择学习方向</p>
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
  margin-bottom: 12px;
}

.page__hint {
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-top: 12px;
}

.direction-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.direction-tab {
  padding: 6px 16px;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s;
}

.direction-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.direction-tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.direction-tab--clear {
  color: #d93026;
  border-color: #e5b3b0;
}

.direction-tab--clear:hover {
  background: rgba(217, 48, 38, 0.06);
  color: #d93026;
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
