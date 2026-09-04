<script setup>
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

// 首页功能入口（后续接入真实数据与路由）
const modules = [
  { key: 'courses', title: '学习资源', desc: '知识点导航与学习路线图', path: '/courses' },
  { key: 'quiz', title: '题库练习', desc: '按知识点练习、即时判题', path: '/quiz' },
  { key: 'examples', title: '示例代码', desc: 'C++ / Java / 前端示例', path: '/examples' },
  { key: 'assistant', title: 'AI 问答', desc: '本地知识检索 + AI 辅助解答', path: '/assistant' }
]
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

    <section class="home__roadmap card">
      <h2>学习路线图（占位）</h2>
      <p class="home__placeholder">待接入：学习路线数据与进度展示</p>
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
</style>
