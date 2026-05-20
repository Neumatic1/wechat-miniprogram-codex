const { repositories, rankingUpdatedAt, rankings } = require("./repository-data");

const COLLECTIONS = {
  repositories: "repositories",
  rankingSnapshots: "ranking_snapshots"
};

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
  seedMockData
};
