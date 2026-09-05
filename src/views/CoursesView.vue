<script setup>
import { ref, computed } from 'vue'
import courses from '@/data/courses.json'

// ===== ① 知识分类：tab 切换，默认选中第一个 =====
const activeCategoryId = ref(courses.categories[0]?.id ?? '')
const activeCategory = computed(() =>
  courses.categories.find((c) => c.id === activeCategoryId.value)
)

// 知识点展开/收起状态
const expandedPoints = ref(new Set())
function togglePoint(key) {
  const next = new Set(expandedPoints.value)
  next.has(key) ? next.delete(key) : next.add(key)
  expandedPoints.value = next
}

// ===== ③ 课程 / 竞赛：类型过滤 =====
const contentFilter = ref('all')
const filteredContents = computed(() =>
  contentFilter.value === 'all'
    ? courses.contents
    : courses.contents.filter((c) => c.type === contentFilter.value)
)
const filterTabs = computed(() => [
  { key: 'all', label: '全部', count: courses.contents.length },
  {
    key: 'course',
    label: '课程',
    count: courses.contents.filter((c) => c.type === 'course').length
  },
  {
    key: 'contest',
    label: '竞赛',
    count: courses.contents.filter((c) => c.type === 'contest').length
  }
])

// 有外链的条目点击跳转新窗口；无外链的不触发跳转
function openContent(item) {
  if (item.link) {
    window.open(item.link, '_blank', 'noopener')
  }
}
</script>

<template>
  <div class="page">
    <h1 class="page__title">学习资源</h1>
    <p class="page__subtitle">知识点分类导航 · 学习路线图 · 课程/竞赛内容</p>

    <!-- ① 知识分类导航 -->
    <section class="page__section card">
      <h2>知识分类</h2>
      <div class="cat-tabs">
        <button
          v-for="c in courses.categories"
          :key="c.id"
          class="cat-tab"
          :class="{ 'cat-tab--active': c.id === activeCategoryId }"
          @click="activeCategoryId = c.id"
        >
          {{ c.name }}
        </button>
      </div>

      <template v-if="activeCategory">
        <p class="cat-desc">{{ activeCategory.desc }}</p>
        <ul class="point-list">
          <li
            v-for="(p, i) in activeCategory.points"
            :key="`${activeCategory.id}-${i}`"
            class="point-item"
          >
            <button
              class="point-head"
              @click="togglePoint(`${activeCategory.id}-${i}`)"
            >
              <span class="point-index">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="point-title">{{ p.title }}</span>
              <span class="point-brief">{{ p.brief }}</span>
              <span class="point-arrow">
                {{ expandedPoints.has(`${activeCategory.id}-${i}`) ? '收起' : '展开' }}
              </span>
            </button>
            <div
              v-if="expandedPoints.has(`${activeCategory.id}-${i}`)"
              class="point-detail"
            >
              {{ p.detail }}
            </div>
          </li>
        </ul>
      </template>
    </section>

    <!-- ② 学习路线图 -->
    <section class="page__section card">
      <h2>学习路线图</h2>
      <div v-for="lane in courses.roadmap" :key="lane.lane" class="lane">
        <div class="lane__head">
          <span class="lane__name">{{ lane.laneName }}</span>
          <span class="lane__desc">{{ lane.desc }}</span>
        </div>
        <ol class="phase-list">
          <li v-for="phase in lane.phases" :key="phase.no" class="phase-item">
            <span class="phase__no">{{ phase.no }}</span>
            <div class="phase__body">
              <div class="phase__title">{{ phase.title }}</div>
              <div class="phase__meta">{{ phase.goal }} · {{ phase.duration }}</div>
              <div class="phase__topics">
                <span v-for="t in phase.topics" :key="t" class="tag">{{ t }}</span>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <!-- ③ 课程 / 竞赛 -->
    <section class="page__section card">
      <h2>课程 / 竞赛</h2>
      <div class="filter-tabs">
        <button
          v-for="f in filterTabs"
          :key="f.key"
          class="filter-tab"
          :class="{ 'filter-tab--active': contentFilter === f.key }"
          @click="contentFilter = f.key"
        >
          {{ f.label }}（{{ f.count }}）
        </button>
      </div>

      <div class="content-grid">
        <button
          v-for="item in filteredContents"
          :key="item.id"
          class="content-card"
          :class="{ 'content-card--nolink': !item.link }"
          @click="openContent(item)"
        >
          <div class="content-card__head">
            <span
              class="content-card__type"
              :class="`content-card__type--${item.type}`"
            >
              {{ item.type === 'course' ? '课程' : '竞赛' }}
            </span>
            <span class="content-card__level">{{ item.level }}</span>
          </div>
          <div class="content-card__title">{{ item.title }}</div>
          <div class="content-card__org">{{ item.org }}</div>
          <div class="content-card__intro">{{ item.intro }}</div>
          <div class="content-card__foot">
            <span v-for="t in item.tags" :key="t" class="tag">{{ t }}</span>
            <span v-if="!item.link" class="content-card__nolink-tip">暂无外链</span>
          </div>
        </button>
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

.page__section h2 {
  font-size: 16px;
  margin-bottom: 12px;
}

/* ===== ① 知识分类 ===== */
.cat-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.cat-tab {
  padding: 6px 16px;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s;
}

.cat-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.cat-tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.cat-desc {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 12px;
}

.point-list {
  border-top: 1px solid #eceef2;
}

.point-item {
  border-bottom: 1px solid #eceef2;
}

.point-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 4px;
  background: none;
  border: none;
  text-align: left;
}

.point-head:hover .point-title {
  color: var(--color-primary);
}

.point-index {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 13px;
  flex: 0 0 auto;
}

.point-title {
  font-weight: 600;
  font-size: 14px;
  flex: 0 0 auto;
  transition: color 0.2s;
}

.point-brief {
  color: var(--color-text-secondary);
  font-size: 12px;
  flex: 1;
  min-width: 0;
}

.point-arrow {
  color: var(--color-text-secondary);
  font-size: 12px;
  flex: 0 0 auto;
}

.point-detail {
  margin: 0 4px 12px;
  padding: 10px 12px;
  background: #f7f9fc;
  border-radius: 8px;
  color: #374151;
  font-size: 13px;
  line-height: 1.7;
}

/* ===== ② 学习路线图 ===== */
.lane {
  margin-bottom: 24px;
}

.lane:last-child {
  margin-bottom: 0;
}

.lane__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.lane__name {
  font-size: 15px;
  font-weight: 600;
}

.lane__desc {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.phase-list {
  position: relative;
}

.phase-item {
  position: relative;
  padding: 0 0 18px 26px;
}

.phase-item::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 18px;
  bottom: 0;
  width: 2px;
  background: #e3e8f0;
}

.phase-item:last-child::before {
  display: none;
}

.phase-item:last-child {
  padding-bottom: 0;
}

.phase__no {
  position: absolute;
  left: 0;
  top: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phase__title {
  font-weight: 600;
  font-size: 14px;
}

.phase__meta {
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-top: 2px;
}

.phase__topics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.tag {
  background: #eef2ff;
  color: var(--color-primary);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
}

/* ===== ③ 课程 / 竞赛 ===== */
.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.filter-tab {
  padding: 5px 14px;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  transition: all 0.2s;
}

.filter-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.content-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.content-card {
  flex: 1 1 260px;
  min-width: 0;
  padding: 14px;
  border: 1px solid #e8ebf0;
  border-radius: 10px;
  background: #fff;
  text-align: left;
  transition: all 0.2s;
}

.content-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(47, 107, 255, 0.1);
}

.content-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.content-card__type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.content-card__type--course {
  background: rgba(47, 107, 255, 0.1);
  color: var(--color-primary);
}

.content-card__type--contest {
  background: rgba(250, 140, 22, 0.12);
  color: #d97706;
}

.content-card__level {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.content-card__title {
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
}

.content-card__org {
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-top: 2px;
}

.content-card__intro {
  color: #374151;
  font-size: 13px;
  line-height: 1.6;
  margin-top: 8px;
}

.content-card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.content-card__nolink-tip {
  color: #b6bcc6;
  font-size: 11px;
}

.content-card--nolink:hover {
  border-color: #e0e3e8;
  transform: none;
  box-shadow: none;
}
</style>
