const cloud = require("wx-server-sdk");
const { syncGithubRepos } = require("./repo-service");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event = {}) => {
  const db = cloud.database();
  return syncGithubRepos(db, event);
};
