<script setup>
// 学习资源页：知识点分类导航 + 学习路线图 + 课程/竞赛内容
// 占位结构：数据待接入 src/data/courses.json
</script>

<template>
  <div class="page">
    <h1 class="page__title">学习资源</h1>
    <p class="page__subtitle">知识点分类导航 · 学习路线图 · 课程/竞赛内容</p>

    <section class="page__section card">
      <h2>知识分类（占位）</h2>
      <div class="page__placeholder">待接入：知识点分类数据</div>
    </section>

    <section class="page__section card">
      <h2>学习路线图（占位）</h2>
      <div class="page__placeholder">待接入：学习路线数据</div>
    </section>

    <section class="page__section card">
      <h2>课程 / 竞赛（占位）</h2>
      <div class="page__placeholder">待接入：课程与竞赛内容数据</div>
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
