const COLLECTIONS = {
  repositories: "repositories",
  starSnapshots: "star_snapshots",
  rankingSnapshots: "ranking_snapshots"
};

const PERIODS = {
  daily: 1,
  weekly: 7,
  monthly: 30
};

async function fetchAllDocuments(db, collectionName, batchSize = 100) {
  const items = [];
  let skip = 0;

  while (true) {
    const result = await db.collection(collectionName).skip(skip).limit(batchSize).get();
    const currentItems = Array.isArray(result.data) ? result.data : [];
    items.push(...currentItems);

    if (currentItems.length < batchSize) {
      break;
    }

    skip += batchSize;
  }

  return items;
}

function toTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function pickBaselineSnapshot(snapshots, cutoffTimestamp) {
  const ordered = [...snapshots].sort(
    (left, right) => toTimestamp(left.capturedAt) - toTimestamp(right.capturedAt)
  );
  const historical = ordered.filter((item) => toTimestamp(item.capturedAt) <= cutoffTimestamp);

  if (historical.length) {
    return historical[historical.length - 1];
  }

  return ordered[0] || null;
}

function buildRankingItems(period, repositories, snapshotGroups, maxItems) {
  const cutoffTimestamp = Date.now() - PERIODS[period] * 24 * 60 * 60 * 1000;

  return repositories
    .map((repo) => {
      const repoSnapshots = snapshotGroups[repo.repoId] || [];
      const baseline = pickBaselineSnapshot(repoSnapshots, cutoffTimestamp);
      const currentStars = Number(repo.stars) || 0;
      const baselineStars = baseline ? Number(baseline.stars) || 0 : currentStars;
      const starGrowth = Math.max(currentStars - baselineStars, 0);

      return {
        repoId: repo.repoId,
        stars: currentStars,
        starGrowth
      };
    })
    .sort((left, right) => {
      if (right.starGrowth !== left.starGrowth) {
        return right.starGrowth - left.starGrowth;
      }

      return right.stars - left.stars;
    })
    .slice(0, maxItems)
    .map((item, index) => ({
      repoId: item.repoId,
      rank: index + 1,
      starGrowth: item.starGrowth
    }));
}

async function calculateRankings(db, options = {}) {
  const maxItems = Math.min(Math.max(Number(options.maxItems) || 10, 1), 50);
  const updatedAt = options.updatedAt || new Date().toISOString();
  const repositories = await fetchAllDocuments(db, COLLECTIONS.repositories);
  const snapshots = await fetchAllDocuments(db, COLLECTIONS.starSnapshots);
  const snapshotGroups = snapshots.reduce((accumulator, item) => {
    if (!accumulator[item.repoId]) {
      accumulator[item.repoId] = [];
    }

    accumulator[item.repoId].push(item);
    return accumulator;
  }, {});

  const summaries = await Promise.all(
    Object.keys(PERIODS).map(async (period) => {
      const items = buildRankingItems(period, repositories, snapshotGroups, maxItems);
      const document = {
        rankType: period,
        updatedAt,
        source: "calculateRankings",
        items
      };

      await db.collection(COLLECTIONS.rankingSnapshots).doc(period).set({
        data: document
      });

      return {
        period,
        itemCount: items.length
      };
    })
  );

  return {
    updatedAt,
    repositoryCount: repositories.length,
    snapshotCount: snapshots.length,
    periods: summaries
  };
}

module.exports = {
  COLLECTIONS,
  PERIODS,
  calculateRankings
};
