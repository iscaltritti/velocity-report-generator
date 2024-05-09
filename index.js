import { createInterface } from "node:readline/promises";
import { join } from "path";
import { readCsv } from "./csv.js";
import { rowToIssue } from "./mappers.js";
import { getSprints, putAnalytics, putSprint } from "./db.js";
import { ANALYTICS_THRESHOLD, DAYS_WORKED_DEFAULT, STATUS_DONE } from "./constants.js";
import { sendMessage } from "./slack.js";
import { settings } from "./settings.js";

const readline = createInterface({ input: process.stdin, output: process.stdout });

const main = async () => {
  console.log("Welcome to the Velocity Report Generator v0.1");
  const choices = Object.keys(settings.projects);
  let projectPrompt = "Select a project:\n";
  projectPrompt += choices.map((choice, index) => `[${index}] - ${choice}`).join("\n");
  projectPrompt += "\nYour Choice: ";
  const choice = await readline.question(projectPrompt);
  // const choice = 0;
  const { directory, slack } = settings.projects[choices[choice]];
  const sprintId = await readline.question("Sprint ID: ");
  // const sprintId = "187";
  const sprint = await importSprint(directory, sprintId);
  const analityics = await generateAnalytics(directory);
  await report(sprintId, sprint, analityics, slack.isEnable, slack.channelId);
};

const importSprint = async (directory, sprintId) => {
  const path = join(directory.toLowerCase(), sprintId.concat(".csv"));
  const issues = await readCsv(path, rowToIssue);
  const sprint = reduceIssues(issues);
  sprint.summary.ratio = sprint.summary.completed / sprint.summary.committed || 0;
  for (const [name, assignee] of Object.entries(sprint.assignees)) {
    if (assignee.completed === 0) {
      delete sprint.assignees[name];
      continue;
    }
    const daysWorked = await readline.question(`How many days did ${name} work? (${DAYS_WORKED_DEFAULT}): `);
    // const daysWorked = "10";
    sprint.assignees[name].ratio = assignee.completed / assignee.committed || 0;
    sprint.assignees[name].daysWorked = Number(daysWorked) || DAYS_WORKED_DEFAULT;
  }
  await putSprint(directory, sprintId, sprint);
  return sprint;
};

const reduceIssues = (issues) => {
  const baseCounters = { committed: 0, completed: 0, uncommitted: 0 };
  return issues.reduce(
    ({ assignees, summary }, issue) => {
      const { assignee, status, effort, isNew } = issue;
      if (!assignees[assignee]) {
        assignees[assignee] = { ...baseCounters };
      }
      if (isNew) {
        summary.uncommitted += Number(effort);
        assignees[assignee].uncommitted += Number(effort);
      } else {
        summary.committed += Number(effort);
        assignees[assignee].committed += Number(effort);
      }
      if (STATUS_DONE.includes(status)) {
        summary.completed += Number(effort);
        assignees[assignee].completed += Number(effort);
      }
      return { assignees, summary };
    },
    { assignees: {}, summary: { ...baseCounters } }
  );
};

const generateAnalytics = async (directory) => {
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

const report = async (sprintId, sprint, analytics, slackIsEnable, slackChannelId) => {
  const { completed, committed, uncommitted } = sprint.summary;
  let message = `[Velocity Report] Sprint Completed! 👏👏👏 (Sprint ID: ${sprintId})`;
  message += `\nThe team completed ${completed} out of ${committed} committed effort points.`;
  if (uncommitted) {
    message += `\n${uncommitted} points where added to the sprint while active.`;
  }
  for (const [name, assignee] of Object.entries(sprint.assignees)) {
    const metrics = analytics.assignees[name];
    (message += `\n- ${name} (${assignee.completed} of ${assignee.committed})`),
      (message += "  "),
      (message += `\`Ratio: ${metrics.ratio.toFixed(2)} | E/D: ${metrics.effortPerDay.toFixed(2)}\``);
  }
  message += "\n```";
  message += `\nRatio = completed / committed over the last ${ANALYTICS_THRESHOLD} available sprints`;
  message += `\nE/D = effort / worked days over the last ${ANALYTICS_THRESHOLD} available sprints`;
  message += "\n```";
  message += "\nIf you liked this report, react to it! Feedback is very much appreciated. - Ian";
  console.log(message);
  if (slackIsEnable) {
    try {
      await sendMessage(slackChannelId, message);
      console.log("Sent to Slack");
    } catch (error) {
      console.warn("Sending to Slack failed. (Is channel ID correct? Is bot invited in channel?)");
      console.warn(error);
    }
  }
};

await main();
process.exit();
