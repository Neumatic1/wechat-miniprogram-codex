# GitHub 项目精选小程序开发日志

更新日期：2026-05-20

## 阶段目标

从需求/原型阶段进入开发阶段，优先完成一个可在微信开发者工具中直接打开的原生小程序 MVP 前端骨架，为后续云开发接口接入预留清晰边界。

## 本次落地内容

- 新建原生微信小程序工程基础配置：`project.config.json`、`app.json`、`app.js`、`app.wxss`、`sitemap.json`
- 新建自定义底部导航 `custom-tab-bar/`，支持“榜单 / 收藏”双入口
- 实现三页结构：
  - `pages/rankings/index`：日榜 / 周榜 / 月榜切换、列表展示、骨架屏、空态、错误态
  - `pages/detail/index`：中文摘要、用途、亮点、适用场景、复制链接、收藏
  - `pages/favorites/index`：本地收藏列表、取消收藏、复制链接
- 抽离可复用组件：
  - `components/repo-card/`
  - `components/status-view/`
- 建立前端数据访问边界：
  - `services/repo-service.js` 统一封装榜单与详情获取
  - 当前默认 `USE_MOCK_DATA = true`
  - 后续真实云函数接入时只需替换服务层
- 建立本地收藏能力：
  - `utils/favorites.js`
  - 使用小程序本地缓存保存收藏项目
- 建立第一批 mock 数据：
  - `utils/mock-data.js`
  - 覆盖日榜 / 周榜 / 月榜与详情字段
- 新建 `cloudfunctions/README.md`，明确后端接入顺序与前端切换点

## 云开发配置补充

- 已确认小程序 AppID：`wx8b4129374dc126b5`
- 新增 `config/cloud.js` 作为前端云开发配置入口
- `app.js` 已改为基于 `config/cloud.js` 初始化云开发
- `services/repo-service.js` 已支持通过 `useCloud` 开关在 mock / 云函数之间切换
- 新增第一批云函数骨架：
  - `cloudfunctions/getRankings`
  - `cloudfunctions/getRepoDetail`
- 新增 `cloudfunctions/shared/` 共享数据与服务逻辑，便于后续替换为真实数据库实现

## 当前云开发状态

现在项目已经具备“可部署云函数 + 可切换前端调用”的结构，但还差两步才能真正切到云端：

1. 你在云开发控制台创建环境并拿到 `envId`
2. 把 `config/cloud.js` 中的 `envId` 填上，并将 `useCloud` 改为 `true`

## 云数据库联调升级

- `getRankings`、`getRepoDetail` 已升级为：
  - 优先读取云数据库
  - 数据不存在时自动回退到静态 mock
- 新增 `seedMockData` 云函数，用于初始化：
  - `repositories`
  - `ranking_snapshots`
- 这样后续可以先用 `seedMockData` 打通数据库读链路，再逐步替换成真实 GitHub 抓取与计算逻辑

## 当前状态

目前已经具备一个可运行的前端 MVP 雏形，适合下一步继续推进：

1. 在微信开发者工具中打开工程并检查视觉和交互
2. 根据真机效果微调布局与字体密度
3. 开始实现云开发数据库结构与 `getRankings` / `getRepoDetail`
4. 用真实数据替换 mock 数据

## 后续建议

- 优先补齐云函数与数据库结构，打通前后端最小闭环
- 再补充榜单刷新策略、摘要缺失回退和异常监控
- 如果要进入联调阶段，可以先保留 mock 兜底，再逐个接口切换
