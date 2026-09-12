# src/data —— 本地数据目录

本目录存放项目前端使用的本地静态数据（JSON），由对应页面模块引用。

## 规划中的数据结构

| 文件名 | 用途 | 引用页面 |
| --- | --- | --- |
| `courses.json` | 知识点分类、学习路线图、课程/竞赛内容 | CoursesView（学习资源） |
| `quiz.json` | 题库题目（按知识点分组，含答案与解析） | QuizView（题库练习） |
| `examples.json` | C++ / Java / 前端示例代码（已实现，3 类 17 例） | ExamplesView（示例代码） |
| `problems.json` | 代码题库（已实现，基础/进阶/高级 3 难度 24 题，每难度 8 题，均可补全练习） | ProblemBank（题库练习） |
| `assistant.json` | AI 问答本地知识库（已实现，20 条，关键词检索命中直接回答） | AssistantView（AI 问答） |
| `users.json` | 本地模拟账号数据（演示用） | LoginView（登录） |

## 说明

- 数据均为课程教学演示用途，内容待开发对应模块时补充。
- `assistant.json` 结构：`entries` 数组（字段：id / category / keywords（强关键词，命中即答）/ weakKeywords（弱关键词，命中 ≥2 个才答）/ question / answer），由 `src/utils/assistant.js` 的 `matchLocalKnowledge` 检索；未命中时浏览器直连 DeepSeek API（API Key 由用户在页面弹窗中输入并存 localStorage，不进代码仓库），调用失败返回降级提示。
- `examples.json` 结构：`categories`（分类定义：id / name / desc）+ `examples`（示例数组，字段：id / category / title / tags / description / code / **practice**）。`practice` 为代码补全练习：`prompt`（练习说明）+ `template`（挖空代码模板，`__N__` 为占位符）+ `blanks`（id / hint / answers，answers 支持多个可接受写法，判题忽略空白），由 ExamplesView 内的 CodePracticeModal 渲染与判题。
- `problems.json` 结构：`difficulties`（难度定义：id / name / desc，basic 基础 / intermediate 进阶 / advanced 高级）+ `problems`（题目数组，字段：id / difficulty / language / title / description / example / hint / solution / **practice**）。`practice` 与 examples.json 同构（prompt / template / blanks，占位符 `__N__`），使每道题均可进入 CodePracticeModal 补全练习；由 ProblemBank 组件按难度筛选展示，详情区「开始练习」复用 CodePracticeModal（其 `category || language` 兼容示例与题目两类数据）。
- 答题记录、错题本、收藏等**用户产生**的数据不放在本目录，统一写入 `localStorage`（见 `src/utils/storage.js`）。
