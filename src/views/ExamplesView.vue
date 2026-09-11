<script setup>
import { ref, computed } from 'vue'
import examplesData from '@/data/examples.json'
import { highlight } from '@/utils/highlight'
import { copyText } from '@/utils/clipboard'
import CodePracticeModal from '@/components/CodePracticeModal.vue'
import ProblemBank from '@/components/ProblemBank.vue'

const categories = examplesData.categories
const examples = examplesData.examples

// ===== 视图切换：examples 示例代码 / bank 题库练习 =====
const viewMode = ref('examples')

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

// ===== 练习对话框开关 =====
const practiceVisible = ref(false)

function switchCategory(id) {
  activeCategory.value = id
  activeExample.value = activeList.value[0] || null
  copyState.value = 'idle'
  practiceVisible.value = false
}

function selectExample(id) {
  const ex = examples.find((e) => e.id === id)
  if (ex) {
    activeExample.value = ex
    copyState.value = 'idle'
    practiceVisible.value = false
  }
}

// ===== 语法高亮（共用 src/utils/highlight.js） =====
const highlighted = computed(() =>
  activeExample.value
    ? highlight(activeExample.value.code, activeExample.value.category)
    : ''
)

// ===== 一键复制（共用 src/utils/clipboard.js，Clipboard API 优先 + execCommand 降级） =====
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
  const ok = await copyText(code)
  copyState.value = ok ? 'copied' : 'failed'
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => (copyState.value = 'idle'), 1600)
}
</script>

<template>
  <div class="page">
    <h1 class="page__title">示例代码</h1>
    <p class="page__subtitle">C++ / Java / 前端示例 · 语法高亮 · 一键复制 · 补全练习 · 难度题库</p>

    <!-- 视图切换：示例代码 / 题库练习 -->
    <div class="view-tabs" role="tablist">
      <button
        class="view-tab"
        :class="{ 'view-tab--active': viewMode === 'examples' }"
        role="tab"
        :aria-selected="viewMode === 'examples'"
        @click="viewMode = 'examples'"
      >
        示例代码
      </button>
      <button
        class="view-tab"
        :class="{ 'view-tab--active': viewMode === 'bank' }"
        role="tab"
        :aria-selected="viewMode === 'bank'"
        @click="viewMode = 'bank'"
      >
        题库练习
      </button>
    </div>

    <!-- ===== 示例代码视图 ===== -->
    <template v-if="viewMode === 'examples'">
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

        <!-- 代码展示 + 一键复制 + 开始练习 -->
        <section class="card ex-code">
          <div class="ex-code__head">
            <div class="ex-code__info">
              <h2 class="ex-code__title">{{ activeExample?.title }}</h2>
              <p class="ex-code__desc">{{ activeExample?.description }}</p>
            </div>
            <div class="ex-code__actions">
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
              <button
                v-if="activeExample?.practice"
                class="btn btn--ghost ex-code__practice"
                @click="practiceVisible = true"
              >
                开始练习
              </button>
            </div>
          </div>
          <pre class="ex-code__pre"><code class="ex-code__code" v-html="highlighted"></code></pre>
        </section>
      </div>

      <!-- 代码补全练习对话框 -->
      <CodePracticeModal
        :example="activeExample"
        :visible="practiceVisible"
        @update:visible="practiceVisible = $event"
      />
    </template>

    <!-- ===== 题库练习视图 ===== -->
    <ProblemBank v-else />
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

/* ===== 视图切换（下划线式标签页） ===== */
.view-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e5e8ee;
  margin-bottom: 16px;
}

.view-tab {
  padding: 8px 18px;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 15px;
  transition: all 0.2s;
}

.view-tab:hover {
  color: var(--color-primary);
}

.view-tab--active {
  color: var(--color-primary);
  font-weight: 600;
  border-bottom-color: var(--color-primary);
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

.ex-code__actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.ex-code__copy,
.ex-code__practice {
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
</style>
