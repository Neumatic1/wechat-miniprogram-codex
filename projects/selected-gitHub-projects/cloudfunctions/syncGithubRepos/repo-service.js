const { searchRepositories } = require("./github-client");

const COLLECTIONS = {
  repositories: "repositories",
  starSnapshots: "star_snapshots"
};

function toIsoDate(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function getDefaultQueries() {
  return [
    `stars:>=500 pushed:>=${toIsoDate(14)} archived:false`
  ];
}

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

function normalizeRepository(repo, capturedAt) {
  const fullName = repo.full_name || "";
  const owner = repo.owner && repo.owner.login ? repo.owner.login : "";
  const name = repo.name || fullName.split("/")[1] || "";

  return {
    repoId: buildRepoId(fullName),
    fullName,
    owner,
    name,
    description: repo.description || "",
    language: repo.language || "",
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    openIssues: repo.open_issues_count || 0,
    githubUrl: repo.html_url || "",
    pushedAt: repo.pushed_at || "",
    createdAt: repo.created_at || "",
    updatedAt: capturedAt,
    lastSyncedAt: capturedAt,
    source: "syncGithubRepos"
  };
}

async function writeRepositories(db, repositories, capturedAt) {
  const writes = repositories.map(async (repository) => {
    const nextRecord = Object.assign({}, repository, {
      updatedAt: capturedAt,
      lastSyncedAt: capturedAt,
      source: "syncGithubRepos"
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
        source: "syncGithubRepos"
      }
    });
  });

  await Promise.all(writes);
}

async function fetchRepositories(options = {}) {
  const token = options.token || getGithubToken();

  if (!token) {
    throw new Error("Missing GITHUB_TOKEN or GH_TOKEN for syncGithubRepos");
  }

  const queries =
    Array.isArray(options.queries) && options.queries.length
      ? options.queries
      : getDefaultQueries();
  const perPage = Math.min(Math.max(Number(options.perPage) || 5, 1), 20);
  const maxRepos = Math.min(Math.max(Number(options.maxRepos) || 5, 1), 20);
  const capturedAt = options.capturedAt || new Date().toISOString();

  const results = await Promise.all(
    queries.map((query) => searchRepositories({ token, query, perPage }))
  );

  const repositoryMap = new Map();

  results.flat().forEach((repo) => {
    const normalized = normalizeRepository(repo, capturedAt);

    if (!normalized.repoId) {
      return;
    }

    if (!repositoryMap.has(normalized.repoId)) {
      repositoryMap.set(normalized.repoId, normalized);
    }
  });

  return {
    capturedAt,
    queries,
    repositories: Array.from(repositoryMap.values()).slice(0, maxRepos)
  };
}

async function syncGithubRepos(db, options = {}) {
  const payload = await fetchRepositories(options);

  if (options.dryRun) {
    return {
      dryRun: true,
      capturedAt: payload.capturedAt,
      queries: payload.queries,
      repositoryCount: payload.repositories.length,
      repositories: payload.repositories
    };
  }

  await writeRepositories(db, payload.repositories, payload.capturedAt);

  return {
    dryRun: false,
    capturedAt: payload.capturedAt,
    queries: payload.queries,
    repositoryCount: payload.repositories.length,
    snapshotCount: payload.repositories.length,
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
  fetchRepositories,
  syncGithubRepos
};
