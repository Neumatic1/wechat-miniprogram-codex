const cloud = require("wx-server-sdk");
const { calculateRankings } = require("./repo-service");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event = {}) => {
  const db = cloud.database();
  return calculateRankings(db, event);
};
