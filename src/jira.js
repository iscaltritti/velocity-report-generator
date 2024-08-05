import { settings } from "../settings.js";

const { domain, email, apiToken } = settings.jira;
const token = btoa(`${email}:${apiToken}`);

export const getAllSprintsByBoardId = async (boardId) => {
  const endpoint = `${domain}/rest/agile/1.0/board/${boardId}/sprint`;
  return getAll(endpoint, ({ values }) => values);
};

export const getAllIssuesBySprintId = async (sprintId) => {
  const endpoint = `${domain}/rest/agile/1.0/sprint/${sprintId}/issue`;
  return getAll(endpoint, ({ issues }) => issues);
};

const getAll = async (endpoint, callback) => {
  const results = [];
  let isLast;
  do {
    const uri = `${endpoint}?startAt=${results.length}`;
    const response = await fetch(uri, {
      method: "GET",
      headers: {
        Authorization: `Basic ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${endpoint}`);
    }
    const data = await response.json();
    const subset = callback(data);
    results.push(...subset);
    isLast = data.isLast || results.length === data.total;
  } while (!isLast);
  return results;
};
