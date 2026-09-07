// 表单校验工具（登录 / 注册 / 答题输入等复用）

export function isRequired(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value != null
}

// 账号：3~20 位字母、数字或下划线
export function isValidUsername(value) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value || '')
}

// 密码：6~20 位（至少包含字母或数字）
export function isPasswordValid(value) {
  return /^[a-zA-Z0-9!@#$%^&*._-]{6,20}$/.test(value || '')
}

// 邮箱
export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '')
}

// 中国大陆手机号：1 开头，第二位 3~9，共 11 位
export function isValidPhone(value) {
  return /^1[3-9]\d{9}$/.test(value || '')
}

// 非空（去空格）
export function notEmpty(value) {
  return (value || '').trim().length > 0
}
