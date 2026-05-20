const repositoryMap = {
  "openai/openai-agents-js": {
    repoId: "openai-openai-agents-js",
    fullName: "openai/openai-agents-js",
    owner: "openai",
    name: "openai-agents-js",
    description: "Build production-ready agentic workflows in JavaScript.",
    language: "TypeScript",
    topics: ["agents", "openai", "workflow"],
    stars: 18240,
    forks: 1460,
    openIssues: 57,
    githubUrl: "https://github.com/openai/openai-agents-js",
    pushedAt: "2026-05-19T21:30:00+08:00",
    createdAt: "2025-11-08T12:00:00+08:00",
    updatedAt: "2026-05-20T12:00:00+08:00",
    titleZh: "面向 JavaScript 的生产级 Agent 工作流框架",
    summaryZh: "帮助前端与 Node.js 团队快速搭建可编排、可观测的 AI Agent 工作流。",
    whatItDoes: "提供多 Agent 编排、工具调用、状态管理与运行时集成能力，适合从原型走向生产的 AI 应用。",
    highlights: [
      "支持工具调用、上下文传递与多步骤任务拆解。",
      "偏工程化设计，适合接入 Web 服务和后台任务。",
      "对 JavaScript / TypeScript 团队学习成本较低。"
    ],
    useCases: [
      "构建 AI 助手或自动化工作流。",
      "为 SaaS 产品增加可组合的智能操作层。",
      "做多工具联动的开发者效率工具。"
    ]
  },
  "modelcontextprotocol/servers": {
    repoId: "modelcontextprotocol-servers",
    fullName: "modelcontextprotocol/servers",
    owner: "modelcontextprotocol",
    name: "servers",
    description: "Reference servers and adapters for Model Context Protocol.",
    language: "Python",
    topics: ["mcp", "agent", "tooling"],
    stars: 12460,
    forks: 980,
    openIssues: 42,
    githubUrl: "https://github.com/modelcontextprotocol/servers",
    pushedAt: "2026-05-20T08:10:00+08:00",
    createdAt: "2025-09-15T10:00:00+08:00",
    updatedAt: "2026-05-20T12:00:00+08:00",
    titleZh: "MCP 服务端实现与适配器集合",
    summaryZh: "集中展示多种 MCP 服务端实现方式，方便团队快速把本地工具、数据库和业务系统接给模型。",
    whatItDoes: "提供一批可复用的参考实现，帮助开发者理解如何把外部能力以 MCP 形式暴露给大模型应用。",
    highlights: [
      "覆盖多种系统接入范式，适合做二次开发。",
      "能帮助团队建立统一的工具协议层。",
      "与 Agent 场景结合紧密，学习价值很高。"
    ],
    useCases: [
      "构建内部工具桥接层。",
      "给 AI 编程或办公助手接入企业系统。",
      "研究 MCP 的实现细节和最佳实践。"
    ]
  },
  "rustfs/rustfs": {
    repoId: "rustfs-rustfs",
    fullName: "rustfs/rustfs",
    owner: "rustfs",
    name: "rustfs",
    description: "A high-performance distributed object storage system written in Rust.",
    language: "Rust",
    topics: ["storage", "distributed-systems", "rust"],
    stars: 9830,
    forks: 552,
    openIssues: 21,
    githubUrl: "https://github.com/rustfs/rustfs",
    pushedAt: "2026-05-19T18:20:00+08:00",
    createdAt: "2025-02-03T09:00:00+08:00",
    updatedAt: "2026-05-20T12:00:00+08:00",
    titleZh: "Rust 实现的分布式对象存储系统",
    summaryZh: "面向高性能与云原生场景的对象存储项目，适合关注基础设施演进的工程团队。",
    whatItDoes: "尝试用 Rust 构建具备可扩展性和高吞吐特性的分布式对象存储，服务于大规模文件与归档场景。",
    highlights: [
      "定位明确，聚焦云存储基础设施能力。",
      "Rust 技术栈带来性能和内存安全优势。",
      "适合作为分布式系统学习样本。"
    ],
    useCases: [
      "学习对象存储与分布式系统设计。",
      "调研新一代存储基础设施项目。",
      "评估 Rust 在服务端基础设施中的落地方式。"
    ]
  },
  "cloudwego/eino": {
    repoId: "cloudwego-eino",
    fullName: "cloudwego/eino",
    owner: "cloudwego",
    name: "eino",
    description: "LLM application development framework from CloudWeGo.",
    language: "Go",
    topics: ["llm", "go", "framework"],
    stars: 11420,
    forks: 860,
    openIssues: 63,
    githubUrl: "https://github.com/cloudwego/eino",
    pushedAt: "2026-05-20T09:50:00+08:00",
    createdAt: "2025-08-25T14:00:00+08:00",
    updatedAt: "2026-05-20T12:00:00+08:00",
    titleZh: "面向 Go 团队的 LLM 应用开发框架",
    summaryZh: "帮助 Go 团队更系统地构建模型调用、链路编排和评测能力，适合企业级 AI 服务开发。",
    whatItDoes: "提供模型调用封装、流程编排、上下文管理与扩展点，使 Go 在 AI 服务端的工程化体验更完整。",
    highlights: [
      "对 Go 后端团队非常友好。",
      "强调工程化与生产服务集成。",
      "适合作为企业内部 AI 平台的技术底座参考。"
    ],
    useCases: [
      "给已有 Go 服务增加 AI 能力。",
      "搭建企业级 LLM 编排层。",
      "研究 AI 服务框架在 Go 生态的形态。"
    ]
  },
  "anthropics/claude-code-sdk": {
    repoId: "anthropics-claude-code-sdk",
    fullName: "anthropics/claude-code-sdk",
    owner: "anthropics",
    name: "claude-code-sdk",
    description: "SDK for building coding experiences on top of Claude Code.",
    language: "TypeScript",
    topics: ["ai-coding", "sdk", "typescript"],
    stars: 7380,
    forks: 404,
    openIssues: 29,
    githubUrl: "https://github.com/anthropics/claude-code-sdk",
    pushedAt: "2026-05-19T20:05:00+08:00",
    createdAt: "2026-01-12T11:00:00+08:00",
    updatedAt: "2026-05-20T12:00:00+08:00",
    titleZh: "围绕 Claude Code 构建编码体验的 SDK",
    summaryZh: "为代码解释、自动修复和开发者工作流提供统一接入层，适合做 IDE 插件或代码助手。",
    whatItDoes: "让开发者在自有产品里嵌入代码生成、分析与修复体验，并保留更细粒度的工作流控制。",
    highlights: [
      "面向真实开发场景，产品方向明确。",
      "更适合做二次集成而不是简单调用模型。",
      "适合评估 AI Coding 产品的能力边界。"
    ],
    useCases: [
      "构建 IDE 或代码平台插件。",
      "做内部代码助手与代码审查工具。",
      "研究 AI Coding SDK 的产品能力设计。"
    ]
  },
  "vercel/ai-chatbot": {
    repoId: "vercel-ai-chatbot",
    fullName: "vercel/ai-chatbot",
    owner: "vercel",
    name: "ai-chatbot",
    description: "Full-featured, hackable Next.js AI chatbot template.",
    language: "TypeScript",
    topics: ["nextjs", "ai", "template"],
    stars: 15600,
    forks: 2210,
    openIssues: 35,
    githubUrl: "https://github.com/vercel/ai-chatbot",
    pushedAt: "2026-05-20T07:45:00+08:00",
    createdAt: "2024-12-01T16:00:00+08:00",
    updatedAt: "2026-05-20T12:00:00+08:00",
    titleZh: "可直接改造的 Next.js AI 聊天机器人模板",
    summaryZh: "提供完整的前后端样板和对话体验，适合需要快速上线 AI 产品原型的团队。",
    whatItDoes: "基于 Next.js 和 AI SDK 提供开箱即用的聊天产品模板，包含 UI、流式响应和部署友好的工程结构。",
    highlights: [
      "原型到上线路径清晰。",
      "前端体验与工程结构都比较完整。",
      "适合作为 AI 产品 MVP 的起点。"
    ],
    useCases: [
      "快速验证 AI 产品想法。",
      "学习对话式产品的前后端组合方式。",
      "搭建内部知识助手或客服机器人。"
    ]
  },
  "langgenius/dify": {
    repoId: "langgenius-dify",
    fullName: "langgenius/dify",
    owner: "langgenius",
    name: "dify",
    description: "Open-source platform for building AI-native applications.",
    language: "TypeScript",
    topics: ["llm", "platform", "workflow"],
    stars: 72100,
    forks: 10500,
    openIssues: 418,
    githubUrl: "https://github.com/langgenius/dify",
    pushedAt: "2026-05-20T10:15:00+08:00",
    createdAt: "2023-04-18T11:00:00+08:00",
    updatedAt: "2026-05-20T12:00:00+08:00",
    titleZh: "开源的 AI 原生应用开发平台",
    summaryZh: "把工作流、数据集、模型接入和运营后台整合在一起，适合快速搭建企业级 AI 应用。",
    whatItDoes: "提供从 Prompt 编排到知识库、应用配置、调试和发布的完整平台能力，帮助团队更快交付 AI 产品。",
    highlights: [
      "平台能力完整，适合多角色协作。",
      "工作流与知识库场景支持成熟。",
      "非常适合作为 AI 平台选型参考。"
    ],
    useCases: [
      "搭建企业内部 AI 平台。",
      "快速交付聊天、问答和自动化应用。",
      "验证带知识库的 AI 产品需求。"
    ]
  },
  "all-hands-ai/openhands": {
    repoId: "all-hands-ai-openhands",
    fullName: "all-hands-ai/openhands",
    owner: "all-hands-ai",
    name: "openhands",
    description: "An open platform for software development agents.",
    language: "Python",
    topics: ["agents", "coding", "automation"],
    stars: 41300,
    forks: 4720,
    openIssues: 266,
    githubUrl: "https://github.com/all-hands-ai/openhands",
    pushedAt: "2026-05-20T06:50:00+08:00",
    createdAt: "2024-03-11T13:00:00+08:00",
    updatedAt: "2026-05-20T12:00:00+08:00",
    titleZh: "面向软件开发智能体的开源平台",
    summaryZh: "聚焦代码修改、任务执行和开发流程自动化，是 AI Coding 方向的重要观察对象。",
    whatItDoes: "把开发任务拆给智能体执行，并连接代码仓库、终端和工具链，让自动化研发流程更接近真实协作。",
    highlights: [
      "场景直接面向真实软件开发流程。",
      "对 Agent 工具调用和任务执行支持丰富。",
      "适合研究 AI Coding 产品形态。"
    ],
    useCases: [
      "研究开发智能体平台。",
      "尝试自动化代码修复和任务执行。",
      "对比不同 AI Coding 框架能力。"
    ]
  },
  "crewAIInc/crewAI": {
    repoId: "crewaiinc-crewai",
    fullName: "crewAIInc/crewAI",
    owner: "crewAIInc",
    name: "crewAI",
    description: "Framework for orchestrating role-playing autonomous AI agents.",
    language: "Python",
    topics: ["agents", "orchestration", "automation"],
    stars: 33800,
    forks: 4310,
    openIssues: 187,
    githubUrl: "https://github.com/crewAIInc/crewAI",
    pushedAt: "2026-05-19T23:40:00+08:00",
    createdAt: "2024-01-21T08:30:00+08:00",
    updatedAt: "2026-05-20T12:00:00+08:00",
    titleZh: "多角色协作式 AI Agent 编排框架",
    summaryZh: "强调角色分工和团队协作式任务执行，适合构建需要多步骤分工的 AI 自动化流程。",
    whatItDoes: "通过角色、目标和任务流设计多 Agent 协作机制，让模型在复杂任务中分工执行。",
    highlights: [
      "多角色协作概念清晰，易于理解。",
      "适合做复杂任务分工实验。",
      "社区讨论热度高，资料丰富。"
    ],
    useCases: [
      "搭建多 Agent 工作流原型。",
      "研究角色化任务分工设计。",
      "为复杂自动化流程设计智能体团队。"
    ]
  },
  "apache/seatunnel": {
    repoId: "apache-seatunnel",
    fullName: "apache/seatunnel",
    owner: "apache",
    name: "seatunnel",
    description: "Distributed data integration platform for massive data sync.",
    language: "Java",
    topics: ["data", "etl", "integration"],
    stars: 8900,
    forks: 1580,
    openIssues: 142,
    githubUrl: "https://github.com/apache/seatunnel",
    pushedAt: "2026-05-20T08:45:00+08:00",
    createdAt: "2021-10-12T17:00:00+08:00",
    updatedAt: "2026-05-20T12:00:00+08:00",
    titleZh: "面向海量数据同步的分布式集成平台",
    summaryZh: "覆盖批流一体的数据集成与同步场景，适合关注大数据基础设施和实时同步能力的团队。",
    whatItDoes: "提供统一的数据抽取、转换和同步运行框架，帮助企业连接多种数据源与目标系统。",
    highlights: [
      "数据连接器生态丰富。",
      "适合企业级数据同步场景。",
      "具备较强的工程落地价值。"
    ],
    useCases: [
      "建设企业数据同步平台。",
      "打通离线和实时数据链路。",
      "评估大数据集成基础设施。"
    ]
  },
  "mastra-ai/mastra": {
    repoId: "mastra-ai-mastra",
    fullName: "mastra-ai/mastra",
    owner: "mastra-ai",
    name: "mastra",
    description: "TypeScript framework for AI products, agents, and workflows.",
    language: "TypeScript",
    topics: ["ai", "typescript", "agents"],
    stars: 12750,
    forks: 1120,
    openIssues: 48,
    githubUrl: "https://github.com/mastra-ai/mastra",
    pushedAt: "2026-05-20T11:20:00+08:00",
    createdAt: "2025-03-08T10:20:00+08:00",
    updatedAt: "2026-05-20T12:00:00+08:00",
    titleZh: "面向 AI 产品与工作流的 TypeScript 框架",
    summaryZh: "覆盖 Agent、工作流和产品能力的统一开发框架，适合前端和全栈团队快速试验。",
    whatItDoes: "提供模型接入、流程编排、状态管理和工具扩展能力，帮助 TypeScript 团队更顺手地开发 AI 产品。",
    highlights: [
      "全栈团队上手门槛相对更低。",
      "覆盖从工作流到产品层的多个能力面。",
      "适合作为新一代 AI 应用框架观察样本。"
    ],
    useCases: [
      "快速搭建 AI 产品 MVP。",
      "用 TypeScript 统一前后端 AI 能力开发。",
      "研究工作流与 Agent 框架的中间形态。"
    ]
  }
};

const rankingUpdatedAt = {
  daily: "2026-05-20 12:00",
  weekly: "2026-05-20 08:00",
  monthly: "2026-05-20 08:00"
};

const rankings = {
  daily: [
    { repoId: "openai-openai-agents-js", starGrowth: 1840 },
    { repoId: "modelcontextprotocol-servers", starGrowth: 1325 },
    { repoId: "rustfs-rustfs", starGrowth: 1180 },
    { repoId: "cloudwego-eino", starGrowth: 1090 },
    { repoId: "anthropics-claude-code-sdk", starGrowth: 980 },
    { repoId: "vercel-ai-chatbot", starGrowth: 920 },
    { repoId: "langgenius-dify", starGrowth: 880 },
    { repoId: "all-hands-ai-openhands", starGrowth: 820 },
    { repoId: "crewaiinc-crewai", starGrowth: 790 },
    { repoId: "mastra-ai-mastra", starGrowth: 730 }
  ],
  weekly: [
    { repoId: "cloudwego-eino", starGrowth: 4020 },
    { repoId: "vercel-ai-chatbot", starGrowth: 3550 },
    { repoId: "modelcontextprotocol-servers", starGrowth: 3180 },
    { repoId: "openai-openai-agents-js", starGrowth: 2960 },
    { repoId: "langgenius-dify", starGrowth: 2820 },
    { repoId: "all-hands-ai-openhands", starGrowth: 2710 },
    { repoId: "crewaiinc-crewai", starGrowth: 2430 },
    { repoId: "mastra-ai-mastra", starGrowth: 2190 },
    { repoId: "apache-seatunnel", starGrowth: 1870 },
    { repoId: "rustfs-rustfs", starGrowth: 1760 }
  ],
  monthly: [
    { repoId: "vercel-ai-chatbot", starGrowth: 9120 },
    { repoId: "cloudwego-eino", starGrowth: 8450 },
    { repoId: "anthropics-claude-code-sdk", starGrowth: 7310 },
    { repoId: "langgenius-dify", starGrowth: 6880 },
    { repoId: "all-hands-ai-openhands", starGrowth: 6550 },
    { repoId: "openai-openai-agents-js", starGrowth: 6210 },
    { repoId: "modelcontextprotocol-servers", starGrowth: 5940 },
    { repoId: "crewaiinc-crewai", starGrowth: 5520 },
    { repoId: "mastra-ai-mastra", starGrowth: 4980 },
    { repoId: "apache-seatunnel", starGrowth: 4310 }
  ]
};

module.exports = {
  repositoryMap,
  rankingUpdatedAt,
  rankings
};
