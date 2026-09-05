<script setup>
import { ref } from 'vue'

// AI 问答页：输入问题获取解答，本地知识检索 + AI 辅助生成（含降级方案）
// 占位结构：问答逻辑待实现
const question = ref('')
const messages = ref([
  { role: 'assistant', content: '你好，我是 WebCreate 学习助手。你可以问我编程问题、课程知识点或竞赛内容。' }
])

function handleSend() {
  const text = question.value.trim()
  if (!text) return
  messages.value.push({ role: 'user', content: text })
  // TODO: 接入本地知识检索 + AI 辅助生成
  messages.value.push({ role: 'assistant', content: '（占位）回答逻辑待接入：本地知识检索 + AI 辅助生成。' })
  question.value = ''
}
</script>

<template>
  <div class="page">
    <h1 class="page__title">AI 问答</h1>
    <p class="page__subtitle">本地知识检索 + AI 辅助生成（含降级方案）</p>

    <section class="page__section card assistant">
      <div class="assistant__messages">
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="assistant__msg"
          :class="`assistant__msg--${m.role}`"
        >
          {{ m.content }}
        </div>
      </div>
      <div class="assistant__input">
        <input
          v-model="question"
          type="text"
          placeholder="输入你的编程问题…"
          @keyup.enter="handleSend"
        />
        <button class="btn" @click="handleSend">发送</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
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

.assistant__messages {
  min-height: 320px;
  max-height: 480px;
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
</style>
