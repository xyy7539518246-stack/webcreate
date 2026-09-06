<script setup>
import { ref, computed } from 'vue'
import examplesData from '@/data/examples.json'

const categories = examplesData.categories
const examples = examplesData.examples

// ===== 分类切换 =====
const activeCategory = ref(categories[0]?.id ?? 'cpp')
const activeList = computed(() =>
  examples.filter((e) => e.category === activeCategory.value)
)

// 各分类示例数量（tab 角标）
const counts = computed(() => {
  const map = {}
  for (const e of examples) map[e.category] = (map[e.category] || 0) + 1
  return map
})

// ===== 当前展示的示例（默认选中该分类第一个） =====
const activeExample = ref(activeList.value[0] || null)

function switchCategory(id) {
  activeCategory.value = id
  activeExample.value = activeList.value[0] || null
  copyState.value = 'idle'
}

function selectExample(id) {
  const ex = examples.find((e) => e.id === id)
  if (ex) {
    activeExample.value = ex
    copyState.value = 'idle'
  }
}

// ===== 轻量语法高亮（零依赖，转义后按 token 着色） =====
const KEYWORDS = {
  cpp: new Set([
    'auto','bool','break','case','catch','char','class','const','continue',
    'default','delete','do','double','else','enum','false','float','for',
    'friend','goto','if','inline','int','long','namespace','new','nullptr',
    'operator','private','protected','public','register','return','short',
    'signed','sizeof','static','struct','switch','template','this','throw',
    'true','try','typedef','typename','union','unsigned','using','virtual',
    'void','volatile','while','std','vector','string','cout','cin','endl',
    'include','define'
  ]),
  java: new Set([
    'abstract','assert','boolean','break','byte','case','catch','char','class',
    'const','continue','default','do','double','else','enum','extends','final',
    'finally','float','for','goto','if','implements','import','instanceof',
    'int','interface','long','native','new','package','private','protected',
    'public','return','short','static','strictfp','super','switch','synchronized',
    'this','throw','throws','transient','try','void','volatile','while','true',
    'false','null','var','public','String','System','Math','Integer','List',
    'Map','Set','ArrayList','HashMap','HashSet','Arrays','Collections',
    'Comparator','Map.Entry'
  ]),
  frontend: new Set([
    'const','let','var','function','return','if','else','for','while','do',
    'switch','case','break','continue','new','delete','typeof','instanceof',
    'in','of','class','extends','super','this','async','await','try','catch',
    'finally','throw','export','import','from','default','null','undefined',
    'true','false','document','window','console','Promise','Set','Map','Array',
    'Object','JSON','localStorage','navigator','fetch','Error','Date',
    'setTimeout','clearTimeout','addEventListener'
  ])
}

// HTML 转义（先转义，后续 token 着色不会破坏结构）
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 依次匹配：注释/预处理 → 字符串/字符 → 数字 → 标识符
const TOKEN_REG =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g

function highlight(code, lang) {
  const kw = KEYWORDS[lang] || new Set()
  return escapeHtml(code).replace(TOKEN_REG, (m, comment, str, num, ident) => {
    if (comment) return `<span class="tok-comment">${m}</span>`
    if (str) return `<span class="tok-string">${m}</span>`
    if (num) return `<span class="tok-number">${m}</span>`
    if (ident) return kw.has(m) ? `<span class="tok-keyword">${m}</span>` : m
    return m
  })
}

const highlighted = computed(() =>
  activeExample.value
    ? highlight(activeExample.value.code, activeExample.value.category)
    : ''
)

// ===== 一键复制（clipboard API 优先，execCommand 降级） =====
const copyState = ref('idle') // idle | copied | failed
let copyTimer = null

const copyLabel = computed(() => {
  if (copyState.value === 'copied') return '已复制'
  if (copyState.value === 'failed') return '复制失败，请重试'
  return '复制代码'
})

async function copyCode() {
  const code = activeExample.value?.code
  if (!code) return
  let ok = false
  // 优先 Clipboard API（需要 https / localhost 安全上下文）
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code)
      ok = true
    }
  } catch {
    ok = false
  }
  // 降级方案：Clipboard API 不可用或写入失败时，用隐藏 textarea + execCommand
  if (!ok) {
    try {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      ta.setSelectionRange(0, code.length) // iOS 兼容
      ok = document.execCommand('copy')
      document.body.removeChild(ta)
    } catch {
      ok = false
    }
  }
  copyState.value = ok ? 'copied' : 'failed'
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => (copyState.value = 'idle'), 1600)
}
</script>

<template>
  <div class="page">
    <h1 class="page__title">示例代码</h1>
    <p class="page__subtitle">C++ / Java / 前端示例 · 语法高亮 · 一键复制</p>

    <!-- 分类切换 -->
    <div class="ex-tabs" role="tablist">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="ex-tab"
        :class="{ 'ex-tab--active': cat.id === activeCategory }"
        role="tab"
        :aria-selected="cat.id === activeCategory"
        @click="switchCategory(cat.id)"
      >
        {{ cat.name }}
        <span class="ex-tab__count">{{ counts[cat.id] || 0 }}</span>
      </button>
    </div>

    <div class="ex-main">
      <!-- 示例列表 -->
      <aside class="card ex-list">
        <h2 class="ex-list__title">示例列表</h2>
        <p class="ex-list__desc">{{ categories.find((c) => c.id === activeCategory)?.desc }}</p>
        <ul class="ex-list__items">
          <li
            v-for="ex in activeList"
            :key="ex.id"
            class="ex-list__item"
            :class="{ 'ex-list__item--active': ex.id === activeExample?.id }"
            @click="selectExample(ex.id)"
          >
            <span class="ex-list__name">{{ ex.title }}</span>
            <span class="ex-list__tags">{{ ex.tags.join(' · ') }}</span>
          </li>
        </ul>
      </aside>

      <!-- 代码展示 + 一键复制 -->
      <section class="card ex-code">
        <div class="ex-code__head">
          <div class="ex-code__info">
            <h2 class="ex-code__title">{{ activeExample?.title }}</h2>
            <p class="ex-code__desc">{{ activeExample?.description }}</p>
          </div>
          <button
            class="btn ex-code__copy"
            :class="{
              'ex-code__copy--ok': copyState === 'copied',
              'ex-code__copy--fail': copyState === 'failed'
            }"
            @click="copyCode"
          >
            {{ copyLabel }}
          </button>
        </div>
        <pre class="ex-code__pre"><code class="ex-code__code" v-html="highlighted"></code></pre>
      </section>
    </div>
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

/* ===== 分类 tab ===== */
.ex-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.ex-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1px solid #dfe2e8;
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 14px;
  transition: all 0.2s;
}

.ex-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.ex-tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.ex-tab__count {
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(31, 35, 41, 0.08);
  font-size: 12px;
  line-height: 18px;
}

.ex-tab--active .ex-tab__count {
  background: rgba(255, 255, 255, 0.22);
}

/* ===== 主体两栏布局 ===== */
.ex-main {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  align-items: start;
}

/* ===== 左侧示例列表 ===== */
.ex-list__title {
  font-size: 16px;
  margin-bottom: 4px;
}

.ex-list__desc {
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-bottom: 12px;
}

.ex-list__items {
  max-height: 520px;
  overflow-y: auto;
}

.ex-list__item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.ex-list__item:hover {
  background: rgba(47, 107, 255, 0.06);
}

.ex-list__item--active {
  background: rgba(47, 107, 255, 0.1);
  border-color: rgba(47, 107, 255, 0.3);
}

.ex-list__name {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
}

.ex-list__item--active .ex-list__name {
  color: var(--color-primary);
}

.ex-list__tags {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* ===== 右侧代码展示区 ===== */
.ex-code {
  padding: 0;
  overflow: hidden;
}

.ex-code__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #eceef2;
}

.ex-code__title {
  font-size: 16px;
  margin-bottom: 2px;
}

.ex-code__desc {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.ex-code__copy {
  flex-shrink: 0;
  padding: 6px 16px;
  font-size: 13px;
}

.ex-code__copy--ok {
  background: #16a34a;
}

.ex-code__copy--fail {
  background: #d93026;
}

/* 代码区（深色编辑器风格） */
.ex-code__pre {
  margin: 0;
  padding: 16px 20px;
  background: #282c34;
  color: #abb2bf;
  overflow: auto;
  max-height: 520px;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
  tab-size: 4;
}

/* 高亮 token 颜色（One Dark 风格） */
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

/* 响应式：窄屏单列堆叠 */
@media (max-width: 900px) {
  .ex-main {
    grid-template-columns: 1fr;
  }

  .ex-list__items {
    max-height: 260px;
  }
}

/* 移动端微调 */
@media (max-width: 768px) {
  .page__title {
    font-size: 20px;
  }

  .ex-tab {
    padding: 8px 14px;
    font-size: 13px;
  }

  .ex-code__head {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .ex-code__copy {
    align-self: flex-start;
  }

  .ex-code__pre {
    padding: 12px 14px;
    font-size: 12px;
    line-height: 1.6;
  }

  .ex-list__items {
    max-height: 220px;
  }
}
</style>
