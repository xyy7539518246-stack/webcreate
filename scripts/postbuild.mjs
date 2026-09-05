// 构建后生成 404.html（复制 index.html）
// GitHub Pages 不支持 SPA rewrites，但 404 时会返回根目录的 404.html，
// 利用这一点让 history 模式的深层路由刷新时回退到应用入口，避免 404。
import { copyFileSync } from 'node:fs'

copyFileSync('dist/index.html', 'dist/404.html')
console.log('已生成 dist/404.html（SPA 回退）')
