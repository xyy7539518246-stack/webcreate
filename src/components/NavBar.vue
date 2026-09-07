<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const menuOpen = ref(false)

const navItems = [
  { name: 'home', label: '首页', path: '/' },
  { name: 'courses', label: '学习资源', path: '/courses' },
  { name: 'quiz', label: '题库练习', path: '/quiz' },
  { name: 'examples', label: '示例代码', path: '/examples' },
  { name: 'assistant', label: 'AI 问答', path: '/assistant' },
  { name: 'profile', label: '个人中心', path: '/profile' }
]

function handleLogout() {
  menuOpen.value = false
  userStore.logout()
  router.push('/login')
}

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}
</script>

<template>
  <header class="navbar">
    <div class="navbar__inner container">
      <router-link to="/" class="navbar__logo" @click="closeMenu">WebCreate</router-link>

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

      <!-- 移动端汉堡按钮 -->
      <button
        class="navbar__burger"
        :class="{ 'navbar__burger--open': menuOpen }"
        aria-label="打开菜单"
        aria-expanded="menuOpen"
        @click="toggleMenu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- 移动端下拉菜单 -->
    <transition name="menu">
      <div v-if="menuOpen" class="navbar__mobile">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="navbar__mobile-link"
          active-class="navbar__mobile-link--active"
          @click="closeMenu"
        >
          {{ item.label }}
        </router-link>
        <div class="navbar__mobile-user">
          <template v-if="userStore.isLoggedIn">
            <span class="navbar__mobile-username">{{ userStore.user?.username }}</span>
            <button class="navbar__mobile-logout" @click="handleLogout">退出登录</button>
          </template>
          <router-link v-else to="/login" class="navbar__mobile-login" @click="closeMenu">
            登录
          </router-link>
        </div>
      </div>
    </transition>
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

/* ===== 汉堡按钮（默认隐藏，移动端显示） ===== */
.navbar__burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: 8px;
}

.navbar__burger span {
  display: block;
  height: 2px;
  width: 100%;
  border-radius: 2px;
  background: var(--color-text);
  transition: transform 0.25s, opacity 0.25s;
}

.navbar__burger--open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.navbar__burger--open span:nth-child(2) {
  opacity: 0;
}

.navbar__burger--open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* ===== 移动端下拉菜单 ===== */
.navbar__mobile {
  display: none;
  flex-direction: column;
  background: var(--color-surface);
  border-top: 1px solid #eceef2;
  box-shadow: var(--shadow);
  padding: 8px 16px 16px;
}

.navbar__mobile-link {
  padding: 12px 8px;
  border-radius: 8px;
  color: var(--color-text);
  font-size: 15px;
}

.navbar__mobile-link:hover {
  color: var(--color-primary);
  background: rgba(47, 107, 255, 0.06);
}

.navbar__mobile-link--active {
  color: var(--color-primary);
  background: rgba(47, 107, 255, 0.1);
  font-weight: 600;
}

.navbar__mobile-user {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #eceef2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.navbar__mobile-username {
  color: var(--color-text-secondary);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar__mobile-logout {
  padding: 8px 16px;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  flex-shrink: 0;
}

.navbar__mobile-logout:hover {
  color: #d93026;
  border-color: #d93026;
}

.navbar__mobile-login {
  padding: 8px 20px;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  flex-shrink: 0;
}

/* 展开动画 */
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}

/* ===== 移动端断点 ===== */
@media (max-width: 768px) {
  .navbar__nav {
    display: none;
  }

  .navbar__user {
    display: none;
  }

  .navbar__burger {
    display: flex;
    margin-left: auto;
  }

  .navbar__mobile {
    display: flex;
  }
}
</style>
