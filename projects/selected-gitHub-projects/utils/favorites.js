const FAVORITES_STORAGE_KEY = "github-project-curation:favorites";

function getFavoriteList() {
  const favorites = wx.getStorageSync(FAVORITES_STORAGE_KEY);
  return Array.isArray(favorites) ? favorites : [];
}

function getFavoriteMap() {
  return getFavoriteList().reduce((accumulator, item) => {
    accumulator[item.repoId] = item;
    return accumulator;
  }, {});
}

function isFavorite(repoId) {
  return Boolean(getFavoriteMap()[repoId]);
}

function saveFavoriteList(list) {
  wx.setStorageSync(FAVORITES_STORAGE_KEY, list);
}

function toFavoriteRecord(repo) {
  return {
    repoId: repo.repoId,
    fullName: repo.fullName,
    owner: repo.owner,
    name: repo.name,
    summaryZh: repo.summaryZh,
    language: repo.language,
    languageLabel: repo.languageLabel,
    stars: repo.stars,
    displayStars: repo.displayStars,
    githubUrl: repo.githubUrl,
    description: repo.description,
    favoritedAt: new Date().toISOString()
  };
}

function toggleFavorite(repo) {
  const list = getFavoriteList();
  const currentIndex = list.findIndex((item) => item.repoId === repo.repoId);

  if (currentIndex >= 0) {
    list.splice(currentIndex, 1);
    saveFavoriteList(list);
    return false;
  }

  list.unshift(toFavoriteRecord(repo));
  saveFavoriteList(list);
  return true;
}

module.exports = {
  FAVORITES_STORAGE_KEY,
  getFavoriteList,
  getFavoriteMap,
  isFavorite,
  toggleFavorite
};
