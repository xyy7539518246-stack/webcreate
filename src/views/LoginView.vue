<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { isValidUsername, isPasswordValid } from '@/utils/validate'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: ''
})

const errors = ref({})
const loading = ref(false)

function validate() {
  const errs = {}
  if (!isValidUsername(form.username)) {
    errs.username = '请输入正确的账号（3~20 位字母、数字或下划线）'
  }
  if (!isPasswordValid(form.password)) {
    errs.password = '密码长度为 6~20 位'
  }
  errors.value = errs
  return Object.keys(errs).length === 0
}

function handleSubmit() {
  if (!validate()) return
  loading.value = true
  // 本地模拟登录：后续接入本地数据校验
  setTimeout(() => {
    userStore.login({
      token: `demo-token-${Date.now()}`,
      user: { username: form.username, nickname: form.username }
    })
    router.push(route.query.redirect || '/')
  }, 300)
}
</script>

<template>
  <div class="login">
    <div class="login__card card">
      <h1 class="login__title">登录 WebCreate</h1>
      <p class="login__subtitle">AI 编程学习助手 · 登录后开始学习</p>

      <form class="login__form" @submit.prevent="handleSubmit">
        <label class="login__field">
          <span>账号</span>
          <input
            v-model.trim="form.username"
            type="text"
            placeholder="请输入账号"
            autocomplete="username"
          />
          <span v-if="errors.username" class="login__error">{{ errors.username }}</span>
        </label>

        <label class="login__field">
          <span>密码</span>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
          <span v-if="errors.password" class="login__error">{{ errors.password }}</span>
        </label>

        <button class="btn login__submit" type="submit" :disabled="loading">
          {{ loading ? '登录中…' : '登 录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login {
  min-height: calc(100vh - var(--nav-height));
  display: flex;
  align-items: center;
  justify-content: center;
}

.login__card {
  width: 100%;
  max-width: 380px;
  padding: 32px;
}

.login__title {
  font-size: 22px;
  margin-bottom: 4px;
}

.login__subtitle {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 24px;
}

.login__field {
  display: block;
  margin-bottom: 16px;
}

.login__field > span {
  display: block;
  font-size: 13px;
  margin-bottom: 6px;
  color: var(--color-text-secondary);
}

.login__field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dfe2e8;
  border-radius: 8px;
  outline: none;
}

.login__field input:focus {
  border-color: var(--color-primary);
}

.login__error {
  color: #d93026;
  font-size: 12px;
  margin-top: 4px;
}

.login__submit {
  width: 100%;
  margin-top: 8px;
}
</style>
