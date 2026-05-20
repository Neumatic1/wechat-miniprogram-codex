const { fetchTrendingRepositories, getRepositoryByFullName } = require("./github-client");

const COLLECTIONS = {
  repositories: "repositories",
  starSnapshots: "star_snapshots",
  rankingSnapshots: "ranking_snapshots"
};

const DEFAULT_PERIODS = ["daily", "weekly", "monthly"];

function getGithubToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
}

function buildRepoId(fullName) {
  return String(fullName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSnapshotId(repoId, capturedAt) {
  return `${repoId}__${capturedAt.replace(/[^0-9]/g, "")}`;
}

function normalizeRepository(apiRepo, trendingRepo, capturedAt) {
  const fullName = (apiRepo && apiRepo.full_name) || trendingRepo.fullName || "";
  const owner =
    (apiRepo && apiRepo.owner && apiRepo.owner.login) ||
    trendingRepo.owner ||
    fullName.split("/")[0] ||
    "";
  const name = (apiRepo && apiRepo.name) || trendingRepo.name || fullName.split("/")[1] || "";

  return {
    repoId: buildRepoId(fullName),
    fullName,
    owner,
    name,
    description:
      (apiRepo && apiRepo.description) ||
      trendingRepo.description ||
      "",
    language:
      (apiRepo && apiRepo.language) ||
      trendingRepo.language ||
      "",
    topics:
      (apiRepo && Array.isArray(apiRepo.topics) && apiRepo.topics) ||
      trendingRepo.topics ||
      [],
    stars:
      (apiRepo && apiRepo.stargazers_count) ||
      trendingRepo.stars ||
      0,
    forks:
      (apiRepo && apiRepo.forks_count) ||
      trendingRepo.forks ||
      0,
    openIssues:
      (apiRepo && apiRepo.open_issues_count) ||
      trendingRepo.openIssues ||
      0,
    githubUrl:
      (apiRepo && apiRepo.html_url) ||
      trendingRepo.githubUrl ||
      "",
    pushedAt:
      (apiRepo && apiRepo.pushed_at) ||
      trendingRepo.pushedAt ||
      "",
    createdAt:
      (apiRepo && apiRepo.created_at) ||
      trendingRepo.createdAt ||
      "",
    updatedAt: capturedAt,
    lastSyncedAt: capturedAt,
    source: "syncGithubTrending"
  };
}

function normalizePeriods(periods) {
  const requested = Array.isArray(periods) && periods.length ? periods : DEFAULT_PERIODS;

  return requested
    .map((item) => String(item || "").trim().toLowerCase())
    .filter((item) => DEFAULT_PERIODS.includes(item))
    .filter((item, index, array) => array.indexOf(item) === index);
}

async function writeRepositories(db, repositories, capturedAt) {
  const writes = repositories.map(async (repository) => {
    const nextRecord = Object.assign({}, repository, {
      updatedAt: capturedAt,
      lastSyncedAt: capturedAt,
      source: "syncGithubTrending"
    });

    try {
      await db.collection(COLLECTIONS.repositories).doc(repository.repoId).update({
        data: nextRecord
      });
    } catch (error) {
      await db.collection(COLLECTIONS.repositories).doc(repository.repoId).set({
        data: nextRecord
      });
    }

    const snapshotId = buildSnapshotId(repository.repoId, capturedAt);
    await db.collection(COLLECTIONS.starSnapshots).doc(snapshotId).set({
      data: {
        repoId: repository.repoId,
        fullName: repository.fullName,
        stars: repository.stars,
        forks: repository.forks,
        openIssues: repository.openIssues,
        capturedAt,
        source: "syncGithubTrending"
      }
    });
  });

  await Promise.all(writes);
}

async function writeRankingSnapshots(db, trendingByPeriod, capturedAt) {
  await Promise.all(
    Object.keys(trendingByPeriod).map((period) =>
      db.collection(COLLECTIONS.rankingSnapshots).doc(period).set({
        data: {
          rankType: period,
          updatedAt: capturedAt,
          source: "syncGithubTrending",
          items: (trendingByPeriod[period] || []).map((item, index) => ({
            repoId: item.repoId,
            rank: item.rank || index + 1,
            starGrowth: item.starGrowth || 0
          }))
        }
      })
    )
  );
}

async function fetchTrendingPayload(options = {}) {
  const periods = normalizePeriods(options.periods);
  const maxRepos = Math.min(Math.max(Number(options.maxRepos) || 10, 1), 25);
  const capturedAt = options.capturedAt || new Date().toISOString();
  const token = options.token || getGithubToken();

  const trendingGroups = await Promise.all(
    periods.map(async (period) => ({
      period,
      items: await fetchTrendingRepositories({ since: period, maxRepos })
    }))
  );

  const uniqueTrendingMap = new Map();

  trendingGroups.forEach((group) => {
    group.items.forEach((item) => {
      const repoId = buildRepoId(item.fullName);
      const normalized = Object.assign({}, item, {
        repoId,
        updatedAt: capturedAt,
        lastSyncedAt: capturedAt
      });

      if (!uniqueTrendingMap.has(repoId)) {
        uniqueTrendingMap.set(repoId, normalized);
      }
    });
  });

  const uniqueTrendingRepos = Array.from(uniqueTrendingMap.values());
  const detailedRepositories = await Promise.all(
    uniqueTrendingRepos.map(async (item) => {
      try {
        const apiRepo = await getRepositoryByFullName({
          token,
          fullName: item.fullName
        });
        return normalizeRepository(apiRepo, item, capturedAt);
      } catch (error) {
        return normalizeRepository(null, item, capturedAt);
      }
    })
  );
  const repositoryById = detailedRepositories.reduce((accumulator, repo) => {
    accumulator[repo.repoId] = repo;
    return accumulator;
  }, {});
  const trendingByPeriod = trendingGroups.reduce((accumulator, group) => {
    accumulator[group.period] = group.items
      .map((item, index) => {
        const repoId = buildRepoId(item.fullName);

        if (!repositoryById[repoId]) {
          return null;
        }

        return Object.assign({}, repositoryById[repoId], {
          rank: index + 1,
          rankType: group.period,
          starGrowth: item.starGrowth || 0
        });
      })
      .filter(Boolean);
    return accumulator;
  }, {});

  return {
    capturedAt,
    periods,
    repositories: detailedRepositories,
    trendingByPeriod
  };
}

async function syncGithubRepos(db, options = {}) {
  const payload = await fetchTrendingPayload(options);

  if (options.dryRun) {
    return {
      dryRun: true,
      capturedAt: payload.capturedAt,
      periods: payload.periods,
      repositoryCount: payload.repositories.length,
      rankingPeriods: payload.periods.map((period) => ({
        period,
        itemCount: (payload.trendingByPeriod[period] || []).length
      })),
      repositories: payload.repositories.map((item) => ({
        repoId: item.repoId,
        fullName: item.fullName,
        stars: item.stars
      })),
      samples: payload.periods.reduce((accumulator, period) => {
        accumulator[period] = (payload.trendingByPeriod[period] || []).slice(0, 3).map((item) => ({
          repoId: item.repoId,
          fullName: item.fullName,
          starGrowth: item.starGrowth
        }));
        return accumulator;
      }, {})
    };
  }

  await writeRepositories(db, payload.repositories, payload.capturedAt);
  await writeRankingSnapshots(db, payload.trendingByPeriod, payload.capturedAt);

  return {
    dryRun: false,
    capturedAt: payload.capturedAt,
    periods: payload.periods,
    repositoryCount: payload.repositories.length,
    snapshotCount: payload.repositories.length,
    rankingPeriods: payload.periods.map((period) => ({
      period,
      itemCount: (payload.trendingByPeriod[period] || []).length
    })),
    repositories: payload.repositories.map((item) => ({
      repoId: item.repoId,
      fullName: item.fullName,
      stars: item.stars
    }))
  };
}

module.exports = {
  COLLECTIONS,
  buildRepoId,
  fetchTrendingPayload,
  syncGithubRepos
};
