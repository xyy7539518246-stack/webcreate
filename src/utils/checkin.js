// 学习路线打卡工具：按「用户 + 路线」维度记录每日打卡（一天一次），localStorage 持久化
// 存储结构：webcreate_checkins = { [phone]: { [laneKey]: { 'YYYY-MM-DD': true } } }
import { getStorage, setStorage } from '@/utils/storage'

const CHECKINS_KEY = 'checkins'

function readAll() {
  return getStorage(CHECKINS_KEY, {})
}

function saveAll(data) {
  setStorage(CHECKINS_KEY, data)
}

// 取某用户某路线的打卡日期集合（Set）
export function getCheckins(phone, lane) {
  const all = readAll()
  const map = all?.[phone]?.[lane] || {}
  return new Set(Object.keys(map))
}

// 本地日期 YYYY-MM-DD（offset 为相对今天的天数偏移）
export function todayStr(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 打卡：当天已打卡返回 { done: false }，否则写入并返回 { done: true }
export function doCheckin(phone, lane) {
  const t = todayStr()
  const all = readAll()
  if (!all[phone]) all[phone] = {}
  if (!all[phone][lane]) all[phone][lane] = {}
  if (all[phone][lane][t]) {
    return { done: false, date: t }
  }
  all[phone][lane][t] = true
  saveAll(all)
  return { done: true, date: t }
}

// 今日是否已打卡
export function isCheckedToday(phone, lane) {
  return getCheckins(phone, lane).has(todayStr())
}

// 连续打卡天数：今天已打卡则从今天起算，否则从昨天起算（力扣式）；无任何打卡返回 0
export function streakDays(set) {
  let i = 0
  while (set.has(todayStr(-i))) i++
  if (i === 0) {
    let j = 1
    while (set.has(todayStr(-j))) j++
    i = j - 1 // 昨天未打卡时 j=1 → 0
  }
  return i
}

// 指定月份打卡天数（默认当月）
export function monthDays(set, date = new Date()) {
  const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  let n = 0
  set.forEach((d) => {
    if (d.startsWith(prefix)) n++
  })
  return n
}

// 最近 count 个月（含当月）日历网格：每月 6 行 × 7 列（周一起始），
// cells 中 null 为当月外补位，其余为 { date, day, checked, isToday }
export function calendarMonths(set, count = 3) {
  const months = []
  const now = new Date()
  for (let k = count - 1; k >= 0; k--) {
    const base = new Date(now.getFullYear(), now.getMonth() - k, 1)
    const year = base.getFullYear()
    const month = base.getMonth() // 0-based
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const lead = (new Date(year, month, 1).getDay() + 6) % 7 // 当月 1 号距周一的天数
    const cells = []
    for (let i = 0; i < 42; i++) {
      const dayNum = i - lead + 1
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        cells.push({ date: ds, day: dayNum, checked: set.has(ds), isToday: ds === todayStr() })
      } else {
        cells.push(null)
      }
    }
    months.push({ year, month, cells })
  }
  return months
}
