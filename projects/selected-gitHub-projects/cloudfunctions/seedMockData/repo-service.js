const { repositories, rankingUpdatedAt, rankings } = require("./repository-data");

const COLLECTIONS = {
  repositories: "repositories",
  starSnapshots: "star_snapshots",
  rankingSnapshots: "ranking_snapshots"
};

function buildSnapshotId(repoId, capturedAt) {
  return `${repoId}__${capturedAt.replace(/[^0-9]/g, "")}`;
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

  const snapshotWrites = repositories.map((repo) =>
    db.collection(COLLECTIONS.starSnapshots).doc(buildSnapshotId(repo.repoId, now)).set({
      data: {
        repoId: repo.repoId,
        fullName: repo.fullName,
        stars: repo.stars,
        forks: repo.forks,
        capturedAt: now,
        source: "seedMockData"
      }
    })
  );

  await Promise.all([...repositoryWrites, ...snapshotWrites, ...rankingWrites]);

  return {
    seededAt: now,
    repositoryCount: repositories.length,
    snapshotCount: repositories.length,
    rankingCount: Object.keys(rankings).length
  };
}

module.exports = {
  COLLECTIONS,
  seedMockData
};
