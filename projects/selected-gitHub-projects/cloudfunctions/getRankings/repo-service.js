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
    throw new Error("项目不存在");
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
  const rankingDoc = await db.collection(COLLECTIONS.rankingSnapshots).doc(period).get();
  const snapshot = rankingDoc.data;

  if (!snapshot || !Array.isArray(snapshot.items) || !snapshot.items.length) {
    throw new Error(`数据库中缺少 ${period} 榜单数据`);
  }

  const repoIds = snapshot.items.map((item) => item.repoId).filter(Boolean);
  const repoFetches = repoIds.map((repoId) =>
    db
      .collection(COLLECTIONS.repositories)
      .doc(repoId)
      .get()
      .then((result) => result.data)
      .catch(() => null)
  );

  const repoList = await Promise.all(repoFetches);
  const repoById = repoList.filter(Boolean).reduce((accumulator, repo) => {
    accumulator[repo.repoId] = repo;
    return accumulator;
  }, {});

  const items = snapshot.items
    .map((item, index) => {
      const repo = repoById[item.repoId];

      if (!repo) {
        return null;
      }

      return Object.assign({}, repo, {
        rank: item.rank || index + 1,
        rankType: snapshot.rankType || period,
        starGrowth: item.starGrowth || 0
      });
    })
    .filter(Boolean);

  return {
    updatedAt: snapshot.updatedAt || "",
    items
  };
}

async function getRepoDetailFromDb(repoId, db) {
  const repoResult = await db.collection(COLLECTIONS.repositories).doc(repoId).get();
  const repo = repoResult.data;

  if (!repo) {
    throw new Error("项目不存在");
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
        // Ignore missing ranking docs and fall back to whatever periods are available.
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
    return getMockRankings(period);
  }

  try {
    return await getRankingsFromDb(period, db);
  } catch (error) {
    return getMockRankings(period);
  }
}

async function getRepoDetail(repoId, db) {
  if (!db) {
    return getMockRepoDetail(repoId);
  }

  try {
    return await getRepoDetailFromDb(repoId, db);
  } catch (error) {
    return getMockRepoDetail(repoId);
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
