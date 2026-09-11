<script setup>
import { ref, computed } from 'vue'
import problemsData from '@/data/problems.json'
import { highlight } from '@/utils/highlight'
import { copyText } from '@/utils/clipboard'
import CodePracticeModal from '@/components/CodePracticeModal.vue'

const difficulties = problemsData.difficulties
const problems = problemsData.problems

const LANG_NAMES = { cpp: 'C++', java: 'Java', frontend: '前端' }
const DIFF_COLORS = { basic: '#16a34a', intermediate: '#d97706', advanced: '#d93026' }

// ===== 难度筛选 =====
const activeDifficulty = ref(difficulties[0]?.id ?? 'basic')
const counts = computed(() => {
  const map = {}
  for (const p of problems) map[p.difficulty] = (map[p.difficulty] || 0) + 1
  return map
})
const diffList = computed(() =>
  problems.filter((p) => p.difficulty === activeDifficulty.value)
)

// ===== 当前题目（默认选中该难度第一题） =====
const activeProblem = ref(diffList.value[0] || null)
const showHint = ref(false)
const showSolution = ref(false)

// ===== 补全练习对话框 =====
const practiceVisible = ref(false)
// 题库题目字段是 language，练习组件兼容 category || language
const practiceExample = computed(() => {
  const p = activeProblem.value
  return p ? { ...p, category: p.language } : null
})

function switchDifficulty(id) {
  activeDifficulty.value = id
  activeProblem.value = diffList.value[0] || null
  resetDetail()
}

function selectProblem(id) {
  const p = problems.find((x) => x.id === id)
  if (p) {
    activeProblem.value = p
    resetDetail()
  }
}

function resetDetail() {
  showHint.value = false
  showSolution.value = false
  copyState.value = 'idle'
  practiceVisible.value = false
}

// ===== 参考代码（高亮 + 复制） =====
const solutionHtml = computed(() =>
  activeProblem.value
    ? highlight(activeProblem.value.solution, activeProblem.value.language)
    : ''
)

const copyState = ref('idle') // idle | copied | failed
let copyTimer = null

const copyLabel = computed(() => {
  if (copyState.value === 'copied') return '已复制'
  if (copyState.value === 'failed') return '复制失败'
  return '复制代码'
})

async function copySolution() {
  const code = activeProblem.value?.solution
  if (!code) return
  const ok = await copyText(code)
  copyState.value = ok ? 'copied' : 'failed'
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => (copyState.value = 'idle'), 1600)
}
</script>

<template>
  <div>
    <!-- 难度筛选 -->
    <div class="bank-tabs" role="tablist">
      <button
        v-for="d in difficulties"
        :key="d.id"
        class="bank-tab"
        :class="{ 'bank-tab--active': d.id === activeDifficulty }"
        role="tab"
        :aria-selected="d.id === activeDifficulty"
        @click="switchDifficulty(d.id)"
      >
        <span class="bank-tab__dot" :style="{ background: DIFF_COLORS[d.id] }"></span>
        {{ d.name }}
        <span class="bank-tab__count">{{ counts[d.id] || 0 }}</span>
      </button>
    </div>

    <div class="bank-main">
      <!-- 题目列表 -->
      <aside class="card bank-list">
        <h2 class="bank-list__title">题目列表</h2>
        <p class="bank-list__desc">
          {{ difficulties.find((d) => d.id === activeDifficulty)?.desc }}
        </p>
        <ul class="bank-list__items">
          <li
            v-for="p in diffList"
            :key="p.id"
            class="bank-list__item"
            :class="{ 'bank-list__item--active': p.id === activeProblem?.id }"
            @click="selectProblem(p.id)"
          >
            <span class="bank-list__name">{{ p.title }}</span>
            <span class="bank-list__lang">{{ LANG_NAMES[p.language] || p.language }}</span>
          </li>
        </ul>
      </aside>

      <!-- 题目详情 -->
      <section class="card bank-detail">
        <div class="bank-detail__head">
          <h2 class="bank-detail__title">{{ activeProblem?.title }}</h2>
          <div class="bank-detail__tags">
            <span class="bank-tag" :style="{ color: DIFF_COLORS[activeProblem?.difficulty] }">
              {{ difficulties.find((d) => d.id === activeProblem?.difficulty)?.name }}
            </span>
            <span class="bank-tag bank-tag--lang">
              {{ LANG_NAMES[activeProblem?.language] || activeProblem?.language }}
            </span>
          </div>
        </div>

        <!-- 题目描述 -->
        <div class="bank-block">
          <h3 class="bank-block__title">题目描述</h3>
          <p class="bank-block__text">{{ activeProblem?.description }}</p>
          <button
            v-if="activeProblem?.practice"
            class="btn bank-practice"
            @click="practiceVisible = true"
          >
            开始练习
          </button>
        </div>

        <div class="bank-block">
          <h3 class="bank-block__title">输入 / 输出示例</h3>
          <pre class="bank-example">{{ activeProblem?.example }}</pre>
        </div>

        <!-- 提示（可展开） -->
        <div class="bank-block">
          <button class="btn btn--ghost bank-toggle" @click="showHint = !showHint">
            {{ showHint ? '收起提示' : '查看提示' }}
          </button>
          <p v-if="showHint" class="bank-hint">{{ activeProblem?.hint }}</p>
        </div>

        <!-- 参考代码（可展开 + 复制） -->
        <div class="bank-block">
          <div class="bank-solution__head">
            <button class="btn btn--ghost bank-toggle" @click="showSolution = !showSolution">
              {{ showSolution ? '收起参考代码' : '查看参考代码' }}
            </button>
            <button
              v-if="showSolution"
              class="btn bank-solution__copy"
              :class="{
                'ex-code__copy--ok': copyState === 'copied',
                'ex-code__copy--fail': copyState === 'failed'
              }"
              @click="copySolution"
            >
              {{ copyLabel }}
            </button>
          </div>
          <pre v-if="showSolution" class="bank-solution"><code v-html="solutionHtml"></code></pre>
        </div>
      </section>
    </div>

    <!-- 补全练习对话框（题库题目） -->
    <CodePracticeModal
      :example="practiceExample"
      :visible="practiceVisible"
      @update:visible="practiceVisible = $event"
    />
  </div>
</template>

<style scoped>
/* ===== 难度 tab ===== */
.bank-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.bank-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  border: 1px solid #dfe2e8;
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 14px;
  transition: all 0.2s;
}

.bank-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.bank-tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.bank-tab__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.bank-tab__count {
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(31, 35, 41, 0.08);
  font-size: 12px;
  line-height: 18px;
}

.bank-tab--active .bank-tab__count {
  background: rgba(255, 255, 255, 0.22);
}

/* ===== 两栏布局 ===== */
.bank-main {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  align-items: start;
}

/* ===== 题目列表 ===== */
.bank-list__title {
  font-size: 16px;
  margin-bottom: 4px;
}

.bank-list__desc {
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-bottom: 12px;
}

.bank-list__items {
  max-height: 520px;
  overflow-y: auto;
}

.bank-list__item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.bank-list__item:hover {
  background: rgba(47, 107, 255, 0.06);
}

.bank-list__item--active {
  background: rgba(47, 107, 255, 0.1);
  border-color: rgba(47, 107, 255, 0.3);
}

.bank-list__name {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
}

.bank-list__item--active .bank-list__name {
  color: var(--color-primary);
}

.bank-list__lang {
  flex-shrink: 0;
  font-size: 12px;
  padding: 0 8px;
  border-radius: 999px;
  background: #eef1f6;
  color: var(--color-text-secondary);
}

/* ===== 题目详情 ===== */
.bank-detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #eceef2;
  margin-bottom: 16px;
}

.bank-detail__title {
  font-size: 18px;
}

.bank-detail__tags {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.bank-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
}

.bank-tag--lang {
  color: var(--color-text-secondary);
}

.bank-block {
  margin-bottom: 16px;
}

.bank-block__title {
  font-size: 14px;
  margin-bottom: 6px;
  color: var(--color-text);
}

.bank-block__text {
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.8;
}

.bank-practice {
  margin-top: 12px;
  padding: 6px 16px;
  font-size: 13px;
}

.bank-example {
  background: var(--color-bg);
  border: 1px solid #eceef2;
  border-radius: 8px;
  padding: 10px 14px;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
}

.bank-toggle {
  padding: 6px 16px;
  font-size: 13px;
}

.bank-hint {
  margin-top: 10px;
  padding: 10px 14px;
  background: rgba(217, 119, 6, 0.08);
  border: 1px solid rgba(217, 119, 6, 0.25);
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
  line-height: 1.7;
}

.bank-solution__head {
  display: flex;
  gap: 10px;
  align-items: center;
}

.bank-solution__copy {
  padding: 6px 16px;
  font-size: 13px;
}

.bank-solution {
  margin-top: 10px;
  margin-bottom: 0;
  padding: 14px 16px;
  background: #282c34;
  color: #abb2bf;
  overflow: auto;
  max-height: 480px;
  border-radius: 8px;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
  tab-size: 4;
}

/* 高亮 token 颜色 */
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

/* 响应式 */
@media (max-width: 900px) {
  .bank-main {
    grid-template-columns: 1fr;
  }

  .bank-list__items {
    max-height: 260px;
  }
}
</style>
