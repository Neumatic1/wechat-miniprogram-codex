# Cloud Functions

当前项目的云函数按数据链路分成 6 个环节：

- `seedMockData`
  初始化演示数据，快速打通数据库读链路。
- `syncGithubRepos`
  优先读取预生成的 Trending feed，再写入 `repositories`、`star_snapshots` 和 `ranking_snapshots`。
- `calculateRankings`
  基于仓库信息和 star 快照计算 `daily` / `weekly` / `monthly` 榜单，写入 `ranking_snapshots`。现在主要作为备用计算链路保留。
- `generateRepoSummaries`
  为仓库补齐 `summaryZh`、`whatItDoes`、`highlights`、`useCases` 等结构化中文摘要字段。
- `getRankings`
  给小程序榜单页提供榜单数据。现在支持可观测回退：如果数据库链路异常，会返回 `meta.source = mock-fallback` 和回退原因。
- `getRepoDetail`
  给小程序详情页提供项目详情数据。现在同样支持可观测回退，不再静默吃掉云端异常。

## Collections

- `repositories`
  仓库主数据，文档 ID 使用 `repoId`。
- `star_snapshots`
  仓库 star 快照，文档 ID 形如 `repoId__timestamp`。
- `ranking_snapshots`
  榜单结果，文档 ID 固定为 `daily`、`weekly`、`monthly`。

## Deploy Order

1. 部署 `seedMockData`
2. 手动调用一次 `seedMockData`
3. 部署 `getRankings` 和 `getRepoDetail`
4. 在小程序前端验证榜单页和详情页已经能从数据库读取演示数据
5. 在云函数环境变量中配置 `GITHUB_TOKEN` 或 `GH_TOKEN`
6. 部署 `syncGithubRepos`
7. 配置 `TRENDING_FEED_URL`
8. 先用 `{"dryRun": true, "maxRepos": 3}` 调用一次 `syncGithubRepos`
9. 再用 `{"dryRun": false, "maxRepos": 10}` 调用一次 `syncGithubRepos`
10. 如果你还想保留“自计算榜单”的备用链路，再单独部署并调用 `calculateRankings`
11. 在云函数环境变量中配置摘要链：
    `REPO_SUMMARY_API_KEY`
    `REPO_SUMMARY_MODEL`
    `REPO_SUMMARY_BASE_URL`
12. 部署 `generateRepoSummaries`
13. 先用小批量参数手动调用一次 `generateRepoSummaries`
14. 回到小程序前端验证榜单页和详情页是否开始显示真实同步数据和中文摘要

## Summary Env

`generateRepoSummaries` 现在默认按 OpenAI 兼容接口调用大模型，支持以下环境变量：

- `REPO_SUMMARY_API_KEY`
  摘要模型 API Key。未配置时，如果允许规则兜底，就会退回规则摘要并在结果里标记 `summarySource = rule-fallback`。
- `REPO_SUMMARY_MODEL`
  模型名，默认 `gpt-4o-mini`。
- `REPO_SUMMARY_BASE_URL`
  OpenAI 兼容接口根地址，默认 `https://api.openai.com/v1`。
- `REPO_SUMMARY_ALLOW_RULE_FALLBACK`
  是否允许模型失败时退回规则版，默认 `true`。

如果你已经在环境里配置了 `OPENAI_API_KEY`、`OPENAI_MODEL` 或 `OPENAI_BASE_URL`，摘要函数也会自动复用它们。

## Trending Feed

`syncGithubRepos` 现在支持优先从一个静态 JSON feed 读取榜单，而不是在微信云函数里直接抓 `github.com/trending`。

- `TRENDING_FEED_URL`
  推荐配置为：
  `https://cdn.jsdelivr.net/gh/Neumatic1/wechat-miniprogram-codex@main/projects/selected-gitHub-projects/data/trending-feed.json`

仓库里已经提供：

- feed 生成脚本：
  `projects/selected-gitHub-projects/scripts/build-trending-feed.js`
- feed 文件：
  `projects/selected-gitHub-projects/data/trending-feed.json`
- GitHub Actions 工作流：
  `.github/workflows/update-trending-feed.yml`

## Notes

- 微信开发者工具部署云函数时，按单个函数目录上传；不要依赖父目录共享代码自动被打包。
- `syncGithubRepos` 支持通过事件参数覆盖抓取配置：`periods`、`maxRepos`、`dryRun`。
- 微信云函数环境如果直接访问 `github.com/trending` 很容易超时，生产上建议始终走 feed URL。
- `getRankings` / `getRepoDetail` 现在在数据库读取失败时不会再静默回退。前端会拿到 `meta` 字段并显示“当前展示的是 Mock 回退数据”。
- `generateRepoSummaries` 会优先处理当前 `daily / weekly / monthly` 榜单里的仓库，再补其它仓库。
- 大模型摘要链会把来源写回仓库字段：
  `summarySource`
  `summaryGenerationMode`
  `summaryModel`
  `summaryFallbackReason`
  `summaryUpdatedAt`
