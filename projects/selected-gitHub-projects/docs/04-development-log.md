# GitHub 项目精选小程序开发日志

更新日期：2026-05-20

## 当前阶段

项目已进入开发实现阶段，当前目标是把“小程序前端 + 云端数据链路 + 中文摘要链路”连成可观测的最小闭环。

## 已完成内容

- 初始化原生微信小程序工程：
  `app.js`、`app.json`、`app.wxss`、`project.config.json`
- 搭建页面与组件骨架：
  `pages/rankings`
  `pages/detail`
  `pages/favorites`
  `components/repo-card`
  `components/status-view`
- 建立前端统一数据访问层：
  `services/repo-service.js`
- 接入第一批云函数：
  `seedMockData`
  `syncGithubRepos`
  `calculateRankings`
  `getRankings`
  `getRepoDetail`
- 增加 `generateRepoSummaries` 云函数，用于补齐详情页所需的中文摘要字段

## 今天新增

### 1. 首批摘要能力落地并已推送

- 新增 `cloudfunctions/generateRepoSummaries/`
- 新增榜单更新时间格式化能力
- 调整仓库卡片标题换行，避免长仓库名挤压布局
- 更新 `cloudfunctions/README.md`，补充摘要函数部署顺序

### 2. 云端回退升级为可观测模式

- `cloudfunctions/getRankings/repo-service.js`
- `cloudfunctions/getRepoDetail/repo-service.js`
- `services/repo-service.js`

改动说明：

- 数据库读取成功时，返回 `meta.source = cloud-db`
- 数据库读取失败但可回退到 mock 时，返回 `meta.source = mock-fallback`
- 回退结果会带上 `reasonCode`、`reasonMessage`、`observedAt` 和序列化后的 `error`
- 前端榜单页与详情页会显式展示“当前展示的是 Mock 回退数据”，不再静默掩盖云端异常

### 3. 摘要链升级为大模型版本

- `cloudfunctions/generateRepoSummaries/repo-service.js`

改动说明：

- 通过 OpenAI 兼容接口调用真实模型生成中文摘要
- 支持环境变量：
  `REPO_SUMMARY_API_KEY`
  `REPO_SUMMARY_MODEL`
  `REPO_SUMMARY_BASE_URL`
  `REPO_SUMMARY_ALLOW_RULE_FALLBACK`
- 模型失败时允许回退到规则版摘要，但会把来源与失败原因写入仓库字段，便于追踪

### 4. 榜单同步切换为 GitHub Trending 直连

- `cloudfunctions/syncGithubRepos/github-client.js`
- `cloudfunctions/syncGithubRepos/repo-service.js`

改动说明：

- 不再依赖本地 `calculateRankings` 去近似推导日榜、周榜、月榜
- `syncGithubRepos` 直接抓取 GitHub Trending 的 `daily / weekly / monthly`
- 同步时会把三个周期的榜单直接写入 `ranking_snapshots`
- 同步时仍会回写 `repositories` 与 `star_snapshots`，保证详情页和后续摘要链继续可用

## 当前风险与待办

- `generateRepoSummaries` 需要在微信云开发控制台配置摘要模型环境变量后，才能走真正的模型链路
- 目前尚未在真实云环境完成 `getRankings/getRepoDetail` 的异常回退联调，需要在开发者工具中验证前端提示条是否符合预期
- 如果后续要进一步提升摘要质量，可以考虑补充 README 抓取、主页链接、最近 release 等更丰富的输入上下文
- `syncGithubRepos` 切到 Trending 直连后，需要重新部署该云函数并重新跑一次，才能让周榜/月榜和日榜真正区分开
