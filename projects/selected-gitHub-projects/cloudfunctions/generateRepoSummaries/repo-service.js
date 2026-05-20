const COLLECTIONS = {
  repositories: "repositories",
  rankingSnapshots: "ranking_snapshots"
};

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
  nextjs: "Next.js 应用模板",
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
  platform: "平台化能力",
  devtools: "开发者工具"
};

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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

function buildTitleZh(repo) {
  const category = inferCategory(repo);
  return `${repo.name || repo.fullName}：${category}方向项目`;
}

function buildSummaryZh(repo) {
  const category = inferCategory(repo);
  const languageLabel = getLanguageLabel(repo.language);
  const focusPhrase = buildFocusPhrase(repo);

  return `${repo.fullName} 是一个以 ${languageLabel} 为主的${category}项目，主要关注 ${focusPhrase}。`;
}

function buildWhatItDoes(repo) {
  const description = normalizeText(repo.description);
  const focusPhrase = buildFocusPhrase(repo);

  if (description) {
    return `这个项目主要围绕 ${focusPhrase} 展开。GitHub 原始描述是：${description}`;
  }

  return `这个项目主要围绕 ${focusPhrase} 展开，适合继续结合仓库 README 深入了解。`;
}

function buildHighlights(repo) {
  const highlights = [];
  const languageLabel = getLanguageLabel(repo.language);
  const topicLabels = getTopicLabels(repo.topics);
  const stars = Number(repo.stars) || 0;

  highlights.push(`以 ${languageLabel} 为主要技术栈，便于快速判断技术生态和接入成本。`);

  if (topicLabels.length) {
    highlights.push(`从 topics 看，项目重点覆盖 ${topicLabels.join("、")} 等方向。`);
  } else {
    highlights.push("仓库主题信息较少，建议结合 README 和目录结构判断核心能力。");
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

function buildUseCases(repo) {
  const category = inferCategory(repo);
  const focusPhrase = buildFocusPhrase(repo);
  const useCases = [];

  if (category === "AI") {
    useCases.push("为 AI 产品原型或智能体工作流寻找现成能力底座。");
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

  useCases.push("进入 GitHub 仓库继续查看 README、Issue 和活跃度后再决定是否采用。");

  return useCases.slice(0, 3);
}

function buildSummaryPayload(repo, generatedAt) {
  return {
    titleZh: buildTitleZh(repo),
    summaryZh: buildSummaryZh(repo),
    whatItDoes: buildWhatItDoes(repo),
    highlights: buildHighlights(repo),
    useCases: buildUseCases(repo),
    summarySource: "generateRepoSummaries",
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

async function generateRepoSummaries(db, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 30);
  const force = Boolean(options.force);
  const dryRun = Boolean(options.dryRun);
  const requestedRepoIds = Array.isArray(options.repoIds) ? options.repoIds.filter(Boolean) : [];
  const generatedAt = options.generatedAt || new Date().toISOString();
  const repositories = await fetchAllRepositories(db);
  const rankingRepoIds = requestedRepoIds.length ? requestedRepoIds : await fetchRankingRepoIds(db);
  const sortedRepositories = sortRepositoriesByPriority(repositories, rankingRepoIds);
  const targets = sortedRepositories.filter((repo) => shouldGenerate(repo, force)).slice(0, limit);

  const prepared = targets.map((repo) => ({
    repoId: repo.repoId,
    fullName: repo.fullName,
    payload: buildSummaryPayload(repo, generatedAt)
  }));

  if (!dryRun) {
    await Promise.all(
      prepared.map((item) =>
        db.collection(COLLECTIONS.repositories).doc(item.repoId).update({
          data: item.payload
        })
      )
    );
  }

  return {
    dryRun,
    force,
    generatedAt,
    repositoryCount: repositories.length,
    prioritizedRepoCount: rankingRepoIds.length,
    targetCount: targets.length,
    updatedCount: dryRun ? 0 : prepared.length,
    samples: prepared.slice(0, 3).map((item) => ({
      repoId: item.repoId,
      fullName: item.fullName,
      summaryZh: item.payload.summaryZh
    }))
  };
}

module.exports = {
  COLLECTIONS,
  buildSummaryPayload,
  generateRepoSummaries
};
