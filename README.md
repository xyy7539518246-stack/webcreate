# AI 编程学习助手（WebCreate）

> 面向高校学生的 AI 辅助编程学习平台 —— 题库练习 · 示例代码 · 学习路线 · AI 问答
>
> 《Web开发实践》课程设计项目（课程号：07100130，单人独立完成）

## 项目简介

本项目是一个基于 Vue 3 的 AI 辅助编程学习助手网站，面向编程初学者与备赛学生，提供「学习资源 → 题库练习 → 示例代码 → AI 问答」一体化的学习路径。项目以 Web 前端为核心，综合运用 HTML5、CSS3、JavaScript、Vue 3 组件化开发、静态托管部署与 AI 开发工具，并落实跨浏览器兼容、性能、合规伦理与 AI 工具使用边界等课程约束。

**目标用户**：高校计算机专业学生、编程初学者、竞赛备赛者。

## 功能特性

- **登录认证**：账号密码登录、登录会话保持（本地模拟）、表单校验、退出登录
- **学习资源**：知识点分类导航、学习路线图展示、课程/竞赛内容浏览
- **题库练习**：按知识点练习、即时判题、答题记录与错题本
- **示例代码**：C++ / Java / 前端示例代码浏览、语法高亮与一键复制
- **AI 问答**：输入问题获取解答，本地知识检索 + AI 辅助生成（含降级方案）
- **个人中心**：学习记录、收藏、错题本（数据本地化存储）

## 技术栈

| 分类 | 技术 / 工具 |
| --- | --- |
| 前端基础 | HTML5、CSS3、JavaScript（ES6+） |
| 框架与脚手架 | Vue 3（Composition API）、Vite 5 |
| 状态与路由 | Vue Router、Pinia |
| 数据存储 | 本地数据（JSON）+ localStorage |
| 开发工具 | VS Code（Volar / ESLint / Prettier / Live Server） |
| 版本管理 | Git + GitHub |
| 部署工具 | 静态托管平台 |
| AI 开发工具 | 代码辅助类、需求分析类、问题排查类 |

## 项目结构

```text
webcreate/
├── index.html              # 入口 HTML
├── vite.config.js          # Vite 配置
├── package.json            # 依赖与脚本
├── .gitignore              # 忽略文件配置（node_modules / dist 等）
├── README.md               # 项目说明（本文件）
├── src/
│   ├── main.js             # 应用入口
│   ├── App.vue             # 根组件
│   ├── router/             # 路由配置
│   ├── views/              # 页面层
│   │   ├── LoginView.vue       # 登录页      /login
│   │   ├── HomeView.vue        # 导航首页    /
│   │   ├── CoursesView.vue     # 学习资源页  /courses
│   │   ├── QuizView.vue        # 题库练习页  /quiz
│   │   ├── ExamplesView.vue    # 代码示例页  /examples
│   │   ├── AssistantView.vue   # AI 问答页   /assistant
│   │   └── ProfileView.vue     # 个人中心页  /profile
│   ├── components/         # 组件层（导航 / 列表 / 表单 / 图表等）
│   ├── store/              # 状态与数据层
│   ├── utils/              # 校验、权限、存储工具
│   └── data/               # 本地数据（JSON）
└── dist/                   # 构建产物（不纳入版本管理）
```

## 快速开始

### 环境要求

- Node.js 20 LTS 及以上
- npm（随 Node.js 安装）
- 现代浏览器（Chrome / Edge / Firefox）

### 安装与启动

```bash
# 1. 安装依赖
npm install

# 2. 本地启动（开发模式）
npm run dev
# 浏览器访问 http://localhost:5173
```

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 本地开发，热更新 |
| `npm run build` | 构建生产产物到 `dist/` |
| `npm run preview` | 本地预览构建结果 |

## 部署

```bash
# 1. 构建生产产物
npm run build

# 2. 将 dist/ 目录部署到静态托管平台
# 3. 配置 SPA 回退（rewrites / fallback 到 index.html），避免刷新 404
```

> 部署地址：____（待部署后补充）

## 约束与合规说明

- **跨浏览器兼容**：采用标准化 CSS 与 Flex/Grid 布局，配合 reset 样式，在主流浏览器下实测一致；对不兼容特性提供降级方案。
- **性能**：列表分页 / 懒加载、按需渲染，构建产物开启资源压缩与代码分割。
- **合规伦理**：教学演示项目，示例数据与书目均为虚构或公开内容，不涉及侵权资源。
- **AI 工具使用边界**：AI 开发工具仅用于代码辅助、需求分析与问题排查；所有 AI 生成内容经本人理解、审查与验证后使用，并在技术复盘报告中如实记录。

## Git 提交规范

本仓库遵循课程《Web开发实践》版本管理要求：

- 提交信息格式：`类型 + 简述`，如 `feat: 完成登录页`、`fix: 修复路由跳转问题`
- 类型：`feat`（新功能）/ `fix`（修复）/ `perf`（性能）/ `docs`（文档）/ `refactor`（重构）
- 按功能小步提交，每日至少提交一次并推送远程
- 主分支 + 功能分支策略，功能完成后合并回主分支
- `.gitignore` 已排除 `node_modules`、`dist` 等目录

## 路线图

- [x] 项目初始化与仓库托管
- [ ] 登录认证与页面骨架
- [ ] 学习资源与题库模块
- [ ] 示例代码与 AI 问答模块
- [ ] 线上部署与功能测试
- [ ] 演示视频与课程报告

## 版权与致谢

- 课程：《Web开发实践》（河北科技大学）
- 主要参考：Vue.js 3 官方文档、MDN Web Docs、《前端开发实战派：Vue.js 3+Node.js+Serverless+Git》
- 本项目为课程教学实践项目，仅用于学习交流。
