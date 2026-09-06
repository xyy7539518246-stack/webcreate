<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'
import { matchLocalKnowledge, askDeepSeek, buildFallbackAnswer, CAN_USE_API } from '@/utils/assistant'

// AI 问答页：本地知识检索命中直接答；未命中走 DeepSeek API（仅开发模式）；均不可用时降级提示
// 连续问答记录：对话历史持久化到 localStorage（webcreate_assistant_messages）

const HISTORY_KEY = 'assistant_messages'

const WELCOME = {
  role: 'assistant',
  content: '你好，我是 WebCreate 学习助手。你可以问我编程问题（如“什么是语义化标签”“快速排序怎么写”）、项目相关（如“怎么启动项目”）或竞赛内容。',
  source: 'local'
}

const question = ref('')
const sending = ref(false)
const messages = ref([WELCOME])
const listRef = ref(null)

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
  messages.value = [WELCOME]
  removeStorage(HISTORY_KEY)
  scrollToBottom()
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
    } else if (CAN_USE_API) {
      // ② 未命中 → 开发模式调用 DeepSeek API（经 Vite proxy）
      try {
        const answer = await askDeepSeek(toApiHistory(messages.value))
        messages.value.push({ role: 'assistant', content: answer, source: 'ai' })
      } catch (err) {
        console.error('[assistant] DeepSeek 调用失败：', err)
        // ③ API 失败 → 降级提示
        messages.value.push({ role: 'assistant', content: buildFallbackAnswer(text), source: 'fallback' })
      }
    } else {
      // 生产环境无代理 → 直接降级提示
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
      <button class="btn btn--ghost" :disabled="sending" @click="clearChat">清空对话</button>
    </div>

    <section class="page__section card assistant">
      <div ref="listRef" class="assistant__messages">
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
  </div>
</template>

<style scoped>
.page__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.page__section {
  margin-bottom: 16px;
}

.btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid #dfe2e8;
}

.btn--ghost:hover:not(:disabled) {
  color: var(--color-danger, #e5484d);
  border-color: var(--color-danger, #e5484d);
}

.assistant__messages {
  min-height: 360px;
  max-height: 520px;
  overflow-y: auto;
  padding: 16px;
  background: var(--color-bg);
  border-radius: 8px;
  margin-bottom: 12px;
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
</style>
