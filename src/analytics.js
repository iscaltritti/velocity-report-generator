import { getSprints, putAnalytics } from "./db.js";
import { ANALYTICS_THRESHOLD } from "./constants.js";

export const generateAnalytics = async (directory) => {
  const sprints = await getSprints(directory);
  const sprintIds = Object.keys(sprints)
    .sort((a, b) => b - a)
    .slice(0, ANALYTICS_THRESHOLD);
  const analytics = sprintIds.reduce(
    (accumulator, sprintId) => {
      const sprint = sprints[sprintId];
      accumulator.sprintCount++;
      accumulator.ratioSum += sprint.summary.ratio;
      for (const [name, assignee] of Object.entries(sprint.assignees)) {
        if (!accumulator.assignees[name]) {
          accumulator.assignees[name] = {
            ratioSum: 0,
            sprintCount: 0,
            committed: 0,
            completed: 0,
            daysWorked: 0,
          };
        }
        accumulator.assignees[name].sprintCount++;
        accumulator.assignees[name].ratioSum += assignee.ratio;
        accumulator.assignees[name].committed += assignee.committed;
        accumulator.assignees[name].completed += assignee.completed;
        accumulator.assignees[name].daysWorked += assignee.daysWorked;
      }
      return accumulator;
    },
    { ratioSum: 0, sprintCount: 0, assignees: {} }
  );
  analytics.ratio = analytics.ratioSum / analytics.sprintCount || 0;
  for (const [name, assignee] of Object.entries(analytics.assignees)) {
    analytics.assignees[name] = {
      ratio: assignee.ratioSum / assignee.sprintCount || 0,
      effortPerDay: assignee.completed / assignee.daysWorked || 0,
    };
  }
  await putAnalytics(directory, analytics);
  return analytics;
};
