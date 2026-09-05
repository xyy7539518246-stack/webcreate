# src/data —— 本地数据目录

本目录存放项目前端使用的本地静态数据（JSON），由对应页面模块引用。

## 规划中的数据结构

| 文件名 | 用途 | 引用页面 |
| --- | --- | --- |
| `courses.json` | 知识点分类、学习路线图、课程/竞赛内容 | CoursesView（学习资源） |
| `quiz.json` | 题库题目（按知识点分组，含答案与解析） | QuizView（题库练习） |
| `examples.json` | C++ / Java / 前端示例代码 | ExamplesView（示例代码） |
| `assistant.json` | AI 问答本地知识库（检索用） | AssistantView（AI 问答） |
| `users.json` | 本地模拟账号数据（演示用） | LoginView（登录） |

## 说明

- 数据均为课程教学演示用途，内容待开发对应模块时补充。
- 答题记录、错题本、收藏等**用户产生**的数据不放在本目录，统一写入 `localStorage`（见 `src/utils/storage.js`）。
