import inspector from "inspector";
import { createInterface } from "node:readline/promises";
import { settings } from "./settings.js";
import { analyzeProject, analyzeSprint, generateReport } from "./src/analytics.js";
import { sendMessage } from "./src/slack.js";
import { getAllIssuesBySprintId, getAllSprintsByBoardId } from "./src/jira.js";
import { DEFAULT_WORKED_DAYS, DONE_STATUSES } from "./src/constants.js";
import { persistSprintAnalytics } from "./src/db.js";

export const readline = createInterface({ input: process.stdin, output: process.stdout });
const isDebugger = inspector.url() !== undefined;

const main = async () => {
  console.log("Welcome to the Velocity Report Generator v0.2");
  const project = await promptProject();
  const sprintId = await promptSprintId(settings.projects[project].boardId);
  const issues = await getAllIssuesBySprintId(sprintId);
  const daysWorkedByAssignee = await promptDaysWorkedByAssignee(issues);
  const sprintAnalytics = await analyzeSprint(issues, daysWorkedByAssignee);
  await persistSprintAnalytics(sprintId, sprintAnalytics, project);
  const projectAnalytics = await analyzeProject();
  await persistAnalytics(projectAnalytics);
  const report = await generateReport(sprintId, sprintAnalytics, projectAnalytics);
  console.log(report);
  if (await promptSlack()) {
    await sendMessage(settings.projects[project].channelId, report);
  }
};

const promptProject = async () => {
  const projects = Object.keys(settings.projects);
  const defaultAnswer = projects[0];
  let prompt = "Select a Project:\n";
  prompt += projects.map((project) => `> [${project}]`).join("\n");
  prompt += `\nYour Choice (Default: ${defaultAnswer}): `;
  if (isDebugger) {
    console.log(prompt);
    return defaultAnswer;
  } else {
    return (await readline.question(prompt)) || defaultAnswer;
  }
};

const promptSprintId = async (boardId) => {
  const sprints = (await getAllSprintsByBoardId(boardId)).sort((a, b) => b.id - a.id);
  const { id: defaultAnswer } = sprints.find((sprint) => sprint.state === "active");
  const mapper = (sprint) => {
    let description = sprint.state.charAt(0).toUpperCase() + sprint.state.slice(1);
    if (description != "Future") {
      const startDate = new Date(sprint.startDate).toISOString().split("T")[0];
      const endDate = new Date(sprint.endDate).toISOString().split("T")[0];
      description += `, ${startDate || "?"} to ${endDate || "?"}`;
    }
    return `> [${sprint.id}] ${description}`;
  };
  let prompt = "Select a Sprint ID:\n";
  prompt += sprints.slice(0, 4).map(mapper).join("\n");
  prompt += `\nYour Choice (Default: ${defaultAnswer}): `;
  if (isDebugger) {
    console.log(prompt);
    return defaultAnswer;
  } else {
    return (await readline.question(prompt)) || defaultAnswer;
  }
};

const promptDaysWorkedByAssignee = async (issues) => {
  const daysWorkedByAssignee = {};
  const defaultAnswer = DEFAULT_WORKED_DAYS;
  const names = issues.reduce((accumulator, issue) => {
    if (DONE_STATUSES.includes(issue.fields.status.name)) {
      accumulator.add(issue.fields.assignee.displayName);
    }
    return accumulator;
  }, new Set());
  for (const name of names) {
    const prompt = `Days worked by ${name} (Default: ${defaultAnswer}): `;
    let daysWorked;
    if (isDebugger) {
      console.log(prompt);
      daysWorked = defaultAnswer;
    } else {
      daysWorked = (await readline.question(prompt)) || defaultAnswer;
    }
    daysWorkedByAssignee[name] = Number(daysWorked);
  }
  return daysWorkedByAssignee;
};

const promptSlack = async () => {
  const prompt = "Would you like to post this report to Slack? Y/N (Default: N): ";
  if (isDebugger) {
    console.log(prompt);
    return false;
  } else {
    return (await readline.question(prompt)) === "Y";
  }
};

await main();
process.exit();
