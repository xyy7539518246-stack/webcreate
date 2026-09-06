<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'
import {
  matchLocalKnowledge,
  askDeepSeek,
  buildFallbackAnswer,
  hasApiKey,
  setApiKey,
  clearApiKey,
  getFeaturedQuestions
} from '@/utils/assistant'

// AI 问答页：本地知识检索命中直接答；未命中且已配置 Key 时走 DeepSeek API；未配置/调用失败时降级提示
// 连续问答记录：对话历史持久化到 localStorage（webcreate_assistant_messages）
// API Key：用户在页面弹窗中输入，存 localStorage（webcreate_deepseek_api_key），不进代码仓库
// 欢迎页：对话为空时显示问候语 + 推荐问题（点击命中本地库），用户自由输入走正常检索（库外大概率 AI）

const HISTORY_KEY = 'assistant_messages'

const question = ref('')
const sending = ref(false)
const messages = ref([])
const listRef = ref(null)

// 欢迎页精选推荐问题（本地知识库内可命中）
const featuredQuestions = getFeaturedQuestions()

// 根据时间生成问候语
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return '早上好'
  if (h >= 12 && h < 18) return '下午好'
  if (h >= 18 && h < 22) return '晚上好'
  return '夜深了'
})

// API Key 配置状态
const showKeyModal = ref(false)
const keyInput = ref('')
const showKeyText = ref(false)
const apiKeyConfigured = ref(hasApiKey())

const sourceLabels = {
  local: '本地知识库',
  ai: 'DeepSeek AI',
  fallback: '降级提示'
}

// 加载历史对话（首次为空则显示欢迎语）
function loadHistory() {
  const saved = getStorage(HISTORY_KEY, null)
  if (Array.isArray(saved) && saved.length) {
    messages.value = saved
  }
}

function saveHistory() {
  setStorage(HISTORY_KEY, messages.value)
}

function clearChat() {
  messages.value = []
  removeStorage(HISTORY_KEY)
}

// 点击推荐问题：填入输入框并发送（走正常检索流程，推荐问题均为库内可命中）
function sendFeaturedQuestion(q) {
  if (sending.value) return
  question.value = q
  handleSend()
}

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 组装传给模型的对话历史：过滤降级提示消息，保留用户提问与有效回答
function toApiHistory(list) {
  return list
    .filter((m) => m.role === 'user' || m.source !== 'fallback')
    .map((m) => ({ role: m.role, content: m.content }))
}

/* ============ API Key 配置 ============ */

function openKeyModal() {
  keyInput.value = ''
  showKeyText.value = false
  showKeyModal.value = true
}

function saveKey() {
  const ok = setApiKey(keyInput.value)
  apiKeyConfigured.value = ok
  showKeyModal.value = false
}

function removeKey() {
  clearApiKey()
  apiKeyConfigured.value = false
  keyInput.value = ''
}

async function handleSend() {
  const text = question.value.trim()
  if (!text || sending.value) return
  question.value = ''
  messages.value.push({ role: 'user', content: text })
  saveHistory()
  scrollToBottom()

  sending.value = true
  try {
    // ① 本地知识库关键词检索：命中直接答
    const matched = matchLocalKnowledge(text)
    if (matched.hit) {
      await sleep(300) // 轻微延迟，交互更自然
      messages.value.push({ role: 'assistant', content: matched.entry.answer, source: 'local' })
    } else if (apiKeyConfigured.value) {
      // ② 未命中且已配置 Key → 调用 DeepSeek API（浏览器直连）
      try {
        const answer = await askDeepSeek(toApiHistory(messages.value))
        messages.value.push({ role: 'assistant', content: answer, source: 'ai' })
      } catch (err) {
        console.error('[assistant] DeepSeek 调用失败：', err)
        // ③ API 失败 → 降级提示
        messages.value.push({ role: 'assistant', content: buildFallbackAnswer(text), source: 'fallback' })
      }
    } else {
      // 未配置 Key → 直接降级提示（引导用户配置）
      messages.value.push({ role: 'assistant', content: buildFallbackAnswer(text), source: 'fallback' })
    }
  } finally {
    sending.value = false
    saveHistory()
    scrollToBottom()
  }
}

onMounted(() => {
  loadHistory()
  scrollToBottom()
})
</script>

<template>
  <div class="page">
    <div class="page__head">
      <div>
        <h1 class="page__title">AI 问答</h1>
        <p class="page__subtitle">本地知识检索 + AI 辅助生成（含降级方案）</p>
      </div>
      <div class="page__actions">
        <span class="key-status" :class="{ 'key-status--on': apiKeyConfigured }">
          {{ apiKeyConfigured ? 'AI 已就绪' : 'AI 未配置' }}
        </span>
        <button class="btn btn--ghost" @click="openKeyModal">配置 Key</button>
        <button class="btn btn--ghost" :disabled="sending" @click="clearChat">清空对话</button>
      </div>
    </div>

    <!-- 未配置 Key 时的引导提示 -->
    <div v-if="!apiKeyConfigured" class="key-notice">
      <span>未配置 DeepSeek API Key，库外问题将使用降级回答。</span>
      <a class="key-notice__link" @click="openKeyModal">点此配置 Key →</a>
    </div>

    <section class="page__section card assistant">
      <div ref="listRef" class="assistant__messages">
        <!-- 欢迎卡片：对话为空时显示问候语 + 推荐问题（点击命中本地库） -->
        <div v-if="messages.length === 0" class="welcome">
          <div class="welcome__greeting">{{ greeting }}！我是 WebCreate AI 助手</div>
          <p class="welcome__desc">可以帮你解答编程学习中的问题。点击下方问题快速获取答案，或输入关键词/问题向我提问。</p>
          <div class="welcome__questions">
            <button
              v-for="q in featuredQuestions"
              :key="q"
              class="welcome__q-btn"
              :disabled="sending"
              @click="sendFeaturedQuestion(q)"
            >{{ q }}</button>
          </div>
        </div>

        <div
          v-for="(m, i) in messages"
          :key="i"
          class="assistant__msg"
          :class="`assistant__msg--${m.role}`"
        >
          <span v-if="m.source" class="assistant__badge" :class="`assistant__badge--${m.source}`">
            {{ sourceLabels[m.source] }}
          </span>
          <pre v-if="m.role === 'assistant'" class="assistant__content">{{ m.content }}</pre>
          <span v-else class="assistant__content">{{ m.content }}</span>
        </div>

        <div v-if="sending" class="assistant__msg assistant__msg--assistant">
          <span class="assistant__badge assistant__badge--ai">思考中</span>
          <span class="assistant__typing"><i></i><i></i><i></i></span>
        </div>
      </div>

      <div class="assistant__input">
        <input
          v-model="question"
          type="text"
          placeholder="输入你的编程问题…"
          :disabled="sending"
          @keyup.enter="handleSend"
        />
        <button class="btn" :disabled="sending || !question.trim()" @click="handleSend">
          {{ sending ? '回答中…' : '发送' }}
        </button>
      </div>
    </section>

    <!-- API Key 配置弹窗 -->
    <div v-if="showKeyModal" class="key-modal-mask" @click.self="showKeyModal = false">
      <div class="key-modal">
        <h3 class="key-modal__title">配置 DeepSeek API Key</h3>
        <p class="key-modal__hint">
          Key 仅保存在当前浏览器（localStorage），不会上传服务器、不会写入代码仓库。清除浏览器数据后需重新配置。
        </p>
        <div class="key-modal__input-row">
          <input
            v-model="keyInput"
            :type="showKeyText ? 'text' : 'password'"
            placeholder="sk-..."
            class="key-modal__input"
            @keyup.enter="saveKey"
          />
          <button class="btn btn--ghost key-modal__toggle" @click="showKeyText = !showKeyText">
            {{ showKeyText ? '隐藏' : '显示' }}
          </button>
        </div>
        <div class="key-modal__status">
          当前状态：<strong :class="apiKeyConfigured ? 'key-status--on' : ''">
            {{ apiKeyConfigured ? '已配置' : '未配置' }}
          </strong>
        </div>
        <div class="key-modal__actions">
          <button class="btn" :disabled="!keyInput.trim()" @click="saveKey">保存</button>
          <button class="btn btn--ghost" :disabled="!apiKeyConfigured" @click="removeKey">清除已存 Key</button>
          <button class="btn btn--ghost" @click="showKeyModal = false">关闭</button>
        </div>
        <p class="key-modal__tip">
          获取 Key：前往 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener">DeepSeek 开放平台</a> → API Keys → 创建。
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.page__title {
  font-size: 24px;
  margin-bottom: 4px;
}

.page__subtitle {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 20px;
}

.page__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page__section {
  margin-bottom: 16px;
}

.btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid #dfe2e8;
}

.btn--ghost:hover:not(:disabled) {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* API Key 状态标签 */
.key-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f2f3f5;
  color: #8a919f;
}

.key-status--on {
  background: #e6f7ee;
  color: #18a058;
}

/* 未配置 Key 引导条 */
.key-notice {
  background: #fff8e6;
  border: 1px solid #ffe0a3;
  color: #8a6d1f;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.key-notice__link {
  color: var(--color-primary);
  cursor: pointer;
  font-weight: 500;
}

.key-notice__link:hover {
  text-decoration: underline;
}

/* 对话区 */
.assistant__messages {
  min-height: 360px;
  max-height: 520px;
  overflow-y: auto;
  padding: 16px;
  background: var(--color-bg);
  border-radius: 8px;
  margin-bottom: 12px;
}

/* 欢迎卡片（对话为空时显示） */
.welcome {
  text-align: center;
  padding: 48px 20px 32px;
}

.welcome__greeting {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--color-text);
}

.welcome__desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 28px;
  line-height: 1.7;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.welcome__questions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 640px;
  margin: 0 auto;
}

.welcome__q-btn {
  padding: 9px 18px;
  border: 1px solid #dfe2e8;
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.welcome__q-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: #f5f7ff;
  transform: translateY(-1px);
}

.welcome__q-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.assistant__msg {
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 10px;
  font-size: 14px;
  max-width: 80%;
  line-height: 1.6;
}

.assistant__msg--assistant {
  background: var(--color-surface);
  box-shadow: var(--shadow);
}

.assistant__msg--user {
  background: var(--color-primary);
  color: #fff;
  margin-left: auto;
}

.assistant__content {
  margin: 4px 0 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.assistant__badge {
  display: inline-block;
  font-size: 11px;
  line-height: 1;
  padding: 3px 8px;
  border-radius: 999px;
  margin-right: 6px;
  vertical-align: 2px;
}

.assistant__badge--local {
  background: #e6f7ee;
  color: #18a058;
}

.assistant__badge--ai {
  background: #f0ebfe;
  color: #722ed1;
}

.assistant__badge--fallback {
  background: #f2f3f5;
  color: #8a919f;
}

.assistant__typing {
  display: inline-flex;
  gap: 4px;
  padding: 4px 2px;
}

.assistant__typing i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-secondary);
  animation: typing-bounce 1.2s infinite ease-in-out;
}

.assistant__typing i:nth-child(2) {
  animation-delay: 0.15s;
}

.assistant__typing i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.assistant__input {
  display: flex;
  gap: 10px;
}

.assistant__input input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #dfe2e8;
  border-radius: 8px;
  outline: none;
}

.assistant__input input:focus {
  border-color: var(--color-primary);
}

.assistant__input input:disabled {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

/* API Key 配置弹窗 */
.key-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.key-modal {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.key-modal__title {
  font-size: 18px;
  margin-bottom: 8px;
  color: var(--color-text);
}

.key-modal__hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.key-modal__input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.key-modal__input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #dfe2e8;
  border-radius: 8px;
  outline: none;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.key-modal__input:focus {
  border-color: var(--color-primary);
}

.key-modal__toggle {
  white-space: nowrap;
}

.key-modal__status {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}

.key-modal__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.key-modal__tip {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.key-modal__tip a {
  color: var(--color-primary);
}
</style>
