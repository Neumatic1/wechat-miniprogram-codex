const cloud = require("wx-server-sdk");
const { getRankings } = require("./repo-service");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event) => {
  const period = event.period || "daily";
  const db = cloud.database();
  return getRankings(period, db);
};
