// 轻量语法高亮工具（零依赖，转义后按 token 着色）
// 供 ExamplesView（示例展示）与 CodePracticeModal（练习对话框）共用

const KEYWORDS = {
  cpp: new Set([
    'auto','bool','break','case','catch','char','class','const','continue',
    'default','delete','do','double','else','enum','false','float','for',
    'friend','goto','if','inline','int','long','namespace','new','nullptr',
    'operator','private','protected','public','register','return','short',
    'signed','sizeof','static','struct','switch','template','this','throw',
    'true','try','typedef','typename','union','unsigned','using','virtual',
    'void','volatile','while','std','vector','string','cout','cin','endl',
    'include','define'
  ]),
  java: new Set([
    'abstract','assert','boolean','break','byte','case','catch','char','class',
    'const','continue','default','do','double','else','enum','extends','final',
    'finally','float','for','goto','if','implements','import','instanceof',
    'int','interface','long','native','new','package','private','protected',
    'public','return','short','static','strictfp','super','switch','synchronized',
    'this','throw','throws','transient','try','void','volatile','while','true',
    'false','null','var','public','String','System','Math','Integer','List',
    'Map','Set','ArrayList','HashMap','HashSet','Arrays','Collections',
    'Comparator','Map.Entry'
  ]),
  frontend: new Set([
    'const','let','var','function','return','if','else','for','while','do',
    'switch','case','break','continue','new','delete','typeof','instanceof',
    'in','of','class','extends','super','this','async','await','try','catch',
    'finally','throw','export','import','from','default','null','undefined',
    'true','false','document','window','console','Promise','Set','Map','Array',
    'Object','JSON','localStorage','navigator','fetch','Error','Date',
    'setTimeout','clearTimeout','addEventListener'
  ])
}

// HTML 转义（先转义，后续 token 着色不会破坏结构）
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 依次匹配：注释/预处理 → 字符串/字符 → 数字 → 标识符
const TOKEN_REG =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g

export function highlight(code, lang) {
  const kw = KEYWORDS[lang] || new Set()
  return escapeHtml(code).replace(TOKEN_REG, (m, comment, str, num, ident) => {
    if (comment) return `<span class="tok-comment">${m}</span>`
    if (str) return `<span class="tok-string">${m}</span>`
    if (num) return `<span class="tok-number">${m}</span>`
    if (ident) return kw.has(m) ? `<span class="tok-keyword">${m}</span>` : m
    return m
  })
}
