<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import courses from '@/data/courses.json'

const userStore = useUserStore()

// 首页功能入口（后续接入真实数据与路由）
const modules = [
  { key: 'courses', title: '学习资源', desc: '知识点导航与学习路线图', path: '/courses' },
  { key: 'quiz', title: '题库练习', desc: '按知识点练习、即时判题', path: '/quiz' },
  { key: 'examples', title: '示例代码', desc: 'C++ / Java / 前端示例', path: '/examples' },
  { key: 'assistant', title: 'AI 问答', desc: '本地知识检索 + AI 辅助解答', path: '/assistant' }
]

// ===== 学习方向：从学习资源路线数据中选择 =====
const lanes = courses.roadmap

// 当前用户已选方向对应的路线（未选返回 null）
const myLane = computed(() => {
  const direction = userStore.user?.direction
  return lanes.find((l) => l.lane === direction) || null
})

function chooseDirection(lane) {
  userStore.setDirection(lane)
}

function clearDirection() {
  userStore.setDirection('')
}
</script>

<template>
  <div class="home">
    <section class="home__hero card">
      <h1>欢迎来到 WebCreate</h1>
      <p>面向高校学生的 AI 辅助编程学习平台 —— 题库练习 · 示例代码 · 学习路线 · AI 问答</p>
      <p class="home__greeting">
        {{ userStore.isLoggedIn ? `${userStore.user?.username}，继续你的学习之旅吧` : '登录后可同步学习记录与错题本' }}
      </p>
    </section>

    <section class="home__modules">
      <router-link
        v-for="m in modules"
        :key="m.key"
        :to="m.path"
        class="home__module card"
      >
        <h2>{{ m.title }}</h2>
        <p>{{ m.desc }}</p>
      </router-link>
    </section>

    <!-- 我的学习路线：登录后按所选方向展示 -->
    <section class="home__roadmap card">
      <h2>我的学习路线</h2>

      <!-- 未登录 -->
      <p v-if="!userStore.isLoggedIn" class="home__placeholder">
        登录后选择学习方向，首页将为你展示专属学习路线
      </p>

      <!-- 已登录但未选择方向 -->
      <div v-else-if="!myLane" class="lane-pick">
        <p class="home__tip">选择你的学习方向，立即为你输出对应学习路线</p>
        <div class="lane-options">
          <button
            v-for="l in lanes"
            :key="l.lane"
            class="lane-option"
            @click="chooseDirection(l.lane)"
          >
            <span class="lane-option__name">{{ l.laneName }}</span>
            <span class="lane-option__desc">{{ l.desc }}</span>
            <span class="lane-option__meta">{{ l.phases.length }} 个阶段 · 点击选择</span>
          </button>
        </div>
      </div>

      <!-- 已选择方向：展示对应学习路线 -->
      <div v-else class="my-lane">
        <div class="my-lane__head">
          <div class="my-lane__titles">
            <span class="my-lane__name">{{ myLane.laneName }}</span>
            <span class="my-lane__desc">{{ myLane.desc }}</span>
          </div>
          <button class="my-lane__switch" @click="clearDirection">切换方向</button>
        </div>
        <ol class="phase-list">
          <li v-for="phase in myLane.phases" :key="phase.no" class="phase-item">
            <span class="phase__no">{{ phase.no }}</span>
            <div class="phase__body">
              <div class="phase__title">{{ phase.title }}</div>
              <div class="phase__meta">{{ phase.goal }} · {{ phase.duration }}</div>
              <div class="phase__topics">
                <span v-for="t in phase.topics" :key="t" class="tag">{{ t }}</span>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home__hero {
  text-align: center;
  padding: 48px 24px;
  margin-bottom: 24px;
}

.home__hero h1 {
  font-size: 28px;
  margin-bottom: 12px;
}

.home__hero p {
  color: var(--color-text-secondary);
  max-width: 640px;
  margin: 0 auto;
}

.home__greeting {
  margin-top: 12px;
  color: var(--color-primary) !important;
  font-weight: 600;
}

.home__modules {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.home__module {
  display: block;
  color: var(--color-text);
  transition: transform 0.2s, box-shadow 0.2s;
}

.home__module:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(31, 35, 41, 0.12);
}

.home__module h2 {
  font-size: 18px;
  margin-bottom: 8px;
  color: var(--color-primary);
}

.home__module p {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.home__placeholder {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-top: 8px;
}

.home__tip {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 12px;
}

/* 方向选择卡片 */
.lane-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.lane-option {
  flex: 1 1 260px;
  min-width: 0;
  padding: 16px;
  border: 1px solid #e8ebf0;
  border-radius: 10px;
  background: #fff;
  text-align: left;
  transition: all 0.2s;
}

.lane-option:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(47, 107, 255, 0.1);
}

.lane-option__name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

.lane-option__desc {
  display: block;
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-top: 4px;
}

.lane-option__meta {
  display: inline-block;
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-top: 10px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #eef2ff;
}

/* 已选路线 */
.my-lane__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.my-lane__titles {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.my-lane__name {
  font-size: 16px;
  font-weight: 600;
}

.my-lane__desc {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.my-lane__switch {
  padding: 5px 14px;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  background: transparent;
  color: var(--color-primary);
  font-size: 13px;
  flex: 0 0 auto;
}

.my-lane__switch:hover {
  background: rgba(47, 107, 255, 0.08);
}

/* 阶段时间线（与学习资源页一致） */
.phase-list {
  position: relative;
}

.phase-item {
  position: relative;
  padding: 0 0 18px 26px;
}

.phase-item::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 18px;
  bottom: 0;
  width: 2px;
  background: #e3e8f0;
}

.phase-item:last-child::before {
  display: none;
}

.phase-item:last-child {
  padding-bottom: 0;
}

.phase__no {
  position: absolute;
  left: 0;
  top: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phase__title {
  font-weight: 600;
  font-size: 14px;
}

.phase__meta {
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-top: 2px;
}

.phase__topics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.tag {
  background: #eef2ff;
  color: var(--color-primary);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
}
</style>
