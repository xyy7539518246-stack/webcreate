<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { isValidPhone, isPasswordValid } from '@/utils/validate'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({
  phone: '',
  password: ''
})

const errors = ref({})
const loading = ref(false)
// 未注册提示：出现后引导前往注册页
const promptPhone = ref('')

function goRegister() {
  router.push({ path: '/register', query: { phone: promptPhone.value } })
}

function validate() {
  const errs = {}
  if (!isValidPhone(form.phone)) {
    errs.phone = '请输入正确的 11 位手机号'
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

  // 本地模拟登录：以浏览器 storage 中的用户数据作为登录凭证
  setTimeout(() => {
    const res = userStore.loginWithPhone({ phone: form.phone, password: form.password })
    loading.value = false

    if (!res.ok) {
      // 未注册：显示提示条 + 确认按钮，引导去注册
      if (res.message.includes('尚未注册')) {
        promptPhone.value = form.phone
        return
      }
      if (res.message.includes('密码')) {
        errors.value.password = res.message
      }
      return
    }

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
          <span>手机号</span>
          <input
            v-model.trim="form.phone"
            type="tel"
            maxlength="11"
            placeholder="请输入 11 位手机号"
            autocomplete="tel"
            :class="{ 'is-error': errors.phone }"
          />
          <span v-if="errors.phone" class="login__error">{{ errors.phone }}</span>
        </label>

        <label class="login__field">
          <span>密码</span>
          <input
            v-model="form.password"
            type="password"
            placeholder="6~20 位密码"
            autocomplete="current-password"
            :class="{ 'is-error': errors.password }"
          />
          <span v-if="errors.password" class="login__error">{{ errors.password }}</span>
        </label>

        <button class="btn login__submit" type="submit" :disabled="loading">
          {{ loading ? '登录中…' : '登 录' }}
        </button>
      </form>

      <div v-if="promptPhone" class="login__prompt">
        <span class="login__prompt-text">
          该手机号 {{ promptPhone }} 尚未注册，是否前往注册？
        </span>
        <button type="button" class="btn login__prompt-confirm" @click="goRegister">
          去注册
        </button>
        <button
          type="button"
          class="login__prompt-close"
          aria-label="关闭提示"
          @click="promptPhone = ''"
        >
          ×
        </button>
      </div>

      <p class="login__switch">
        <router-link to="/forgot-password" class="login__forgot">忘记密码？</router-link>
        <span class="login__switch-sep">·</span>
        <router-link to="/register">没有账号？去注册</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
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

.login__field input.is-error {
  border-color: #d93026;
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

.login__prompt {
  margin-top: 16px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #f3b8b3;
  border-radius: 8px;
  background: #fef2f1;
}

.login__prompt-text {
  flex: 1;
  font-size: 13px;
  color: #d93026;
  line-height: 1.5;
}

.login__prompt-confirm {
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 13px;
}

.login__prompt-close {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: #e08d86;
  font-size: 16px;
  line-height: 1;
  padding: 2px 4px;
}

.login__prompt-close:hover {
  color: #d93026;
}

.login__switch {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.login__switch-sep {
  color: #d5d9e0;
}

/* ===== 移动端微调 ===== */
@media (max-width: 768px) {
  .login__card {
    padding: 24px 20px;
  }

  .login__prompt {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
