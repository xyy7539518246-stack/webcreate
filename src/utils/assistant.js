// AI 问答核心逻辑：本地知识库关键词检索 + DeepSeek API 直连 + 降级
import assistantData from '@/data/assistant.json'

// DeepSeek API key：由 .env 的 VITE_DEEPSEEK_API_KEY 注入，构建时打进前端 bundle
// 浏览器直连 api.deepseek.com（该接口允许跨域），开发与生产环境行为一致
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
export const CAN_USE_API = !!API_KEY

// 归一化：小写、去空白与常见标点
function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[\s，。！？、；：""''（）()？,.!?;:'"【】\[\]]/g, '')
}

/**
 * 本地知识库关键词检索
 * 打分规则：keywords（强词）命中 ≥1 即命中，权重 2；weakKeywords（弱词）需命中 ≥2 才单独命中，权重 1
 * 泛词（vue / 是什么 / 技术 等）一律放 weakKeywords，避免抢答
 * @param {string} question 用户问题
 * @returns {{ hit: boolean, entry?: object, score?: number }}
 */
export function matchLocalKnowledge(question) {
  const text = normalize(question)
  if (!text) return { hit: false, score: 0 }

  let best = null
  for (const entry of assistantData.entries) {
    let strong = 0
    let weak = 0
    for (const kw of entry.keywords) {
      const kwNorm = normalize(kw)
      if (kwNorm && text.includes(kwNorm)) strong += 1
    }
    for (const kw of entry.weakKeywords || []) {
      const kwNorm = normalize(kw)
      if (kwNorm && text.includes(kwNorm)) weak += 1
    }
    // 提问接近条目示例问题时直接加权，提升命中质量
    if (strong > 0 && entry.question && text.includes(normalize(entry.question).slice(0, 6))) {
      strong += 1
    }
    const score = strong * 2 + weak
    const isHit = strong >= 1 || weak >= 2
    if (isHit && (!best || score > best.score)) {
      best = { entry, score }
    }
  }
  return best ? { hit: true, entry: best.entry, score: best.score } : { hit: false, score: 0 }
}

// 知识库全部示例问题（供降级提示推荐使用）
export function getSuggestedQuestions() {
  return assistantData.entries.map((e) => e.question)
}

const SYSTEM_PROMPT =
  '你是 WebCreate（AI 编程学习助手）的内置 AI 助手，面向高校编程初学者与竞赛备赛学生。' +
  '请用简体中文、简洁清晰地回答问题，必要时给出代码示例；涉及本项目（Vue 3 / 题库 / 示例代码 / 部署）的问题请结合项目实际情况回答。'

/**
 * 调用 DeepSeek API（浏览器直连 https://api.deepseek.com）
 * @param {Array<{role: string, content: string}>} history 对话历史（含最新用户消息）
 * @returns {Promise<string>} 模型回答文本
 */
export async function askDeepSeek(history) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      // deepseek-chat：DeepSeek 对话模型，价格最低档
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history.slice(-10)],
      temperature: 0.7,
      max_tokens: 1024,
      stream: false
    })
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`DeepSeek API 请求失败（HTTP ${res.status}）${detail.slice(0, 120)}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('DeepSeek API 返回内容为空')
  return content
}

// 未命中且无法调用 API 时的降级提示
export function buildFallbackAnswer(question) {
  const suggestions = getSuggestedQuestions().slice(0, 3)
  return [
    `这个问题（${question}）暂时不在我的本地知识库里，我还没法给出准确的回答。`,
    CAN_USE_API
      ? '在线 AI 调用失败（请检查网络连接或 API 账户额度），已切换为降级回答。'
      : '当前未配置 DeepSeek API key（.env 中的 VITE_DEEPSEEK_API_KEY），已使用降级回答。',
    '你可以换个问法，或试试这些本地知识库内的问题：',
    ...suggestions.map((q) => `· ${q}`)
  ].join('\n')
}
