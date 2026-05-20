# GitHub 项目精选小程序测试记录

更新日期：2026-05-20

## 本轮验证范围

- `services/repo-service.js`
- `pages/rankings/index.js`
- `pages/detail/index.js`
- `cloudfunctions/getRankings/repo-service.js`
- `cloudfunctions/getRepoDetail/repo-service.js`
- `cloudfunctions/generateRepoSummaries/repo-service.js`

## 已执行检查

1. 运行 `node --check` 校验以上 JavaScript 文件语法，全部通过。
2. 校验以下 JSON 文件可被正常解析：
   `project.config.json`
   `app.json`
   `cloudfunctions/generateRepoSummaries/package.json`
3. 推送前校验当前工作树相关文件可正常提交，并已成功推送到 GitHub。

## 待在微信开发者工具补充的联调

1. 打开榜单页，确认 `meta.source = mock-fallback` 时的提示条能正常显示。
2. 打开详情页，确认云端异常回退时不会静默展示数据。
3. 在云开发控制台配置摘要模型环境变量后，手动调用 `generateRepoSummaries`，确认：
   - `llmCount` 有值
   - `summarySource = llm`
   - 小程序详情页展示中文摘要、亮点、适用场景

## 当前结论

- 本轮本地静态检查通过。
- 真实云端联调尚未完成，因此“可观测回退提示”和“大模型摘要生成”仍需要你在微信开发者工具与云开发控制台完成最终验收。
