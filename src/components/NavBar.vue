<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const navItems = [
  { name: 'home', label: '首页', path: '/' },
  { name: 'courses', label: '学习资源', path: '/courses' },
  { name: 'quiz', label: '题库练习', path: '/quiz' },
  { name: 'examples', label: '示例代码', path: '/examples' },
  { name: 'assistant', label: 'AI 问答', path: '/assistant' },
  { name: 'profile', label: '个人中心', path: '/profile' }
]

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="navbar">
    <div class="navbar__inner container">
      <router-link to="/" class="navbar__logo">WebCreate</router-link>

      <nav class="navbar__nav">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="navbar__link"
          active-class="navbar__link--active"
        >
          {{ item.label }}
        </router-link>
      </nav>

      <div class="navbar__user">
        <template v-if="userStore.isLoggedIn">
          <span class="navbar__username">{{ userStore.user?.username }}</span>
          <button class="navbar__logout" @click="handleLogout">退出</button>
        </template>
        <router-link v-else to="/login" class="navbar__login">登录</router-link>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--nav-height);
  background: var(--color-surface);
  box-shadow: var(--shadow);
}

.navbar__inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 24px;
}

.navbar__logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

.navbar__nav {
  display: flex;
  gap: 4px;
  flex: 1;
}

.navbar__link {
  padding: 6px 12px;
  border-radius: 8px;
  color: var(--color-text);
  font-size: 14px;
}

.navbar__link:hover {
  color: var(--color-primary);
  background: rgba(47, 107, 255, 0.06);
}

.navbar__link--active {
  color: var(--color-primary);
  background: rgba(47, 107, 255, 0.1);
  font-weight: 600;
}

.navbar__user {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.navbar__username {
  color: var(--color-text-secondary);
}

.navbar__logout,
.navbar__login {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 14px;
}

.navbar__logout {
  border: 1px solid #e0e3e8;
  background: transparent;
  color: var(--color-text-secondary);
}

.navbar__logout:hover {
  color: #d93026;
  border-color: #d93026;
}

.navbar__login {
  background: var(--color-primary);
  color: #fff;
}

@media (max-width: 768px) {
  .navbar__nav {
    display: none;
  }
}
</style>
