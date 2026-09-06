<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { isValidPhone, isPasswordValid } from '@/utils/validate'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  phone: '',
  code: '',
  password: ''
})

const errors = ref({})
const loading = ref(false)

// 验证码 60 秒倒计时（与注册页共用机制）
const COUNT_DOWN = 60
const countdown = ref(0)
const sentCode = ref('') // 页面内显示当前验证码（替代 alert，避免阻塞导致计时不同步）
let timer = null

function startCountdown() {
  countdown.value = COUNT_DOWN
  clearInterval(timer)
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
      sentCode.value = ''
    }
  }, 1000)
}

onUnmounted(() => clearInterval(timer))

// 获取验证码：先判断手机号是否已注册，已注册才发送
function sendCode() {
  errors.value = {}
  if (!isValidPhone(form.phone)) {
    errors.value.phone = '请输入正确的 11 位手机号'
    return
  }
  if (!userStore.hasPhone(form.phone)) {
    errors.value.phone = '该手机号尚未注册，无法找回密码'
    return
  }
  const { code } = userStore.createCode(form.phone)
  // 页面内显示验证码：替代 alert，避免阻塞导致倒计时与实际有效期不同步
  sentCode.value = code
  startCountdown()
}

function validate() {
  const errs = {}
  if (!isValidPhone(form.phone)) errs.phone = '请输入正确的 11 位手机号'
  if (!form.code) errs.code = '请输入验证码'
  if (!isPasswordValid(form.password)) errs.password = '新密码长度为 6~20 位'
  errors.value = errs
  return Object.keys(errs).length === 0
}

function handleSubmit() {
  if (!validate()) return

  // 已注册判断（兜底）
  if (!userStore.hasPhone(form.phone)) {
    errors.value.phone = '该手机号尚未注册，无法找回密码'
    return
  }

  // 验证码失效（60 秒超时）即修改失败
  const record = userStore.getCode(form.phone)
  if (!record) {
    errors.value.code = '验证码已失效（超过 60 秒），请重新获取'
    return
  }
  if (record.code !== form.code.trim()) {
    errors.value.code = '验证码错误，请重试'
    return
  }

  loading.value = true
  const res = userStore.resetPassword({ phone: form.phone, newPassword: form.password })
  loading.value = false

  if (!res.ok) {
    errors.value.phone = res.message
    return
  }

  userStore.removeCode(form.phone)
  alert('密码修改成功，请使用新密码登录')
  router.push('/login')
}
</script>

<template>
  <div class="forgot">
    <div class="forgot__card card">
      <h1 class="forgot__title">忘记密码</h1>
      <p class="forgot__subtitle">输入已注册手机号，通过验证码重置密码</p>

      <form class="forgot__form" @submit.prevent="handleSubmit">
        <label class="forgot__field">
          <span>手机号</span>
          <input
            v-model.trim="form.phone"
            type="tel"
            maxlength="11"
            placeholder="请输入已注册的 11 位手机号"
            autocomplete="tel"
            :class="{ 'is-error': errors.phone }"
          />
          <span v-if="errors.phone" class="forgot__error">{{ errors.phone }}</span>
        </label>

        <label class="forgot__field">
          <span>验证码</span>
          <div class="forgot__code-row">
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
              class="btn btn--ghost forgot__code-btn"
              :disabled="countdown > 0"
              @click="sendCode"
            >
              {{ countdown > 0 ? `重新获取（${countdown}s）` : '获取验证码' }}
            </button>
          </div>
          <span v-if="errors.code" class="forgot__error">{{ errors.code }}</span>
          <div v-if="sentCode && countdown > 0" class="forgot__code-hint">
            验证码：<strong>{{ sentCode }}</strong>（{{ countdown }}s 内有效，后端样例）
          </div>
        </label>

        <label class="forgot__field">
          <span>新密码</span>
          <input
            v-model="form.password"
            type="password"
            placeholder="6~20 位新密码"
            autocomplete="new-password"
            :class="{ 'is-error': errors.password }"
          />
          <span v-if="errors.password" class="forgot__error">{{ errors.password }}</span>
        </label>

        <button class="btn forgot__submit" type="submit" :disabled="loading">
          {{ loading ? '提交中…' : '重置密码' }}
        </button>
      </form>

      <p class="forgot__switch">
        想起来了？<router-link to="/login">返回登录</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.forgot {
  min-height: calc(100vh - var(--nav-height));
  display: flex;
  align-items: center;
  justify-content: center;
}

.forgot__card {
  width: 100%;
  max-width: 380px;
  padding: 32px;
}

.forgot__title {
  font-size: 22px;
  margin-bottom: 4px;
}

.forgot__subtitle {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 24px;
}

.forgot__field {
  display: block;
  margin-bottom: 16px;
}

.forgot__field > span {
  display: block;
  font-size: 13px;
  margin-bottom: 6px;
  color: var(--color-text-secondary);
}

.forgot__field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dfe2e8;
  border-radius: 8px;
  outline: none;
}

.forgot__field input:focus {
  border-color: var(--color-primary);
}

.forgot__field input.is-error {
  border-color: #d93026;
}

.forgot__code-row {
  display: flex;
  gap: 8px;
}

.forgot__code-row input {
  flex: 1;
  min-width: 0;
}

.forgot__code-btn {
  flex-shrink: 0;
  padding: 10px 12px;
  font-size: 13px;
  white-space: nowrap;
}

.forgot__code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.forgot__error {
  color: #d93026;
  font-size: 12px;
  margin-top: 4px;
}

.forgot__code-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.forgot__code-hint strong {
  color: var(--color-primary);
  font-size: 15px;
  letter-spacing: 3px;
  font-family: 'Courier New', monospace;
}

.forgot__submit {
  width: 100%;
  margin-top: 8px;
}

.forgot__switch {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
