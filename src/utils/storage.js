// localStorage 工具：统一 key 前缀、JSON 序列化与异常处理

const PREFIX = 'webcreate_'

function fullKey(key) {
  return `${PREFIX}${key}`
}

// 读取（不存在或解析失败时返回 fallback）
export function getStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(fullKey(key))
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    // JSON.parse 失败：字符串型字段（如 token）可能被外部以纯文本直接写入，
    // 此时原样返回原始值，避免登录态被静默丢弃；对象/数组字段仍回退默认值
    const raw = localStorage.getItem(fullKey(key))
    return typeof fallback === 'string' ? raw : fallback
  }
}

// 写入（自动 JSON 序列化）
export function setStorage(key, value) {
  try {
    localStorage.setItem(fullKey(key), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

// 删除
export function removeStorage(key) {
  localStorage.removeItem(fullKey(key))
}

// 清空本应用所有前缀 key
export function clearStorage() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}
