<script setup>
// 题库练习页：按知识点练习 + 即时判题 + 答题记录 + 错题本
// 占位结构：题目数据待接入 src/data/quiz.json
</script>

<template>
  <div class="page">
    <h1 class="page__title">题库练习</h1>
    <p class="page__subtitle">按知识点练习 · 即时判题 · 答题记录 · 错题本</p>

    <section class="page__section card">
      <h2>练习入口（占位）</h2>
      <div class="page__placeholder">待接入：按知识点选择练习</div>
    </section>

    <section class="page__section card">
      <h2>答题记录 / 错题本（占位）</h2>
      <div class="page__placeholder">待接入：答题记录与错题本数据</div>
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

.page__placeholder {
  padding: 24px;
  border: 1px dashed #d5d9e0;
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  text-align: center;
}
</style>
