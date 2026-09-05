import { defineStore } from 'pinia'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'

// 会话凭证（登录后写入 storage，作为登录凭证）
const TOKEN_KEY = 'token'
const USER_KEY = 'user'
// 本地用户库：手机号 → 账号（浏览器 storage 模拟数据库，课程演示用）
const USERS_KEY = 'users'
// 验证码记录：手机号 → { code, expireAt }（每个手机号对应一个验证码）
const CODES_KEY = 'codes'

// 验证码有效期：60 秒
export const CODE_TTL = 60 * 1000

// 生成 6 位随机数字验证码
function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// 生成模拟会话 token
function genToken() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// 用户状态：本地用户库 + 验证码 + 登录会话（全部持久化到 localStorage）
export const useUserStore = defineStore('user', {
  state: () => ({
    token: getStorage(TOKEN_KEY, ''),
    user: getStorage(USER_KEY, null),
    users: getStorage(USERS_KEY, [])
  }),

  getters: {
    isLoggedIn: (state) => !!state.token
  },

  actions: {
    /* ============ 用户库（storage 作为临时数据源） ============ */

    // 按手机号查用户
    findByPhone(phone) {
      return this.users.find((u) => u.phone === phone) || null
    },

    // 手机号唯一性检查
    hasPhone(phone) {
      return this.users.some((u) => u.phone === phone)
    },

    saveUsers() {
      setStorage(USERS_KEY, this.users)
    },

    /* ============ 验证码（每个手机号对应一个验证码，60s 有效） ============ */

    // 生成并保存验证码，返回明文（供页面以“后端样例”方式提示）
    createCode(phone) {
      const code = genCode()
      const expireAt = Date.now() + CODE_TTL
      const codes = getStorage(CODES_KEY, {})
      codes[phone] = { code, expireAt }
      setStorage(CODES_KEY, codes)
      return { code, expireAt }
    },

    // 取当前手机号的有效验证码（已过期则删除并返回 null）
    getCode(phone) {
      const codes = getStorage(CODES_KEY, {})
      const record = codes[phone]
      if (!record) return null
      if (Date.now() > record.expireAt) {
        this.removeCode(phone)
        return null
      }
      return record
    },

    removeCode(phone) {
      const codes = getStorage(CODES_KEY, {})
      if (codes[phone]) {
        delete codes[phone]
        setStorage(CODES_KEY, codes)
      }
    },

    // 校验验证码：匹配且未过期
    verifyCode(phone, code) {
      const record = this.getCode(phone)
      return !!record && record.code === String(code).trim()
    },

    /* ============ 注册 / 登录 ============ */

    // 注册：手机号唯一性兜底校验，成功后建立登录会话
    register({ phone, password }) {
      if (this.hasPhone(phone)) {
        return { ok: false, message: '该手机号已注册，请直接登录' }
      }
      const user = {
        phone,
        username: phone,
        nickname: `用户${phone.slice(-4)}`,
        password,
        createdAt: Date.now()
      }
      this.users.push(user)
      this.saveUsers()
      this.establishSession(user)
      return { ok: true, user }
    },

    // 登录：已注册账号，校验密码
    loginWithPhone({ phone, password }) {
      const user = this.findByPhone(phone)
      if (!user) {
        return { ok: false, message: '该手机号尚未注册，请先注册' }
      }
      if (user.password !== password) {
        return { ok: false, message: '密码错误，请重试' }
      }
      this.establishSession(user)
      return { ok: true, user }
    },

    // 建立登录凭证：写入 storage 的临时数据 + 会话 token
    establishSession(user) {
      const token = genToken()
      this.token = token
      this.user = user
      setStorage(TOKEN_KEY, token)
      setStorage(USER_KEY, user)
    },

    logout() {
      this.token = ''
      this.user = null
      removeStorage(TOKEN_KEY)
      removeStorage(USER_KEY)
    }
  }
})
