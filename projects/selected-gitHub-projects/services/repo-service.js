const {
  formatCompactNumber,
  formatGrowth,
  withLanguageFallback
} = require("../utils/format");
const cloudConfig = require("../config/cloud");
const mockData = require("../utils/mock-data");

const MAX_RANKING_ITEMS = 10;
const mockRepositoryList = Object.values(mockData.repositoryMap || {});
const mockRepositoryById = mockRepositoryList.reduce((accumulator, repo) => {
  accumulator[repo.repoId] = repo;
  return accumulator;
}, {});

function shouldUseMockData() {
  return !cloudConfig.useCloud;
}

function findMockRepo(repoIdentifier) {
  return (
    mockRepositoryById[repoIdentifier] ||
    mockData.repositoryMap[repoIdentifier] ||
    null
  );
}

function withDisplayFields(repo, extraFields) {
  if (!repo) {
    throw new Error("仓库数据缺失，无法补充展示字段");
  }

  return Object.assign({}, repo, extraFields, {
    languageLabel: withLanguageFallback(repo.language),
    displayStars: formatCompactNumber(repo.stars),
    displayForks: formatCompactNumber(repo.forks),
    displayGrowth: formatGrowth(extraFields.starGrowth || 0)
  });
}

function normalizeRankingItems(items, period) {
  return (items || []).slice(0, MAX_RANKING_ITEMS).map((item, index) =>
    withDisplayFields(item, {
      rank: item.rank || index + 1,
      rankType: item.rankType || period,
      starGrowth: item.starGrowth || 0
    })
  );
}

function normalizeRepoDetail(repo) {
  return withDisplayFields(repo, {
    starGrowth: repo.starGrowth || 0,
    rankingInfo: repo.rankingInfo || {}
  });
}

function getMockRankings(period) {
  const rankingList = (mockData.rankings[period] || []).slice(0, MAX_RANKING_ITEMS);
  const items = rankingList.map((item) => {
    const repo = findMockRepo(item.repoId);

    if (!repo) {
      throw new Error(`榜单 mock 数据缺少仓库定义: ${item.repoId}`);
    }

    return Object.assign({}, repo, {
      rankType: period,
      starGrowth: item.starGrowth
    });
  });

  return Promise.resolve({
    updatedAt: mockData.rankingUpdatedAt[period],
    items: normalizeRankingItems(items, period)
  });
}

function getMockRepoDetail(repoId) {
  const repo = findMockRepo(repoId);

  if (!repo) {
    return Promise.reject(new Error("项目不存在"));
  }

  const rankingInfo = Object.keys(mockData.rankings).reduce((accumulator, period) => {
    const record = (mockData.rankings[period] || []).find((item) => item.repoId === repoId);

    if (record) {
      accumulator[period] = record.starGrowth;
    }

    return accumulator;
  }, {});

  return Promise.resolve(
    normalizeRepoDetail(Object.assign({}, repo, {
      starGrowth: rankingInfo.daily || rankingInfo.weekly || rankingInfo.monthly || 0,
      rankingInfo
    }))
  );
}

function callCloudFunction(name, data) {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      reject(new Error("当前环境未启用云开发"));
      return;
    }

    wx.cloud.callFunction({
      name,
      data,
      success: ({ result }) => resolve(result),
      fail: reject
    });
  });
}

function normalizeMeta(meta, fallbackMeta) {
  const defaults = Object.assign(
    {
      source: "cloud",
      usedFallback: false,
      reasonCode: "",
      reasonMessage: "",
      observedAt: "",
      error: null
    },
    fallbackMeta || {}
  );

  return Object.assign(defaults, meta || {});
}

function buildObservableNotice(meta) {
  if (!meta || meta.source === "cloud-db") {
    return {
      text: "",
      tone: ""
    };
  }

  if (meta.source === "local-mock") {
    return {
      text: "当前处于本地 Mock 模式，页面还没有读取云端数据。",
      tone: "info"
    };
  }

  if (meta.source === "mock-fallback") {
    const reason = meta.reasonMessage ? `原因：${meta.reasonMessage}` : "原因：云端链路不可用";
    return {
      text: `当前展示的是 Mock 回退数据。${reason}`,
      tone: "warning"
    };
  }

  return {
    text: meta.reasonMessage || "",
    tone: meta.usedFallback ? "warning" : "info"
  };
}

function attachObservableFields(payload, metaDefaults) {
  const meta = normalizeMeta(payload && payload.meta, metaDefaults);
  const notice = buildObservableNotice(meta);

  return Object.assign({}, payload, {
    meta,
    observableNotice: notice.text,
    observableNoticeTone: notice.tone
  });
}

function normalizeRankingResponse(result, period, metaDefaults) {
  const payload = attachObservableFields(result || {}, metaDefaults);

  return Object.assign({}, payload, {
    updatedAt: payload.updatedAt || "",
    items: normalizeRankingItems(payload.items || [], period)
  });
}

function normalizeRepoResponse(result, metaDefaults) {
  const payload = attachObservableFields(result || {}, metaDefaults);
  return normalizeRepoDetail(payload);
}

function getRankings(period) {
  if (shouldUseMockData()) {
    return getMockRankings(period).then((result) =>
      normalizeRankingResponse(result, period, {
        source: "local-mock",
        usedFallback: false,
        reasonCode: "CLOUD_DISABLED",
        reasonMessage: "config/cloud.js 当前配置为本地 mock 模式"
      })
    );
  }

  return callCloudFunction(cloudConfig.functions.getRankings, { period }).then((result) =>
    normalizeRankingResponse(result, period, {
      source: "cloud-db"
    })
  );
}

function getRepoDetail(repoId) {
  if (shouldUseMockData()) {
    return getMockRepoDetail(repoId).then((repo) =>
      normalizeRepoResponse(repo, {
        source: "local-mock",
        usedFallback: false,
        reasonCode: "CLOUD_DISABLED",
        reasonMessage: "config/cloud.js 当前配置为本地 mock 模式"
      })
    );
  }

  return callCloudFunction(cloudConfig.functions.getRepoDetail, { repoId }).then((result) =>
    normalizeRepoResponse(result, {
      source: "cloud-db"
    })
  );
}

module.exports = {
  getRankings,
  getRepoDetail
};
