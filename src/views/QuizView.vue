<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import quizData from '@/data/quiz.json'
import { getStorage, setStorage } from '@/utils/storage'

// ===== 数据源：按知识点分组，每组 20 题备选 =====
const groups = quizData.groups
const ROUND_SIZE = 5 // 每轮随机抽取题数
const route = useRoute()

// ===== 视图切换：practice 练习 / wrong 错题本 =====
const view = ref('practice')

// ===== 选题组：默认第一个 =====
const activeGroupId = ref(groups[0]?.id ?? '')
const activeGroup = computed(() =>
  groups.find((g) => g.id === activeGroupId.value)
)

// ===== 本地存储：掌握状态 & 错题本 & 收藏（localStorage） =====
const MASTERED_KEY = 'quiz_mastered' // { qid: ts } 做对过的题（不再被抽）
const WRONG_KEY = 'quiz_wrong' // { qid: { selected, ts } } 错题本
const FAV_KEY = 'quiz_favorites' // { qid: ts } 收藏的题目

const mastered = ref(getStorage(MASTERED_KEY, {}))
const wrongBook = ref(getStorage(WRONG_KEY, {}))
const favorites = ref(getStorage(FAV_KEY, {}))

function persistMastered() {
  setStorage(MASTERED_KEY, mastered.value)
}
function persistWrong() {
  setStorage(WRONG_KEY, wrongBook.value)
}
function persistFavorites() {
  setStorage(FAV_KEY, favorites.value)
}

const LETTERS = ['A', 'B', 'C', 'D']

// ===== 抽题池：本组未掌握的题 =====
const pool = computed(
  () => activeGroup.value?.questions.filter((q) => !mastered.value[q.id]) ?? []
)

// ===== 本轮题目与作答（内存态，刷新后重新抽取） =====
const roundQuestions = ref([])
const roundAnswers = ref({}) // { qid: { selected, correct } }

// ===== 完成弹窗 =====
const showComplete = ref(false)

// 随机抽取一轮：从抽题池取 5 道；池空则弹完成提示
function drawRound() {
  const p = pool.value
  if (!p.length) {
    roundQuestions.value = []
    roundAnswers.value = {}
    showComplete.value = true
    return
  }
  const shuffled = [...p].sort(() => Math.random() - 0.5)
  roundQuestions.value = shuffled.slice(0, ROUND_SIZE)
  roundAnswers.value = {}
}

// 切换知识点并抽题
function switchGroup(gid) {
  activeGroupId.value = gid
  drawRound()
}

// ===== 作答：即时判题 =====
function selectOption(q, idx) {
  if (roundAnswers.value[q.id]) return // 本轮已作答
  const letter = LETTERS[idx]
  const correct = letter === q.answer
  roundAnswers.value = {
    ...roundAnswers.value,
    [q.id]: { selected: letter, correct }
  }

  if (correct) {
    // 做对 → 标记掌握，不再被抽；同时移出错题本
    mastered.value = { ...mastered.value, [q.id]: Date.now() }
    persistMastered()
    if (wrongBook.value[q.id]) {
      const next = { ...wrongBook.value }
      delete next[q.id]
      wrongBook.value = next
      persistWrong()
    }
    // 全部掌握 → 弹完成提示
    if (pool.value.length === 0) {
      showComplete.value = true
    }
  } else {
    // 做错 → 进错题本（题目仍在抽题池，之后可能再被抽到）
    wrongBook.value = {
      ...wrongBook.value,
      [q.id]: { selected: letter, ts: Date.now() }
    }
    persistWrong()
  }
}

// 本轮重做（仅答错题）：清除本轮作答，可再次选择
function redoQuestion(q) {
  const next = { ...roundAnswers.value }
  delete next[q.id]
  roundAnswers.value = next
}

// ===== 收藏：收藏/取消收藏题目（个人中心可访问） =====
function toggleFav(q) {
  if (favorites.value[q.id]) {
    const next = { ...favorites.value }
    delete next[q.id]
    favorites.value = next
  } else {
    favorites.value = { ...favorites.value, [q.id]: Date.now() }
  }
  persistFavorites()
}

// ===== 统计（当前组） =====
const groupTotal = computed(() => activeGroup.value?.questions.length ?? 0)
const masteredCount = computed(
  () => activeGroup.value?.questions.filter((q) => mastered.value[q.id]).length ?? 0
)
const roundCorrect = computed(
  () => Object.values(roundAnswers.value).filter((r) => r.correct).length
)
const roundWrong = computed(
  () => Object.values(roundAnswers.value).filter((r) => !r.correct).length
)

// 组进度（tab 显示用）
function masteredOf(group) {
  return group.questions.filter((q) => mastered.value[q.id]).length
}

// ===== 错题本 =====
const wrongList = computed(() => {
  const list = []
  for (const g of groups) {
    for (const q of g.questions) {
      const rec = wrongBook.value[q.id]
      if (rec) list.push({ group: g, question: q, record: rec })
    }
  }
  return list
})

// 错题重新作答：切到对应组，并确保该题出现在本轮
function redoWrong(item) {
  switchGroup(item.group.id)
  if (!roundQuestions.value.some((x) => x.id === item.question.id)) {
    roundQuestions.value = [item.question, ...roundQuestions.value]
  }
  const next = { ...roundAnswers.value }
  delete next[item.question.id]
  roundAnswers.value = next
  view.value = 'practice'
}

// 确认重新进入题库：从错题本移除（该题未掌握，仍在抽题池，后续随机抽取可能再次出现）
function reenterPool(item) {
  removeWrong(item.question.id)
  window.alert(`「${item.question.question.slice(0, 20)}…」已重新进入待抽题库，之后随机抽取可能再次出现，直到做对为止。`)
}

// 从错题本移除
function removeWrong(qid) {
  const next = { ...wrongBook.value }
  delete next[qid]
  wrongBook.value = next
  persistWrong()
}

// 清空错题本
function clearWrong() {
  if (!wrongList.value.length) return
  if (window.confirm(`确定清空错题本（${wrongList.value.length} 题）吗？`)) {
    wrongBook.value = {}
    persistWrong()
  }
}

// ===== 目标达成：重置该组，循环往复 =====
function resetGroup() {
  const prefix = activeGroupId.value + '-'
  const nm = { ...mastered.value }
  Object.keys(nm).forEach((k) => {
    if (k.startsWith(prefix)) delete nm[k]
  })
  mastered.value = nm
  persistMastered()

  const nw = { ...wrongBook.value }
  Object.keys(nw).forEach((k) => {
    if (k.startsWith(prefix)) delete nw[k]
  })
  wrongBook.value = nw
  persistWrong()

  showComplete.value = false
  drawRound()
}

// ===== 选项样式 =====
function optionClass(q, oi) {
  const rec = roundAnswers.value[q.id]
  if (!rec) return ''
  const letter = LETTERS[oi]
  if (letter === q.answer) return 'option--correct'
  if (letter === rec.selected) return 'option--wrong'
  return ''
}

// ===== 外部刷题平台（目标达成后进阶） =====
const practiceLinks = [
  { name: '力扣 LeetCode', url: 'https://leetcode.cn', desc: '算法与数据结构刷题' },
  { name: '洛谷 Luogu', url: 'https://www.luogu.com.cn', desc: 'C++ / OI 竞赛题库' },
  { name: '牛客 Nowcoder', url: 'https://www.nowcoder.com', desc: '笔试面试 + 编程竞赛' }
]

// 支持从个人中心等入口以 ?group=xxx 跳转到指定知识点
onMounted(() => {
  const gid = route.query.group
  if (gid && groups.some((g) => g.id === gid)) {
    activeGroupId.value = String(gid)
  }
  drawRound()
})
</script>

<template>
  <div class="page">
    <h1 class="page__title">题库练习</h1>
    <p class="page__subtitle">每组 20 题备选 · 每次随机抽 5 题 · 答对掌握 · 答错进错题本</p>

    <!-- 视图切换 -->
    <div class="view-tabs">
      <button
        class="view-tab"
        :class="{ 'view-tab--active': view === 'practice' }"
        @click="view = 'practice'"
      >
        练习
      </button>
      <button
        class="view-tab"
        :class="{ 'view-tab--active': view === 'wrong' }"
        @click="view = 'wrong'"
      >
        错题本（{{ wrongList.length }}）
      </button>
    </div>

    <!-- ===== 练习视图 ===== -->
    <template v-if="view === 'practice'">
      <!-- ① 选题组 -->
      <section class="page__section card">
        <h2>选择知识点</h2>
        <div class="group-tabs">
          <button
            v-for="g in groups"
            :key="g.id"
            class="group-tab"
            :class="{ 'group-tab--active': g.id === activeGroupId }"
            @click="switchGroup(g.id)"
          >
            {{ g.name }}（{{ masteredOf(g) }}/{{ g.questions.length }}）
          </button>
        </div>
        <p class="group-desc">{{ activeGroup?.desc }} · 已掌握 {{ masteredCount }}/{{ groupTotal }}，待抽 {{ pool.length }} 题</p>
      </section>

      <!-- ② 进度统计 -->
      <section class="page__section card stat-card">
        <div class="stat-item">
          <div class="stat-num stat-num--main">{{ masteredCount }}/{{ groupTotal }}</div>
          <div class="stat-label">已掌握</div>
        </div>
        <div class="stat-item">
          <div class="stat-num stat-num--ok">{{ roundCorrect }}</div>
          <div class="stat-label">本轮答对</div>
        </div>
        <div class="stat-item">
          <div class="stat-num stat-num--bad">{{ roundWrong }}</div>
          <div class="stat-label">本轮答错</div>
        </div>
        <div class="stat-bar">
          <div
            class="stat-bar__fill"
            :style="{ width: (groupTotal ? (masteredCount / groupTotal) * 100 : 0) + '%' }"
          ></div>
        </div>
      </section>

      <!-- ③ 本轮题目 -->
      <section class="page__section">
        <div class="round-head">
          <h2>本轮随机抽取（{{ roundQuestions.length }} 题）</h2>
          <button class="btn btn--ghost btn--sm" @click="drawRound">换一批</button>
        </div>
        <p v-if="roundQuestions.length && roundWrong === 0 && roundCorrect === roundQuestions.length" class="round-tip">
          ✅ 本轮全部答对！点「换一批」继续抽取未掌握题目
        </p>

        <article
          v-for="(q, qi) in roundQuestions"
          :key="q.id"
          class="card question-card"
        >
          <div class="question-head">
            <span class="question-no">本轮第 {{ qi + 1 }} 题</span>
            <span class="question-head__right">
              <span
                v-if="roundAnswers[q.id]"
                class="question-state"
                :class="roundAnswers[q.id].correct ? 'is-ok' : 'is-wrong'"
              >
                {{ roundAnswers[q.id].correct ? '✓ 已掌握' : '✗ 已进错题本' }}
              </span>
              <button
                class="fav-btn"
                :class="{ 'fav-btn--on': !!favorites[q.id] }"
                @click="toggleFav(q)"
              >
                {{ favorites[q.id] ? '★ 已收藏' : '☆ 收藏' }}
              </button>
            </span>
          </div>
          <div class="question-text">{{ q.question }}</div>

          <div class="option-list">
            <button
              v-for="(opt, oi) in q.options"
              :key="oi"
              class="option"
              :class="optionClass(q, oi)"
              :disabled="!!roundAnswers[q.id]"
              @click="selectOption(q, oi)"
            >
              <span class="option-letter">{{ LETTERS[oi] }}</span>
              <span class="option-text">{{ opt }}</span>
            </button>
          </div>

          <div
            v-if="roundAnswers[q.id]"
            class="feedback"
            :class="roundAnswers[q.id].correct ? 'feedback--ok' : 'feedback--wrong'"
          >
            <div class="feedback__line">
              <strong>{{ roundAnswers[q.id].correct ? '回答正确，本题已掌握' : '回答错误，已收入错题本' }}</strong>
              <span v-if="!roundAnswers[q.id].correct" class="feedback__answer">
                正确答案：{{ q.answer }} · {{ q.options[LETTERS.indexOf(q.answer)] }}
              </span>
            </div>
            <div class="feedback__exp">解析：{{ q.explanation }}</div>
            <button
              v-if="!roundAnswers[q.id].correct"
              class="btn btn--ghost btn--sm"
              @click="redoQuestion(q)"
            >
              重做本题
            </button>
          </div>
        </article>

        <p v-if="!roundQuestions.length && !showComplete" class="round-tip">
          本组没有待抽题目，点击「换一批」重新抽取
        </p>
      </section>

      <!-- ④ 外部刷题平台 -->
      <section class="page__section card">
        <h2>更多练习</h2>
        <p class="group-desc">站内题库有限，欢迎到知名刷题平台继续练习：</p>
        <div class="link-grid">
          <a
            v-for="link in practiceLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener"
            class="link-card"
          >
            <div class="link-card__name">{{ link.name }}</div>
            <div class="link-card__desc">{{ link.desc }}</div>
          </a>
        </div>
      </section>
    </template>

    <!-- ===== 错题本视图 ===== -->
    <template v-else>
      <section class="page__section card">
        <div class="wrong-head">
          <h2>错题本（{{ wrongList.length }}）</h2>
          <button v-if="wrongList.length" class="btn btn--ghost btn--sm" @click="clearWrong">
            清空错题本
          </button>
        </div>

        <div v-if="!wrongList.length" class="wrong-empty">
          <p>暂无错题 🎉</p>
          <p class="wrong-empty__sub">答错的题目会自动收录到这里，答对后自动移出，也可手动「重新进入题库」。</p>
        </div>

        <article
          v-for="(item, i) in wrongList"
          :key="item.question.id"
          class="wrong-item"
        >
          <div class="question-head">
            <span class="wrong-tag">{{ item.group.name }}</span>
            <span class="question-head__right">
              <span class="question-no">错题 {{ i + 1 }}</span>
              <button
                class="fav-btn"
                :class="{ 'fav-btn--on': !!favorites[item.question.id] }"
                @click="toggleFav(item.question)"
              >
                {{ favorites[item.question.id] ? '★ 已收藏' : '☆ 收藏' }}
              </button>
            </span>
          </div>
          <div class="question-text">{{ item.question.question }}</div>
          <div class="wrong-answers">
            <span class="wrong-answer wrong-answer--mine">
              我的答案：{{ item.record.selected }} · {{ item.question.options[LETTERS.indexOf(item.record.selected)] }}
            </span>
            <span class="wrong-answer wrong-answer--right">
              正确答案：{{ item.question.answer }} · {{ item.question.options[LETTERS.indexOf(item.question.answer)] }}
            </span>
          </div>
          <div class="feedback__exp">解析：{{ item.question.explanation }}</div>
          <div class="wrong-actions">
            <button class="btn btn--sm" @click="redoWrong(item)">立即重练</button>
            <button class="btn btn--ghost btn--sm" @click="reenterPool(item)">重新进入题库</button>
            <button class="btn btn--ghost btn--sm" @click="removeWrong(item.question.id)">移出错题本</button>
          </div>
        </article>
      </section>
    </template>

    <!-- ===== 目标达成弹窗 ===== -->
    <div v-if="showComplete" class="complete-overlay">
      <div class="complete-modal">
        <div class="complete-emoji">🎉</div>
        <h2 class="complete-title">目标已达成！</h2>
        <p class="complete-text">
          「{{ activeGroup?.name }}」共 {{ groupTotal }} 道题已全部掌握，<br />
          网站的学习目标已经达成！
        </p>
        <p class="complete-sub">下面是去其他网站进阶练习：</p>
        <div class="complete-links">
          <a
            v-for="link in practiceLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener"
            class="complete-link"
          >
            {{ link.name }}
          </a>
        </div>
        <button class="btn complete-btn" @click="resetGroup">
          确定，重置后重新开始
        </button>
      </div>
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

.page__section {
  margin-bottom: 16px;
}

.page__section h2 {
  font-size: 16px;
  margin-bottom: 12px;
}

/* ===== 视图切换 ===== */
.view-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.view-tab {
  padding: 8px 20px;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 14px;
  transition: all 0.2s;
}

.view-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.view-tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

/* ===== 选题组 ===== */
.group-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.group-tab {
  padding: 6px 16px;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s;
}

.group-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.group-tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.group-desc {
  color: var(--color-text-secondary);
  font-size: 13px;
}

/* ===== 统计 ===== */
.stat-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 28px;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.stat-num--main {
  color: var(--color-primary);
}

.stat-num--ok {
  color: #16a34a;
}

.stat-num--bad {
  color: #d93026;
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.stat-bar {
  flex: 1 1 100%;
  height: 6px;
  border-radius: 3px;
  background: #eef0f4;
  overflow: hidden;
}

.stat-bar__fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--color-primary), #6b95ff);
  transition: width 0.3s;
}

/* ===== 本轮题目 ===== */
.round-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.round-head h2 {
  margin-bottom: 0;
}

.round-tip {
  background: #eef2ff;
  color: var(--color-primary);
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.question-card {
  margin-bottom: 16px;
}

.question-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.question-head__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fav-btn {
  padding: 3px 10px;
  border: 1px solid #e0e3e8;
  border-radius: 6px;
  background: #fff;
  color: var(--color-text-secondary);
  font-size: 12px;
  transition: all 0.15s;
}

.fav-btn:hover {
  border-color: #f59e0b;
  color: #d97706;
}

.fav-btn--on {
  background: rgba(245, 158, 11, 0.1);
  border-color: #f59e0b;
  color: #d97706;
}

.question-no {
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.question-state {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 6px;
}

.question-state.is-ok {
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}

.question-state.is-wrong {
  background: rgba(217, 48, 38, 0.1);
  color: #d93026;
}

.question-text {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.6;
  margin-bottom: 12px;
}

/* ===== 选项 ===== */
.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  background: #fff;
  color: var(--color-text);
  font-size: 14px;
  text-align: left;
  transition: all 0.15s;
}

.option:not(:disabled):hover {
  border-color: var(--color-primary);
  background: #f5f8ff;
}

.option:disabled {
  cursor: default;
}

.option-letter {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid #d5d9e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: #fff;
}

.option-text {
  flex: 1;
  min-width: 0;
  line-height: 1.5;
}

.option--correct {
  border-color: #16a34a;
  background: rgba(22, 163, 74, 0.08);
}

.option--correct .option-letter {
  background: #16a34a;
  border-color: #16a34a;
  color: #fff;
}

.option--wrong {
  border-color: #d93026;
  background: rgba(217, 48, 38, 0.06);
}

.option--wrong .option-letter {
  background: #d93026;
  border-color: #d93026;
  color: #fff;
}

/* ===== 反馈 / 解析 ===== */
.feedback {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
}

.feedback--ok {
  background: rgba(22, 163, 74, 0.07);
  border-left: 3px solid #16a34a;
}

.feedback--wrong {
  background: rgba(217, 48, 38, 0.05);
  border-left: 3px solid #d93026;
}

.feedback__line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.feedback__answer {
  color: #16a34a;
  font-weight: 600;
}

.feedback__exp {
  margin-top: 4px;
  color: #374151;
}

.btn--sm {
  margin-top: 10px;
  padding: 5px 14px;
  font-size: 13px;
}

/* ===== 外部平台 ===== */
.link-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.link-card {
  flex: 1 1 180px;
  min-width: 0;
  padding: 14px;
  border: 1px solid #e8ebf0;
  border-radius: 10px;
  background: #fff;
  transition: all 0.2s;
}

.link-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(47, 107, 255, 0.1);
}

.link-card__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}

.link-card__desc {
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-top: 4px;
}

/* ===== 错题本 ===== */
.wrong-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.wrong-head h2 {
  margin-bottom: 0;
}

.wrong-empty {
  padding: 36px 20px;
  text-align: center;
  color: var(--color-text);
  font-size: 15px;
}

.wrong-empty__sub {
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-top: 6px;
}

.wrong-item {
  border-top: 1px solid #eceef2;
  padding: 16px 0;
}

.wrong-tag {
  background: #eef2ff;
  color: var(--color-primary);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.wrong-answers {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  font-size: 13px;
}

.wrong-answer--mine {
  color: #d93026;
}

.wrong-answer--right {
  color: #16a34a;
}

.wrong-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

/* ===== 完成弹窗 ===== */
.complete-overlay {
  position: fixed;
  inset: 0;
  background: rgba(31, 35, 41, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
}

.complete-modal {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 14px;
  padding: 28px 24px;
  text-align: center;
  box-shadow: 0 12px 40px rgba(31, 35, 41, 0.2);
}

.complete-emoji {
  font-size: 40px;
  margin-bottom: 8px;
}

.complete-title {
  font-size: 20px;
  margin-bottom: 10px;
}

.complete-text {
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.7;
}

.complete-sub {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-top: 14px;
}

.complete-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 12px 0 18px;
}

.complete-link {
  padding: 6px 14px;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  font-size: 13px;
}

.complete-btn {
  width: 100%;
  padding: 10px 18px;
}

/* ===== 移动端微调 ===== */
@media (max-width: 768px) {
  .page__title {
    font-size: 20px;
  }

  .view-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .view-tab {
    text-align: center;
    padding: 10px 8px;
  }

  .stat-card {
    gap: 8px 16px;
  }

  .stat-num {
    font-size: 18px;
  }

  .option {
    padding: 10px 12px;
    font-size: 14px;
  }

  .round-head h2 {
    font-size: 15px;
  }

  .complete-modal {
    padding: 24px 16px;
  }

  .complete-links {
    flex-direction: column;
    align-items: stretch;
  }

  .complete-link {
    text-align: center;
    padding: 10px 14px;
  }
}
</style>
