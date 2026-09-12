// 复制文本工具：Clipboard API 优先，execCommand 降级
// 供 ExamplesView（示例复制）与 ProblemBank（参考代码复制）共用

export async function copyText(text) {
  let ok = false
  // 优先 Clipboard API（需要 https / localhost 安全上下文）
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      ok = true
    }
  } catch {
    ok = false
  }
  // 降级方案：Clipboard API 不可用或写入失败时，用隐藏 textarea + execCommand
  if (!ok) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      ta.setSelectionRange(0, text.length) // iOS 兼容
      ok = document.execCommand('copy')
      document.body.removeChild(ta)
    } catch {
      ok = false
    }
  }
  return ok
}
