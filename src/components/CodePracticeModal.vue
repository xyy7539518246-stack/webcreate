<script setup>
import { ref, computed, watch } from 'vue'
import { highlight } from '@/utils/highlight'

const props = defineProps({
  // 当前示例（含 practice 字段）
  example: { type: Object, default: null },
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible'])

const practice = computed(() => props.example?.practice || null)
const blanks = computed(() => practice.value?.blanks || [])

// ===== 练习状态 =====
const blankValues = ref({}) // { blankId: 用户输入 }
const results = ref({}) // { blankId: 'correct' | 'wrong' }
const checked = ref(false) // 是否已提交过

// 每次打开对话框时重置
watch(
  () => props.visible,
  (v) => {
    if (v) reset()
  }
)

// ===== 解析模板：按行拆分为「文本段（高亮）」+「挖空输入框」 =====
const BLANK_RE = /__(\d+)__/g

const templateLines = computed(() => {
  if (!practice.value) return []
  // 示例对象用 category，题库题目用 language，这里统一兼容
  const lang = props.example.category || props.example.language || ''
  return practice.value.template.split('\n').map((line) => {
    const segments = []
    let last = 0
    let m
    BLANK_RE.lastIndex = 0
    while ((m = BLANK_RE.exec(line))) {
      if (m.index > last) {
        segments.push({
          type: 'text',
          html: highlight(line.slice(last, m.index), lang)
        })
      }
      segments.push({ type: 'blank', id: m[1] })
      last = m.index + m[0].length
    }
    if (last < line.length) {
      segments.push({
        type: 'text',
        html: highlight(line.slice(last), lang)
      })
    }
    return segments
  })
})

const hintOf = (id) => blanks.value.find((b) => b.id === id)?.hint || ''

function blankClass(id) {
  if (!checked.value) return ''
  return results.value[id] === 'correct' ? 'prac-blank--ok' : 'prac-blank--bad'
}

// ===== 判题：忽略所有空白后比对，支持一个空多个可接受答案 =====
const norm = (s) => String(s || '').replace(/\s+/g, '')

const correctCount = computed(
  () => Object.values(results.value).filter((r) => r === 'correct').length
)
const totalCount = computed(() => blanks.value.length)
const wrongCount = computed(
  () => Object.values(results.value).filter((r) => r === 'wrong').length
)
const allCorrect = computed(
  () => checked.value && totalCount.value > 0 && correctCount.value === totalCount.value
)

function check() {
  if (!practice.value) return
  const next = {}
  for (const b of blanks.value) {
    const val = blankValues.value[b.id]
    next[b.id] = b.answers.some((a) => norm(a) === norm(val))
      ? 'correct'
      : 'wrong'
  }
  results.value = next
  checked.value = true
}

// 查看答案：填入参考答案并全部标为正确
function revealAnswers() {
  if (!practice.value) return
  const next = {}
  for (const b of blanks.value) {
    blankValues.value[b.id] = b.answers[0]
    next[b.id] = 'correct'
  }
  results.value = next
  checked.value = true
}

function reset() {
  blankValues.value = {}
  results.value = {}
  checked.value = false
}

function close() {
  emit('update:visible', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && practice" class="prac-overlay" @click.self="close">
      <div class="prac-modal" role="dialog" aria-modal="true">
        <div class="prac-modal__head">
          <h2 class="prac-modal__title">练习：{{ example.title }}</h2>
          <button class="prac-modal__close" @click="close">关闭</button>
        </div>

        <p class="prac-modal__prompt">{{ practice.prompt }}</p>

        <!-- 挖空代码（逐行块级渲染，避免 pre 内模板缩进产生多余空白） -->
        <div class="prac-modal__code">
          <div v-for="(segs, li) in templateLines" :key="li" class="prac-code-line"><template v-for="(seg, si) in segs" :key="si"><span v-if="seg.type === 'text'" v-html="seg.html"></span><input v-else class="prac-blank" :class="blankClass(seg.id)" v-model="blankValues[seg.id]" :placeholder="hintOf(seg.id)" :title="hintOf(seg.id)" spellcheck="false" /></template></div>
        </div>

        <!-- 判题结果 -->
        <p v-if="checked && allCorrect" class="prac-result prac-result--ok">
          全部正确，练习完成！
        </p>
        <p v-else-if="checked && wrongCount > 0" class="prac-result prac-result--bad">
          有 {{ wrongCount }} 处与参考答案不一致，可点击「查看答案」对照。
        </p>
        <p v-else-if="checked" class="prac-result prac-result--bad">
          还有 {{ totalCount - correctCount }} 处未填写或未通过，继续加油。
        </p>

        <div class="prac-modal__actions">
          <button class="btn" @click="check">提交答案</button>
          <button class="btn btn--ghost" @click="revealAnswers">查看答案</button>
          <button class="btn btn--ghost" @click="reset">重新练习</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.prac-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 18, 24, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.prac-modal {
  width: min(780px, 94vw);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.prac-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eceef2;
}

.prac-modal__title {
  font-size: 17px;
}

.prac-modal__close {
  padding: 4px 14px;
  border: 1px solid #dfe2e8;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.prac-modal__close:hover {
  border-color: #d93026;
  color: #d93026;
}

.prac-modal__prompt {
  padding: 12px 20px 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

/* 挖空代码区（深色编辑器风格） */
.prac-modal__code {
  flex: 1;
  margin: 12px 20px;
  padding: 14px 16px;
  background: #282c34;
  color: #abb2bf;
  overflow: auto;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 4;
  border-radius: 8px;
}

/* 每个代码行：块级渲染，保留行内缩进 */
.prac-code-line {
  white-space: pre;
  min-height: 1.6em;
}

.prac-blank {
  display: inline-block;
  width: 150px;
  padding: 1px 6px;
  margin: 0 2px;
  background: #3b4048;
  border: 1px solid #5c6370;
  border-radius: 4px;
  color: #e5c07b;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  vertical-align: middle;
  transition: border-color 0.2s;
}

.prac-blank:focus {
  border-color: var(--color-primary);
}

.prac-blank--ok {
  border-color: #98c379;
  color: #98c379;
}

.prac-blank--bad {
  border-color: #e06c75;
  color: #e06c75;
}

/* 高亮 token 颜色（与示例展示页一致） */
:deep(.tok-keyword) {
  color: #c678dd;
}

:deep(.tok-string) {
  color: #98c379;
}

:deep(.tok-number) {
  color: #d19a66;
}

:deep(.tok-comment) {
  color: #7f848e;
  font-style: italic;
}

/* 判题结果 */
.prac-result {
  padding: 0 20px;
  font-size: 13px;
  font-weight: 500;
}

.prac-result--ok {
  color: #16a34a;
}

.prac-result--bad {
  color: #d93026;
}

.prac-modal__actions {
  display: flex;
  gap: 10px;
  padding: 14px 20px 18px;
  border-top: 1px solid #eceef2;
}
</style>
