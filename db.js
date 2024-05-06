import { JSONFilePreset } from "lowdb/node";

let db;

const getDb = async (directory, defaultData = { sprints: {}, analytics: {} }) => {
  if (!db) {
    db = await JSONFilePreset(`${directory}/db.json`, defaultData);
  }
  return db;
};

export const putSprint = async (directory, id, sprint) => {
  const db = await getDb(directory);
  await db.update(({ sprints }) => (sprints[id] = sprint));
};

export const getSprints = async (directory, id) => {
  const db = await getDb(directory);
  if (id) {
    return db.data.sprints[id];
  }
  return db.data.sprints;
};

export const putAnalytics = async (directory, analytics) => {
  const db = await getDb(directory);
  db.data.analytics = analytics;
  await db.write();
};
