# Cloud Functions

当前项目的云函数分成三段：

- `seedMockData`
  初始化演示数据，快速打通数据库读链路
- `syncGithubRepos`
  从 GitHub API 抓取候选仓库，写入 `repositories` 和 `star_snapshots`
- `calculateRankings`
  基于仓库信息和 star 快照计算 `daily` / `weekly` / `monthly` 榜单，写入 `ranking_snapshots`
- `getRankings`
  给小程序榜单页提供榜单数据
- `getRepoDetail`
  给小程序详情页提供项目详情数据

## Collections

- `repositories`
  仓库主数据，文档 ID 使用 `repoId`
- `star_snapshots`
  仓库 star 快照，文档 ID 形如 `repoId__timestamp`
- `ranking_snapshots`
  榜单结果，文档 ID 固定为 `daily`、`weekly`、`monthly`

## Deploy Order

1. 部署 `seedMockData`
2. 手动调用一次 `seedMockData`
3. 部署 `getRankings` 和 `getRepoDetail`
4. 小程序前端验证已经能从数据库读取演示数据
5. 在云函数环境变量中配置 `GITHUB_TOKEN` 或 `GH_TOKEN`
6. 部署 `syncGithubRepos`
7. 手动调用一次 `syncGithubRepos`
8. 部署 `calculateRankings`
9. 手动调用一次 `calculateRankings`
10. 回到小程序前端验证榜单和详情已经开始使用真实同步数据

## Notes

- 微信开发者工具部署云函数时，按单个函数目录上传；不要依赖父目录共享代码自动被打包。
- `syncGithubRepos` 支持通过事件参数覆盖默认抓取配置：`queries`、`perPage`、`maxRepos`、`dryRun`。
- 当前详情页已经对缺失的中文摘要、亮点、使用场景做了兜底，所以真实仓库先接入时页面不会直接空白。
- 如果后续要完全摆脱种子数据，下一步建议补 `generateRepoSummaries`，把 `summaryZh`、`whatItDoes`、`highlights`、`useCases` 这条链补齐。
