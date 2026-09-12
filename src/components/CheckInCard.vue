<script setup>
import { ref, computed } from 'vue'
import {
  getCheckins,
  doCheckin,
  isCheckedToday,
  streakDays,
  monthDays,
  calendarMonths
} from '@/utils/checkin'

const props = defineProps({
  lane: { type: Object, required: true },
  phone: { type: String, default: '' }
})

// 打卡记录（Set）与今日状态
const checkins = ref(getCheckins(props.phone, props.lane.lane))
const checkedToday = ref(isCheckedToday(props.phone, props.lane.lane))
const toast = ref('')

// 力扣式三项统计
const streak = computed(() => streakDays(checkins.value))
const monthCount = computed(() => monthDays(checkins.value))
const total = computed(() => checkins.value.size)

// 最近 3 个月日历热力图
const months = computed(() => calendarMonths(checkins.value))

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function handleCheckin() {
  if (checkedToday.value) return
  const res = doCheckin(props.phone, props.lane.lane)
  if (res.done) {
    checkins.value = getCheckins(props.phone, props.lane.lane)
    checkedToday.value = true
    showToast('打卡成功，明天继续！')
  } else {
    checkedToday.value = true
    showToast('今天已经打过卡啦')
  }
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(showToast._t)
  showToast._t = setTimeout(() => (toast.value = ''), 2200)
}
</script>

<template>
  <div class="checkin">
    <div class="checkin__head">
      <span class="checkin__title">打卡记录</span>
      <span class="checkin__lane">{{ lane.laneName }}</span>
    </div>

    <!-- 力扣式统计 -->
    <div class="checkin__stats">
      <div class="checkin__stat">
        <div class="checkin__num">{{ streak }}</div>
        <div class="checkin__label">连续打卡</div>
      </div>
      <div class="checkin__stat">
        <div class="checkin__num">{{ monthCount }}</div>
        <div class="checkin__label">本月打卡</div>
      </div>
      <div class="checkin__stat">
        <div class="checkin__num">{{ total }}</div>
        <div class="checkin__label">累计打卡</div>
      </div>
    </div>

    <!-- 月度日历热力图（最近 3 个月） -->
    <div class="checkin__calendars">
      <div v-for="m in months" :key="m.year + '-' + m.month" class="checkin__cal">
        <div class="checkin__cal-title">{{ m.month + 1 }} 月</div>
        <div class="checkin__cal-week">
          <span v-for="w in WEEK_LABELS" :key="w" class="checkin__cal-week-label">{{ w }}</span>
        </div>
        <div class="checkin__cal-grid">
          <span
            v-for="(cell, i) in m.cells"
            :key="i"
            class="checkin__cell"
            :class="{
              'checkin__cell--checked': cell && cell.checked,
              'checkin__cell--today': cell && cell.isToday
            }"
          ></span>
        </div>
      </div>
    </div>

    <!-- 打卡按钮（一天一次） -->
    <div class="checkin__action">
      <button
        class="btn checkin__btn"
        :class="{ 'checkin__btn--done': checkedToday }"
        :disabled="checkedToday"
        @click="handleCheckin"
      >
        {{ checkedToday ? '今日已打卡 ✓' : '今日打卡' }}
      </button>
      <span v-if="toast" class="checkin__toast">{{ toast }}</span>
    </div>
  </div>
</template>

<style scoped>
.checkin {
  margin-top: 18px;
  padding: 14px 16px;
  background: #f7f9fc;
  border: 1px solid #e8ebf0;
  border-radius: 10px;
}

.checkin__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.checkin__title {
  font-size: 14px;
  font-weight: 600;
}

.checkin__lane {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* ===== 统计 ===== */
.checkin__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 32px;
  margin-bottom: 12px;
}

.checkin__stat {
  text-align: center;
}

.checkin__num {
  font-size: 20px;
  font-weight: 600;
  color: #16a34a;
  line-height: 1.2;
}

.checkin__label {
  font-size: 11px;
  color: var(--color-text-secondary);
}

/* ===== 日历热力图 ===== */
.checkin__calendars {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.checkin__cal {
  flex: 0 0 auto;
}

.checkin__cal-title {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.checkin__cal-week {
  display: grid;
  grid-template-columns: repeat(7, 14px);
  gap: 3px;
  margin-bottom: 3px;
}

.checkin__cal-week-label {
  font-size: 9px;
  color: #9aa3ad;
  text-align: center;
}

.checkin__cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 14px);
  gap: 3px;
}

.checkin__cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: #e6e9ee;
}

.checkin__cell--checked {
  background: #4caf50;
}

.checkin__cell--today {
  outline: 2px solid #2e7d32;
  outline-offset: 1px;
}

.checkin__cell--checked.checkin__cell--today {
  background: #2e7d32;
}

/* ===== 打卡按钮 ===== */
.checkin__action {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.checkin__btn {
  background: #16a34a;
}

.checkin__btn:hover {
  opacity: 0.9;
}

.checkin__btn--done {
  background: #c7d2c9;
  cursor: default;
}

.checkin__btn--done:hover {
  opacity: 1;
}

.checkin__toast {
  font-size: 12px;
  color: #16a34a;
}

/* ===== 移动端 ===== */
@media (max-width: 480px) {
  .checkin__cal {
    flex: 1 1 auto;
  }

  .checkin__cal-week,
  .checkin__cal-grid {
    grid-template-columns: repeat(7, minmax(12px, 1fr));
  }

  .checkin__cell {
    width: 100%;
    height: 14px;
  }
}
</style>
