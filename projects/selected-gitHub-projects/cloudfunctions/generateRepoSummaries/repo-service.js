const https = require("https");

const COLLECTIONS = {
  repositories: "repositories",
  rankingSnapshots: "ranking_snapshots"
};

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

const LANGUAGE_LABELS = {
  JavaScript: "JavaScript",
  TypeScript: "TypeScript",
  Python: "Python",
  Go: "Go",
  Rust: "Rust",
  Java: "Java",
  Kotlin: "Kotlin",
  Swift: "Swift"
};

const TOPIC_LABELS = {
  agent: "智能体协作",
  agents: "智能体工作流",
  ai: "AI 应用开发",
  llm: "大模型集成",
  workflow: "流程编排",
  tooling: "开发工具链",
  mcp: "模型上下文协议",
  sdk: "开发者 SDK",
  nextjs: "Next.js 模板",
  template: "产品原型搭建",
  chatbot: "对话产品",
  storage: "对象存储",
  "distributed-systems": "分布式系统",
  rust: "Rust 基础设施",
  framework: "应用框架",
  go: "Go 服务开发",
  data: "数据平台",
  etl: "数据同步",
  integration: "系统集成",
  automation: "自动化流程",
  coding: "AI Coding",
  platform: "平台能力",
  devtools: "开发者工具"
};

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function getLanguageLabel(language) {
  return LANGUAGE_LABELS[language] || language || "多语言";
}

function getTopicLabels(topics = []) {
  return topics
    .map((item) => TOPIC_LABELS[item] || "")
    .filter(Boolean)
    .slice(0, 3);
}

function inferCategory(repo) {
  const haystack = `${repo.name || ""} ${repo.description || ""} ${(repo.topics || []).join(" ")}`.toLowerCase();

  if (/agent|llm|openai|chatbot|prompt|ai/.test(haystack)) {
    return "AI";
  }

  if (/storage|database|distributed|infra|platform|kubernetes|cloud/.test(haystack)) {
    return "基础设施";
  }

  if (/sdk|tool|dev|framework|workflow|mcp/.test(haystack)) {
    return "开发工具";
  }

  if (/data|etl|pipeline|integration/.test(haystack)) {
    return "数据工程";
  }

  return "开源工具";
}

function buildFocusPhrase(repo) {
  const topicLabels = getTopicLabels(repo.topics);

  if (topicLabels.length) {
    return topicLabels.join("、");
  }

  const category = inferCategory(repo);

  if (category === "AI") {
    return "AI 应用与工作流";
  }

  if (category === "基础设施") {
    return "基础设施能力建设";
  }

  if (category === "开发工具") {
    return "开发效率与工程能力";
  }

  if (category === "数据工程") {
    return "数据同步与处理";
  }

  return "工程实践";
}

function buildRuleTitleZh(repo) {
  const category = inferCategory(repo);
  return `${repo.name || repo.fullName}：${category}方向项目`;
}

function buildRuleSummaryZh(repo) {
  const category = inferCategory(repo);
  const languageLabel = getLanguageLabel(repo.language);
  const focusPhrase = buildFocusPhrase(repo);

  return `${repo.fullName} 是一个以 ${languageLabel} 为主的 ${category} 项目，重点关注 ${focusPhrase}。`;
}

function buildRuleWhatItDoes(repo) {
  const description = normalizeText(repo.description);
  const focusPhrase = buildFocusPhrase(repo);

  if (description) {
    return `这个项目主要围绕 ${focusPhrase} 展开。GitHub 原始描述是：${description}`;
  }

  return `这个项目主要围绕 ${focusPhrase} 展开，建议结合仓库 README 继续了解核心能力。`;
}

function buildRuleHighlights(repo) {
  const highlights = [];
  const languageLabel = getLanguageLabel(repo.language);
  const topicLabels = getTopicLabels(repo.topics);
  const stars = Number(repo.stars) || 0;

  highlights.push(`以 ${languageLabel} 为主要技术栈，便于快速判断生态与接入成本。`);

  if (topicLabels.length) {
    highlights.push(`从 topics 看，项目重点覆盖 ${topicLabels.join("、")} 等方向。`);
  } else {
    highlights.push("仓库主题信息较少，建议结合 README 与目录结构进一步判断能力边界。");
  }

  if (stars >= 50000) {
    highlights.push("社区关注度很高，适合优先纳入长期跟踪名单。");
  } else if (stars >= 10000) {
    highlights.push("已有较强社区验证，适合做方案调研或技术选型参考。");
  } else {
    highlights.push("处于值得关注的成长区间，适合持续观察后续活跃度。");
  }

  return highlights.slice(0, 3);
}

function buildRuleUseCases(repo) {
  const category = inferCategory(repo);
  const focusPhrase = buildFocusPhrase(repo);
  const useCases = [];

  if (category === "AI") {
    useCases.push("为 AI 产品原型或智能体工作流寻找可复用能力底座。");
    useCases.push(`调研 ${focusPhrase} 相关开源方案，辅助技术选型。`);
  } else if (category === "基础设施") {
    useCases.push("研究基础设施或云原生系统的工程实现思路。");
    useCases.push(`评估 ${focusPhrase} 相关能力是否适合团队现有架构。`);
  } else if (category === "数据工程") {
    useCases.push("调研数据同步、集成或处理链路的现成开源方案。");
    useCases.push(`围绕 ${focusPhrase} 做数据平台能力选型。`);
  } else {
    useCases.push("把它作为同类项目对比样本，辅助技术调研。");
    useCases.push(`围绕 ${focusPhrase} 寻找可复用的开源能力。`);
  }

  useCases.push("进入 GitHub 仓库查看 README、Issue 和活跃度后再决定是否采用。");

  return useCases.slice(0, 3);
}

function buildRuleSummaryPayload(repo, generatedAt, fallbackReason, modelName) {
  return {
    titleZh: buildRuleTitleZh(repo),
    summaryZh: buildRuleSummaryZh(repo),
    whatItDoes: buildRuleWhatItDoes(repo),
    highlights: buildRuleHighlights(repo),
    useCases: buildRuleUseCases(repo),
    summarySource: "rule-fallback",
    summaryGenerationMode: "fallback",
    summaryModel: modelName || "",
    summaryFallbackReason: fallbackReason || "",
    summaryUpdatedAt: generatedAt
  };
}

function shouldGenerate(repo, force) {
  if (force) {
    return true;
  }

  return !repo.summaryZh || !repo.whatItDoes || !Array.isArray(repo.highlights) || !repo.highlights.length;
}

async function fetchAllRepositories(db, batchSize = 100) {
  const items = [];
  let skip = 0;

  while (true) {
    const result = await db.collection(COLLECTIONS.repositories).skip(skip).limit(batchSize).get();
    const currentItems = Array.isArray(result.data) ? result.data : [];
    items.push(...currentItems);

    if (currentItems.length < batchSize) {
      break;
    }

    skip += batchSize;
  }

  return items;
}

async function fetchRankingRepoIds(db) {
  const periods = ["daily", "weekly", "monthly"];
  const repoIds = [];
  const seen = new Set();

  for (const period of periods) {
    try {
      const result = await db.collection(COLLECTIONS.rankingSnapshots).doc(period).get();
      const items = result.data && Array.isArray(result.data.items) ? result.data.items : [];

      items.forEach((item) => {
        if (item && item.repoId && !seen.has(item.repoId)) {
          seen.add(item.repoId);
          repoIds.push(item.repoId);
        }
      });
    } catch (error) {
      // Ignore missing ranking snapshots and fall back to repository scan order.
    }
  }

  return repoIds;
}

function sortRepositoriesByPriority(repositories, priorityRepoIds = []) {
  if (!priorityRepoIds.length) {
    return repositories;
  }

  const priorityIndexMap = priorityRepoIds.reduce((accumulator, repoId, index) => {
    accumulator[repoId] = index;
    return accumulator;
  }, {});

  return [...repositories].sort((left, right) => {
    const leftIndex =
      priorityIndexMap[left.repoId] === undefined ? Number.MAX_SAFE_INTEGER : priorityIndexMap[left.repoId];
    const rightIndex =
      priorityIndexMap[right.repoId] === undefined ? Number.MAX_SAFE_INTEGER : priorityIndexMap[right.repoId];

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return (Number(right.stars) || 0) - (Number(left.stars) || 0);
  });
}

function sanitizeLine(value, fallbackValue) {
  const text = normalizeText(value);
  return text || fallbackValue;
}

function sanitizeList(values, fallbackValues) {
  const list = Array.isArray(values)
    ? values.map((item) => normalizeText(item)).filter(Boolean)
    : [];

  if (list.length >= 2) {
    return list.slice(0, 3);
  }

  return fallbackValues.slice(0, 3);
}

function getSummaryConfig(options = {}) {
  return {
    apiKey:
      options.apiKey ||
      process.env.REPO_SUMMARY_API_KEY ||
      process.env.OPENAI_API_KEY ||
      "",
    baseUrl:
      options.baseUrl ||
      process.env.REPO_SUMMARY_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      DEFAULT_BASE_URL,
    model:
      options.model ||
      process.env.REPO_SUMMARY_MODEL ||
      process.env.OPENAI_MODEL ||
      DEFAULT_MODEL,
    allowRuleFallback: parseBoolean(
      options.allowRuleFallback,
      parseBoolean(process.env.REPO_SUMMARY_ALLOW_RULE_FALLBACK, true)
    )
  };
}

function createRequestError(message, details) {
  const error = new Error(message);
  error.details = details || null;
  return error;
}

function requestJson(url, options, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      let raw = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        raw += chunk;
      });

      response.on("end", () => {
        let parsed;

        try {
          parsed = raw ? JSON.parse(raw) : {};
        } catch (error) {
          reject(createRequestError("模型接口返回了无法解析的 JSON", {
            statusCode: response.statusCode,
            raw: raw.slice(0, 500)
          }));
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(createRequestError("模型接口请求失败", {
            statusCode: response.statusCode,
            response: parsed
          }));
          return;
        }

        resolve(parsed);
      });
    });

    request.on("error", (error) => {
      reject(createRequestError("请求模型接口失败", {
        originalMessage: error.message || String(error)
      }));
    });

    request.write(body);
    request.end();
  });
}

function extractMessageContent(response) {
  const firstChoice = response && Array.isArray(response.choices) ? response.choices[0] : null;
  const message = firstChoice && firstChoice.message ? firstChoice.message : null;
  const content = message ? message.content : "";

  if (Array.isArray(content)) {
    return content
      .map((part) => (part && typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return normalizeText(content);
}

function buildSummaryPrompt(repo) {
  return [
    "请基于下面的 GitHub 仓库信息，生成适合中文读者阅读的结构化摘要。",
    "要求：",
    "1. 输出必须是严格 JSON，不要包含 Markdown 代码块。",
    "2. 语气务实、信息密度高，不要空话套话。",
    "3. `summaryZh` 控制在 1-2 句，适合作为详情页摘要。",
    "4. `whatItDoes` 用 1 段说明项目主要解决什么问题。",
    "5. `highlights` 和 `useCases` 各输出 3 条简洁中文短句。",
    "6. 如果信息不足，请基于仓库描述、主题、语言、star 规模做保守判断，不要编造不存在的能力。",
    "",
    JSON.stringify(
      {
        fullName: repo.fullName,
        name: repo.name,
        description: repo.description,
        language: repo.language,
        topics: repo.topics || [],
        stars: repo.stars,
        forks: repo.forks,
        openIssues: repo.openIssues,
        pushedAt: repo.pushedAt,
        createdAt: repo.createdAt,
        githubUrl: repo.githubUrl
      },
      null,
      2
    )
  ].join("\n");
}

async function generateWithLlm(repo, config, generatedAt) {
  if (!config.apiKey) {
    throw createRequestError("未配置 REPO_SUMMARY_API_KEY 或 OPENAI_API_KEY");
  }

  const endpoint = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const body = JSON.stringify({
    model: config.model,
    temperature: 0.2,
    response_format: {
      type: "json_object"
    },
    messages: [
      {
        role: "system",
        content:
          "你是一名面向中文开发者的 GitHub 项目编辑。请只返回 JSON，对项目做准确、克制、信息密度高的中文总结。"
      },
      {
        role: "user",
        content: buildSummaryPrompt(repo)
      }
    ]
  });

  const response = await requestJson(
    endpoint,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        Authorization: `Bearer ${config.apiKey}`
      }
    },
    body
  );
  const content = extractMessageContent(response);

  if (!content) {
    throw createRequestError("模型返回内容为空", {
      response
    });
  }

  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw createRequestError("模型返回内容不是合法 JSON", {
      content: content.slice(0, 500)
    });
  }

  const ruleFallback = buildRuleSummaryPayload(repo, generatedAt, "", config.model);

  return {
    titleZh: sanitizeLine(parsed.titleZh, ruleFallback.titleZh),
    summaryZh: sanitizeLine(parsed.summaryZh, ruleFallback.summaryZh),
    whatItDoes: sanitizeLine(parsed.whatItDoes, ruleFallback.whatItDoes),
    highlights: sanitizeList(parsed.highlights, ruleFallback.highlights),
    useCases: sanitizeList(parsed.useCases, ruleFallback.useCases),
    summarySource: "llm",
    summaryGenerationMode: "llm",
    summaryModel: config.model,
    summaryFallbackReason: "",
    summaryUpdatedAt: generatedAt
  };
}

async function buildSummaryPayload(repo, config, generatedAt) {
  try {
    const payload = await generateWithLlm(repo, config, generatedAt);
    return {
      payload,
      source: "llm",
      fallbackReason: ""
    };
  } catch (error) {
    if (!config.allowRuleFallback) {
      throw error;
    }

    const fallbackReason = error.message || "模型摘要生成失败";
    return {
      payload: buildRuleSummaryPayload(repo, generatedAt, fallbackReason, config.model),
      source: "rule-fallback",
      fallbackReason
    };
  }
}

async function generateRepoSummaries(db, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const force = Boolean(options.force);
  const dryRun = Boolean(options.dryRun);
  const requestedRepoIds = Array.isArray(options.repoIds) ? options.repoIds.filter(Boolean) : [];
  const generatedAt = options.generatedAt || new Date().toISOString();
  const repositories = await fetchAllRepositories(db);
  const rankingRepoIds = requestedRepoIds.length ? requestedRepoIds : await fetchRankingRepoIds(db);
  const sortedRepositories = sortRepositoriesByPriority(repositories, rankingRepoIds);
  const targets = sortedRepositories.filter((repo) => shouldGenerate(repo, force)).slice(0, limit);
  const config = getSummaryConfig(options);
  const prepared = [];

  for (const repo of targets) {
    const generated = await buildSummaryPayload(repo, config, generatedAt);
    prepared.push({
      repoId: repo.repoId,
      fullName: repo.fullName,
      payload: generated.payload,
      source: generated.source,
      fallbackReason: generated.fallbackReason
    });
  }

  if (!dryRun) {
    await Promise.all(
      prepared.map((item) =>
        db.collection(COLLECTIONS.repositories).doc(item.repoId).update({
          data: item.payload
        })
      )
    );
  }

  const llmCount = prepared.filter((item) => item.source === "llm").length;
  const fallbackCount = prepared.filter((item) => item.source === "rule-fallback").length;

  return {
    dryRun,
    force,
    generatedAt,
    repositoryCount: repositories.length,
    prioritizedRepoCount: rankingRepoIds.length,
    targetCount: targets.length,
    updatedCount: dryRun ? 0 : prepared.length,
    model: config.model,
    usedLlm: Boolean(config.apiKey),
    allowRuleFallback: config.allowRuleFallback,
    llmCount,
    fallbackCount,
    samples: prepared.slice(0, 5).map((item) => ({
      repoId: item.repoId,
      fullName: item.fullName,
      summarySource: item.payload.summarySource,
      summaryZh: item.payload.summaryZh,
      fallbackReason: item.fallbackReason
    }))
  };
}

module.exports = {
  COLLECTIONS,
  buildRuleSummaryPayload,
  generateRepoSummaries
};
