const cloud = require("wx-server-sdk");
const { generateRepoSummaries } = require("./repo-service");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event = {}) => {
  const db = cloud.database();
  return generateRepoSummaries(db, event);
};
