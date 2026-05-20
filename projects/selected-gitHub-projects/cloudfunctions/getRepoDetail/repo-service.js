const { repositories, rankingUpdatedAt, rankings } = require("./repository-data");

const COLLECTIONS = {
  repositories: "repositories",
  rankingSnapshots: "ranking_snapshots"
};

const repositoryMap = repositories.reduce((accumulator, repo) => {
  accumulator[repo.repoId] = repo;
  accumulator[repo.fullName] = repo;
  return accumulator;
}, {});

function createObservableError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  error.details = details || null;
  return error;
}

function serializeError(error) {
  if (!error) {
    return null;
  }

  return {
    name: error.name || "Error",
    code: error.code || "",
    message: error.message || String(error),
    details: error.details || null
  };
}

function buildMeta(options) {
  return {
    source: options.source,
    usedFallback: Boolean(options.usedFallback),
    reasonCode: options.reasonCode || "",
    reasonMessage: options.reasonMessage || "",
    observedAt: options.observedAt || new Date().toISOString(),
    error: serializeError(options.error)
  };
}

function withMeta(payload, meta) {
  return Object.assign({}, payload, { meta });
}

function getMockRankings(period) {
  const rankingList = rankings[period] || [];
  const items = rankingList
    .map((item, index) => {
      const repo = repositoryMap[item.repoId];

      if (!repo) {
        return null;
      }

      return Object.assign({}, repo, {
        rank: index + 1,
        rankType: period,
        starGrowth: item.starGrowth
      });
    })
    .filter(Boolean);

  return {
    updatedAt: rankingUpdatedAt[period] || "",
    items
  };
}

function getMockRepoDetail(repoId) {
  const repo = repositoryMap[repoId];

  if (!repo) {
    throw createObservableError("MOCK_REPO_NOT_FOUND", "项目不存在", { repoId });
  }

  const rankingInfo = Object.keys(rankings).reduce((accumulator, period) => {
    const record = (rankings[period] || []).find((item) => item.repoId === repoId);

    if (record) {
      accumulator[period] = record.starGrowth;
    }

    return accumulator;
  }, {});

  return Object.assign({}, repo, {
    starGrowth: rankingInfo.daily || rankingInfo.weekly || rankingInfo.monthly || 0,
    rankingInfo
  });
}

async function getRankingsFromDb(period, db) {
  let rankingDoc;

  try {
    rankingDoc = await db.collection(COLLECTIONS.rankingSnapshots).doc(period).get();
  } catch (error) {
    throw createObservableError("RANKING_DOC_READ_FAILED", `读取 ${period} 榜单快照失败`, {
      period,
      originalMessage: error.message || String(error)
    });
  }

  const snapshot = rankingDoc.data;

  if (!snapshot || !Array.isArray(snapshot.items) || !snapshot.items.length) {
    throw createObservableError("RANKING_SNAPSHOT_EMPTY", `数据库中缺少 ${period} 榜单数据`, {
      period
    });
  }

  const repoIds = snapshot.items.map((item) => item.repoId).filter(Boolean);
  const repoFetches = repoIds.map((repoId) =>
    db
      .collection(COLLECTIONS.repositories)
      .doc(repoId)
      .get()
      .then((result) => result.data)
      .catch((error) => {
        throw createObservableError("RANKING_REPO_READ_FAILED", `读取仓库详情失败: ${repoId}`, {
          repoId,
          originalMessage: error.message || String(error)
        });
      })
  );

  const repoList = await Promise.all(repoFetches);
  const repoById = repoList.filter(Boolean).reduce((accumulator, repo) => {
    accumulator[repo.repoId] = repo;
    return accumulator;
  }, {});

  const missingRepoIds = repoIds.filter((repoId) => !repoById[repoId]);

  if (missingRepoIds.length) {
    throw createObservableError("RANKING_REPO_MISSING", "榜单关联的仓库详情不完整", {
      period,
      missingRepoIds
    });
  }

  const items = snapshot.items.map((item, index) =>
    Object.assign({}, repoById[item.repoId], {
      rank: item.rank || index + 1,
      rankType: snapshot.rankType || period,
      starGrowth: item.starGrowth || 0
    })
  );

  return {
    updatedAt: snapshot.updatedAt || "",
    items
  };
}

async function getRepoDetailFromDb(repoId, db) {
  let repoResult;

  try {
    repoResult = await db.collection(COLLECTIONS.repositories).doc(repoId).get();
  } catch (error) {
    throw createObservableError("REPO_DETAIL_READ_FAILED", `读取仓库详情失败: ${repoId}`, {
      repoId,
      originalMessage: error.message || String(error)
    });
  }

  const repo = repoResult.data;

  if (!repo) {
    throw createObservableError("REPO_DETAIL_NOT_FOUND", "项目不存在", { repoId });
  }

  const rankingInfo = {};
  const periods = Object.keys(rankings);

  await Promise.all(
    periods.map(async (period) => {
      try {
        const rankingResult = await db.collection(COLLECTIONS.rankingSnapshots).doc(period).get();
        const rankingDoc = rankingResult.data;
        const record =
          rankingDoc && Array.isArray(rankingDoc.items)
            ? rankingDoc.items.find((item) => item.repoId === repoId)
            : null;

        if (record) {
          rankingInfo[period] = record.starGrowth || 0;
        }
      } catch (error) {
        throw createObservableError("REPO_RANKING_READ_FAILED", `读取 ${period} 榜单失败`, {
          period,
          repoId,
          originalMessage: error.message || String(error)
        });
      }
    })
  );

  return Object.assign({}, repo, {
    starGrowth: rankingInfo.daily || rankingInfo.weekly || rankingInfo.monthly || 0,
    rankingInfo
  });
}

async function getRankings(period, db) {
  if (!db) {
    return withMeta(getMockRankings(period), buildMeta({
      source: "local-mock",
      usedFallback: false,
      reasonCode: "DB_UNAVAILABLE",
      reasonMessage: "云函数未拿到数据库实例"
    }));
  }

  try {
    const result = await getRankingsFromDb(period, db);
    return withMeta(result, buildMeta({
      source: "cloud-db",
      observedAt: result.updatedAt || new Date().toISOString()
    }));
  } catch (error) {
    return withMeta(getMockRankings(period), buildMeta({
      source: "mock-fallback",
      usedFallback: true,
      reasonCode: error.code || "CLOUD_READ_FAILED",
      reasonMessage: error.message || "读取云端榜单失败",
      error
    }));
  }
}

async function getRepoDetail(repoId, db) {
  if (!db) {
    return withMeta(getMockRepoDetail(repoId), buildMeta({
      source: "local-mock",
      usedFallback: false,
      reasonCode: "DB_UNAVAILABLE",
      reasonMessage: "云函数未拿到数据库实例"
    }));
  }

  try {
    const result = await getRepoDetailFromDb(repoId, db);
    return withMeta(result, buildMeta({
      source: "cloud-db",
      observedAt: result.updatedAt || result.lastSyncedAt || new Date().toISOString()
    }));
  } catch (error) {
    try {
      return withMeta(getMockRepoDetail(repoId), buildMeta({
        source: "mock-fallback",
        usedFallback: true,
        reasonCode: error.code || "CLOUD_READ_FAILED",
        reasonMessage: error.message || "读取云端详情失败",
        error
      }));
    } catch (mockError) {
      throw createObservableError("REPO_DETAIL_UNAVAILABLE", "云端详情读取失败，且本地 mock 中也没有该项目", {
        repoId,
        cloudError: serializeError(error),
        mockError: serializeError(mockError)
      });
    }
  }
}

async function seedMockData(db, options = {}) {
  const now = options.seededAt || new Date().toISOString();

  const repositoryWrites = repositories.map((repo) =>
    db.collection(COLLECTIONS.repositories).doc(repo.repoId).set({
      data: Object.assign({}, repo, {
        updatedAt: now
      })
    })
  );

  const rankingWrites = Object.keys(rankings).map((period) =>
    db.collection(COLLECTIONS.rankingSnapshots).doc(period).set({
      data: {
        rankType: period,
        updatedAt: rankingUpdatedAt[period] || now,
        source: "seedMockData",
        items: (rankings[period] || []).map((item, index) => ({
          repoId: item.repoId,
          rank: index + 1,
          starGrowth: item.starGrowth
        }))
      }
    })
  );

  await Promise.all([...repositoryWrites, ...rankingWrites]);

  return {
    seededAt: now,
    repositoryCount: repositories.length,
    rankingCount: Object.keys(rankings).length
  };
}

module.exports = {
  COLLECTIONS,
  getMockRankings,
  getMockRepoDetail,
  getRankings,
  getRepoDetail,
  seedMockData
};
