<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import courses from '@/data/courses.json'
import quizData from '@/data/quiz.json'
import { getStorage, setStorage } from '@/utils/storage'

const router = useRouter()
const userStore = useUserStore()

const lanes = courses.roadmap

// 当前方向名称
const currentLaneName = computed(() => {
  const direction = userStore.user?.direction
  const lane = lanes.find((l) => l.lane === direction)
  return lane ? lane.laneName : '未选择'
})

function chooseDirection(lane) {
  userStore.setDirection(lane)
}

// ===== 题库学习数据（localStorage） =====
const MASTERED_KEY = 'quiz_mastered' // { qid: ts }
const WRONG_KEY = 'quiz_wrong' // { qid: { selected, ts } }
const FAV_KEY = 'quiz_favorites' // { qid: ts }

const mastered = ref(getStorage(MASTERED_KEY, {}))
const wrongBook = ref(getStorage(WRONG_KEY, {}))
const favorites = ref(getStorage(FAV_KEY, {}))

function persistWrong() {
  setStorage(WRONG_KEY, wrongBook.value)
}
function persistFavorites() {
  setStorage(FAV_KEY, favorites.value)
}

const LETTERS = ['A', 'B', 'C', 'D']

// ===== 学习记录：各知识点掌握进度 =====
const groupStats = computed(() =>
  quizData.groups.map((g) => ({
    ...g,
    mastered: g.questions.filter((q) => mastered.value[q.id]).length,
    total: g.questions.length,
    percent: Math.round((g.questions.filter((q) => mastered.value[q.id]).length / g.questions.length) * 100)
  }))
)

const totalMastered = computed(() => Object.keys(mastered.value).length)
const totalWrong = computed(() => Object.keys(wrongBook.value).length)
const totalFav = computed(() => Object.keys(favorites.value).length)

// ===== 我的收藏 =====
const favList = computed(() => {
  const list = []
  for (const g of quizData.groups) {
    for (const q of g.questions) {
      if (favorites.value[q.id]) list.push({ group: g, question: q })
    }
  }
  return list
})

function removeFav(qid) {
  const next = { ...favorites.value }
  delete next[qid]
  favorites.value = next
  persistFavorites()
}

// ===== 错题本 =====
const wrongList = computed(() => {
  const list = []
  for (const g of quizData.groups) {
    for (const q of g.questions) {
      const rec = wrongBook.value[q.id]
      if (rec) list.push({ group: g, question: q, record: rec })
    }
  }
  return list
})

function removeWrong(qid) {
  const next = { ...wrongBook.value }
  delete next[qid]
  wrongBook.value = next
  persistWrong()
}

// 跳转到题库对应知识点
function goPractice(groupId) {
  router.push({ path: '/quiz', query: { group: groupId } })
}
</script>

<template>
  <div class="page">
    <h1 class="page__title">个人中心</h1>
    <p class="page__subtitle">账号信息 · 学习方向 · 学习记录 · 收藏 · 错题本</p>

    <section class="page__section card">
      <h2>账号信息</h2>
      <p class="page__info">
        当前账号：{{ userStore.user?.username || '未登录' }}
      </p>
    </section>

    <section class="page__section card">
      <h2>学习方向</h2>
      <template v-if="userStore.isLoggedIn">
        <p class="page__info">当前方向：{{ currentLaneName }}</p>
        <div class="direction-tabs">
          <button
            v-for="l in lanes"
            :key="l.lane"
            class="direction-tab"
            :class="{ 'direction-tab--active': userStore.user?.direction === l.lane }"
            @click="chooseDirection(l.lane)"
          >
            {{ l.laneName }}
          </button>
          <button
            v-if="userStore.user?.direction"
            class="direction-tab direction-tab--clear"
            @click="chooseDirection('')"
          >
            清除方向
          </button>
        </div>
        <p class="page__hint">选择后将同步到首页「我的学习路线」区块</p>
      </template>
      <p v-else class="page__placeholder">登录后可选择学习方向</p>
    </section>

    <!-- ===== 学习记录 ===== -->
    <section class="page__section card">
      <h2>学习记录</h2>
      <div class="summary-row">
        <div class="summary-item">
          <div class="summary-num">{{ totalMastered }}</div>
          <div class="summary-label">已掌握题目</div>
        </div>
        <div class="summary-item">
          <div class="summary-num summary-num--bad">{{ totalWrong }}</div>
          <div class="summary-label">错题</div>
        </div>
        <div class="summary-item">
          <div class="summary-num summary-num--fav">{{ totalFav }}</div>
          <div class="summary-label">收藏</div>
        </div>
      </div>
      <div class="record-list">
        <div v-for="g in groupStats" :key="g.id" class="record-item">
          <div class="record-item__head">
            <span class="record-item__name">{{ g.name }}</span>
            <span class="record-item__num">{{ g.mastered }}/{{ g.total }}</span>
          </div>
          <div class="record-bar">
            <div class="record-bar__fill" :style="{ width: g.percent + '%' }"></div>
          </div>
        </div>
      </div>
      <button class="btn btn--ghost btn--sm" @click="goPractice()">去题库继续练习 →</button>
    </section>

    <!-- ===== 我的收藏 ===== -->
    <section class="page__section card">
      <div class="section-head">
        <h2>我的收藏（{{ favList.length }}）</h2>
      </div>

      <div v-if="!favList.length" class="page__placeholder">
        还没有收藏题目，去「题库练习」中点击 ☆ 收藏即可
      </div>

      <article v-for="item in favList" :key="item.question.id" class="sub-item">
        <div class="question-head">
          <span class="sub-tag">{{ item.group.name }}</span>
          <button class="fav-btn fav-btn--on" @click="removeFav(item.question.id)">
            ★ 取消收藏
          </button>
        </div>
        <div class="question-text">{{ item.question.question }}</div>
        <div class="sub-answers">
          <span class="sub-answer sub-answer--right">
            答案：{{ item.question.answer }} · {{ item.question.options[LETTERS.indexOf(item.question.answer)] }}
          </span>
        </div>
        <div class="feedback__exp">解析：{{ item.question.explanation }}</div>
        <button class="btn btn--ghost btn--sm" @click="goPractice(item.group.id)">
          去练这组 → /quiz?group={{ item.group.id }}
        </button>
      </article>
    </section>

    <!-- ===== 错题本 ===== -->
    <section class="page__section card">
      <div class="section-head">
        <h2>错题本（{{ wrongList.length }}）</h2>
      </div>

      <div v-if="!wrongList.length" class="page__placeholder">
        暂无错题，答错的题目会自动收录到这里
      </div>

      <article v-for="item in wrongList" :key="item.question.id" class="sub-item">
        <div class="question-head">
          <span class="sub-tag">{{ item.group.name }}</span>
        </div>
        <div class="question-text">{{ item.question.question }}</div>
        <div class="sub-answers">
          <span class="sub-answer sub-answer--mine">
            我的答案：{{ item.record.selected }} · {{ item.question.options[LETTERS.indexOf(item.record.selected)] }}
          </span>
          <span class="sub-answer sub-answer--right">
            正确答案：{{ item.question.answer }} · {{ item.question.options[LETTERS.indexOf(item.question.answer)] }}
          </span>
        </div>
        <div class="feedback__exp">解析：{{ item.question.explanation }}</div>
        <div class="wrong-actions">
          <button class="btn btn--sm" @click="goPractice(item.group.id)">去重练 → /quiz?group={{ item.group.id }}</button>
          <button class="btn btn--ghost btn--sm" @click="removeWrong(item.question.id)">移出错题本</button>
        </div>
      </article>
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

.page__section h2 {
  font-size: 16px;
  margin-bottom: 12px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.section-head h2 {
  margin-bottom: 0;
}

.page__info {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.page__hint {
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-top: 12px;
}

.direction-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.direction-tab {
  padding: 6px 16px;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s;
}

.direction-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.direction-tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.direction-tab--clear {
  color: #d93026;
  border-color: #e5b3b0;
}

.direction-tab--clear:hover {
  background: rgba(217, 48, 38, 0.06);
  color: #d93026;
}

.page__placeholder {
  padding: 24px;
  border: 1px dashed #d5d9e0;
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  text-align: center;
}

/* ===== 学习记录 ===== */
.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 40px;
  margin-bottom: 16px;
}

.summary-item {
  text-align: center;
}

.summary-num {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-primary);
}

.summary-num--bad {
  color: #d93026;
}

.summary-num--fav {
  color: #d97706;
}

.summary-label {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.record-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.record-item__name {
  font-size: 13px;
  font-weight: 600;
}

.record-item__num {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.record-bar {
  height: 6px;
  border-radius: 3px;
  background: #eef0f4;
  overflow: hidden;
}

.record-bar__fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--color-primary), #6b95ff);
  transition: width 0.3s;
}

/* ===== 收藏 / 错题列表 ===== */
.sub-item {
  border-top: 1px solid #eceef2;
  padding: 16px 0;
}

.question-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.sub-tag {
  background: #eef2ff;
  color: var(--color-primary);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.question-text {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
  margin-bottom: 8px;
}

.sub-answers {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  margin-bottom: 6px;
}

.sub-answer--mine {
  color: #d93026;
}

.sub-answer--right {
  color: #16a34a;
}

.feedback__exp {
  font-size: 13px;
  color: #374151;
  line-height: 1.7;
  margin-bottom: 10px;
}

.wrong-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn--sm {
  padding: 5px 14px;
  font-size: 13px;
}

.fav-btn {
  padding: 3px 10px;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  font-size: 12px;
  transition: all 0.15s;
}

.fav-btn:hover {
  background: rgba(245, 158, 11, 0.18);
}

/* ===== 移动端微调 ===== */
@media (max-width: 768px) {
  .page__title {
    font-size: 20px;
  }

  .summary-row {
    gap: 12px 24px;
  }

  .wrong-actions .btn {
    flex: 1 1 auto;
  }
}
</style>
