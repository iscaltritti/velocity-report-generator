import { retrieveSprintAnalytics } from "./db.js";
import { settings } from "../settings.js";

const { effortFieldName, originalEffortFieldName } = settings.jira;

export const analyzeSprint = async (issues, daysWorkedByAssignee) => {
  const baseCounters = { committed: 0, completed: 0, uncommitted: 0 };
  const sprint = issues.reduce(
    ({ assignees, summary }, { fields }) => {
      const assignee = fields.assignee?.displayName;
      const originalEffort = fields[originalEffortFieldName] || fields[effortFieldName];
      const effort = fields[effortFieldName];
      const status = fields.status.name;
      const isNew = fields.labels.some((label) => label.toUpperCase() === "NEW");
      if (!assignees[assignee]) {
        assignees[assignee] = { ...baseCounters };
      }
      if (isNew) {
        summary.uncommitted += effort;
        assignees[assignee].uncommitted += effort;
      } else {
        summary.committed += originalEffort;
        assignees[assignee].committed += originalEffort;
      }
      if (settings.jira.doneStatuses.includes(status)) {
        summary.completed += effort;
        assignees[assignee].completed += effort;
      }
      return { assignees, summary };
    },
    { assignees: {}, summary: { ...baseCounters } }
  );
  sprint.summary.ratio = sprint.summary.completed / sprint.summary.committed || 0;
  for (const [name, assignee] of Object.entries(sprint.assignees)) {
    if (daysWorkedByAssignee[name] === 0) {
      delete sprint.assignees[name];
      continue;
    }
    sprint.assignees[name].ratio = assignee.completed / assignee.committed || 0;
    sprint.assignees[name].daysWorked = daysWorkedByAssignee[name];
  }
  return sprint;
};

export const analyzeProject = async (project) => {
  const sprints = await retrieveSprintAnalytics(project);
  const sprintIds = Object.keys(sprints)
    .sort((a, b) => b - a)
    .slice(0, settings.projects[project].analyticsThreshold);
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
  return analytics;
};

export const generateReport = async (sprintId, sprintAnalytics, projectAnalytics) => {
  const { completed, committed, uncommitted } = sprintAnalytics.summary;
  let message = `[Velocity Report] Sprint ${sprintId} Completed! 👏👏👏`;
  message += `\nThe team completed ${completed} out of ${committed} committed effort points.`;
  if (uncommitted) {
    const percentage = Math.round(uncommitted * 100 / (committed + uncommitted));
    message += `\nUncommitted work represented ${percentage}% of this sprint's total capacity at ${uncommitted} points.`;
  }
  for (const [name, assignee] of Object.entries(sprintAnalytics.assignees)) {
    const metrics = projectAnalytics.assignees[name];
    const accuracy = metrics.ratio <= 0 ? 0 : Math.round(Math.max(0, 100 - Math.abs(1 - metrics.ratio) * 100));
    const eD = metrics.effortPerDay.toFixed(1);
    message += `\n- ${name}: ${assignee.completed} of ${assignee.committed} in ${assignee.daysWorked} days`;
    message += ` (\`Accuracy: ${accuracy}%, E/D: ${eD}\`)`;
  }
  message += "\n```";
  message += `\nAccuracy and E/D (effort points per worked day) were based on the last ${projectAnalytics.sprintCount} sprints.`;
  message += "\n```";
  return message;
};
