<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { isValidPhone, isPasswordValid } from '@/utils/validate'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 从登录页“去注册”跳转时预填手机号
onMounted(() => {
  if (route.query.phone) {
    form.phone = String(route.query.phone)
  }
})

const form = reactive({
  phone: '',
  code: '',
  password: ''
})

const errors = ref({})
const loading = ref(false)

// 验证码 60 秒倒计时
const COUNT_DOWN = 60
const countdown = ref(0)
let timer = null

function startCountdown() {
  countdown.value = COUNT_DOWN
  clearInterval(timer)
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

onUnmounted(() => clearInterval(timer))

// 获取验证码：校验手机号格式 + 唯一性，生成随机 6 位码并以提示方式给出（后端样例）
function sendCode() {
  errors.value = {}
  if (!isValidPhone(form.phone)) {
    errors.value.phone = '请输入正确的 11 位手机号'
    return
  }
  if (userStore.hasPhone(form.phone)) {
    errors.value.phone = '该手机号已注册，请直接登录'
    return
  }
  const { code } = userStore.createCode(form.phone)
  // 模拟短信下发：真实场景由后端生成并发送，此处以提示方式给出，作为后端样例
  alert(`【WebCreate】您的验证码为 ${code}，60 秒内有效（后端样例：实际由服务端下发短信）`)
  startCountdown()
}

function validate() {
  const errs = {}
  if (!isValidPhone(form.phone)) errs.phone = '请输入正确的 11 位手机号'
  if (!form.code) errs.code = '请输入验证码'
  if (!isPasswordValid(form.password)) errs.password = '密码长度为 6~20 位'
  errors.value = errs
  return Object.keys(errs).length === 0
}

function handleSubmit() {
  if (!validate()) return

  // 手机号唯一性兜底校验
  if (userStore.hasPhone(form.phone)) {
    errors.value.phone = '该手机号已注册，请直接登录'
    return
  }

  // 验证码失效（60 秒超时）即注册失败
  const record = userStore.getCode(form.phone)
  if (!record) {
    errors.value.code = '验证码已失效（超过 60 秒），注册失败，请重新获取'
    return
  }
  if (record.code !== form.code.trim()) {
    errors.value.code = '验证码错误，请重试'
    return
  }

  loading.value = true
  const res = userStore.register({ phone: form.phone, password: form.password })
  loading.value = false

  if (!res.ok) {
    errors.value.phone = res.message
    return
  }

  userStore.removeCode(form.phone)
  alert('注册成功，已自动登录')
  router.push('/')
}
</script>

<template>
  <div class="register">
    <div class="register__card card">
      <h1 class="register__title">注册 WebCreate</h1>
      <p class="register__subtitle">手机号注册 · 验证码 60 秒内有效</p>

      <form class="register__form" @submit.prevent="handleSubmit">
        <label class="register__field">
          <span>手机号</span>
          <input
            v-model.trim="form.phone"
            type="tel"
            maxlength="11"
            placeholder="请输入 11 位手机号"
            autocomplete="tel"
            :class="{ 'is-error': errors.phone }"
          />
          <span v-if="errors.phone" class="register__error">{{ errors.phone }}</span>
        </label>

        <label class="register__field">
          <span>验证码</span>
          <div class="register__code-row">
            <input
              v-model.trim="form.code"
              type="text"
              maxlength="6"
              placeholder="6 位验证码"
              autocomplete="one-time-code"
              :class="{ 'is-error': errors.code }"
            />
            <button
              type="button"
              class="btn btn--ghost register__code-btn"
              :disabled="countdown > 0"
              @click="sendCode"
            >
              {{ countdown > 0 ? `重新获取（${countdown}s）` : '获取验证码' }}
            </button>
          </div>
          <span v-if="errors.code" class="register__error">{{ errors.code }}</span>
        </label>

        <label class="register__field">
          <span>密码</span>
          <input
            v-model="form.password"
            type="password"
            placeholder="6~20 位密码"
            autocomplete="new-password"
            :class="{ 'is-error': errors.password }"
          />
          <span v-if="errors.password" class="register__error">{{ errors.password }}</span>
        </label>

        <button class="btn register__submit" type="submit" :disabled="loading">
          {{ loading ? '注册中…' : '注 册' }}
        </button>
      </form>

      <p class="register__switch">已有账号？<router-link to="/login">直接登录</router-link></p>
    </div>
  </div>
</template>

<style scoped>
.register {
  min-height: calc(100vh - var(--nav-height));
  display: flex;
  align-items: center;
  justify-content: center;
}

.register__card {
  width: 100%;
  max-width: 380px;
  padding: 32px;
}

.register__title {
  font-size: 22px;
  margin-bottom: 4px;
}

.register__subtitle {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 24px;
}

.register__field {
  display: block;
  margin-bottom: 16px;
}

.register__field > span {
  display: block;
  font-size: 13px;
  margin-bottom: 6px;
  color: var(--color-text-secondary);
}

.register__field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dfe2e8;
  border-radius: 8px;
  outline: none;
}

.register__field input:focus {
  border-color: var(--color-primary);
}

.register__field input.is-error {
  border-color: #d93026;
}

.register__code-row input.is-error {
  border-color: #d93026;
}

.register__code-row {
  display: flex;
  gap: 8px;
}

.register__code-row input {
  flex: 1;
  min-width: 0;
}

.register__code-btn {
  flex-shrink: 0;
  padding: 10px 12px;
  font-size: 13px;
  white-space: nowrap;
}

.register__code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register__error {
  color: #d93026;
  font-size: 12px;
  margin-top: 4px;
}

.register__submit {
  width: 100%;
  margin-top: 8px;
}

.register__switch {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
