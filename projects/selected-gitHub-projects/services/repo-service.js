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

function getRankings(period) {
  if (shouldUseMockData()) {
    return getMockRankings(period);
  }

  return callCloudFunction(cloudConfig.functions.getRankings, { period }).then((result) => ({
    ...result,
    items: normalizeRankingItems(result.items, period)
  }));
}

function getRepoDetail(repoId) {
  if (shouldUseMockData()) {
    return getMockRepoDetail(repoId);
  }

  return callCloudFunction(cloudConfig.functions.getRepoDetail, { repoId }).then((result) =>
    normalizeRepoDetail(result)
  );
}

module.exports = {
  getRankings,
  getRepoDetail
};
