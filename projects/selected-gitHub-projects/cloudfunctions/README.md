# Cloud Functions

当前项目的云函数按数据链路分成 6 个环节：

- `seedMockData`
  初始化演示数据，快速打通数据库读链路。
- `syncGithubRepos`
  从 GitHub API 抓取候选仓库，写入 `repositories` 和 `star_snapshots`。
- `calculateRankings`
  基于仓库信息和 star 快照计算 `daily` / `weekly` / `monthly` 榜单，写入 `ranking_snapshots`。
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
7. 先用 `{"dryRun": true, "perPage": 3, "maxRepos": 3}` 调用一次 `syncGithubRepos`
8. 部署 `calculateRankings`
9. 手动调用一次 `calculateRankings`
10. 在云函数环境变量中配置摘要链：
    `REPO_SUMMARY_API_KEY`
    `REPO_SUMMARY_MODEL`
    `REPO_SUMMARY_BASE_URL`
11. 部署 `generateRepoSummaries`
12. 先用小批量参数手动调用一次 `generateRepoSummaries`
13. 回到小程序前端验证榜单页和详情页是否开始显示真实同步数据和中文摘要

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

## Notes

- 微信开发者工具部署云函数时，按单个函数目录上传；不要依赖父目录共享代码自动被打包。
- `syncGithubRepos` 支持通过事件参数覆盖默认抓取配置：`queries`、`perPage`、`maxRepos`、`dryRun`。
- `syncGithubRepos` 第一次联调建议把云函数超时时间调到 `10s` 或更高；默认 `3s` 很容易在访问 GitHub API 和写数据库时超时。
- `getRankings` / `getRepoDetail` 现在在数据库读取失败时不会再静默回退。前端会拿到 `meta` 字段并显示“当前展示的是 Mock 回退数据”。
- `generateRepoSummaries` 会优先处理当前 `daily / weekly / monthly` 榜单里的仓库，再补其它仓库。
- 大模型摘要链会把来源写回仓库字段：
  `summarySource`
  `summaryGenerationMode`
  `summaryModel`
  `summaryFallbackReason`
  `summaryUpdatedAt`
