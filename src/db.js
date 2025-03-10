import { JSONFilePreset } from "lowdb/node";

let db;

const getDb = async (project = undefined, defaultData = { sprintAnalytics: {}, projectAnalytics: {} }) => {
  if (!db) {
    if (!project) {
      throw new Error("Cannot initialize database without a project name.");
    }
    db = await JSONFilePreset(`./db/${project}.json`, defaultData);
  }
  return db;
};

export const persistSprintAnalytics = async (sprintId, data, project = undefined) => {
  const db = await getDb(project);
  await db.update(({ sprintAnalytics }) => (sprintAnalytics[sprintId] = data));
};

export const retrieveSprintAnalytics = async (project = undefined) => {
  const db = await getDb(project);
  return db.data.sprintAnalytics;
};

export const persistProjectAnalytics = async (data, project = undefined) => {
  const db = await getDb(project);
  db.data.projectAnalytics = data;
  await db.write();
};
