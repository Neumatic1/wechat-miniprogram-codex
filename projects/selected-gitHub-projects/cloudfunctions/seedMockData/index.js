const cloud = require("wx-server-sdk");
const tcb = require("@cloudbase/node-sdk");
const { COLLECTIONS, seedMockData } = require("./repo-service");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

function getAdminDatabase() {
  const app = tcb.init({
    env: tcb.SYMBOL_CURRENT_ENV
  });

  return app.database();
}

async function ensureCollectionExists(adminDb, collectionName) {
  if (typeof adminDb.createCollection !== "function") {
    throw new Error(
      `CloudBase SDK does not support automatic collection creation: ${collectionName}`
    );
  }

  try {
    await adminDb.createCollection(collectionName);

    return {
      collectionName,
      created: true
    };
  } catch (error) {
    const message =
      (error && (error.message || error.errorMessage || error.errMsg)) || "";

    if (/already exists|existed|collection.*exist/i.test(message)) {
      return {
        collectionName,
        created: false
      };
    }

    throw error;
  }
}

exports.main = async () => {
  const adminDb = getAdminDatabase();
  const collections = await Promise.all(
    Object.values(COLLECTIONS).map((collectionName) =>
      ensureCollectionExists(adminDb, collectionName)
    )
  );
  const db = cloud.database();
  const result = await seedMockData(db);

  return Object.assign({}, result, {
    collections
  });
};
