import inspector from "inspector";
import { createInterface } from "node:readline/promises";
import { settings } from "../settings.js";

export const readline = createInterface({ input: process.stdin, output: process.stdout });
const isDebugger = inspector.url() !== undefined;

export const promptProject = async (defaultAnswer = "0") => {
  const projects = Object.keys(settings.projects);
  let prompt = "Select a Project:\n";
  prompt += projects.map((project, index) => `> [${index}] ${project}`).join("\n");
  prompt += `\nYour Choice [Default is ${defaultAnswer}]: `;
  if (isDebugger) {
    console.log(prompt);
    return projects[defaultAnswer];
  } else {
    const index = (await readline.question(prompt)) || defaultAnswer;
    return projects[index];
  }
};

export const promptSprintId = async (sprints) => {
  sprints = sprints.sort((a, b) => b.id - a.id);
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
  prompt += "> [0] Refresh analytics without importing new data\n";
  prompt += sprints.slice(0, 4).map(mapper).join("\n");
  prompt += `\nYour Choice [Default is ${defaultAnswer} (active)]: `;
  if (isDebugger) {
    console.log(prompt);
    return defaultAnswer;
  } else {
    return (await readline.question(prompt)) || defaultAnswer;
  }
};

export const promptDaysWorkedByAssignee = async (issues, defaultAnswer) => {
  const daysWorkedByAssignee = {};
  const names = issues.reduce((accumulator, issue) => {
    if (settings.jira.doneStatuses.includes(issue.fields.status.name)) {
      accumulator.add(issue.fields.assignee.displayName);
    }
    return accumulator;
  }, new Set());
  for (const name of names) {
    const prompt = `Days worked by ${name} [Default is ${defaultAnswer}]: `;
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

export const promptSlack = async () => {
  const prompt = "Would you like to post this report to Slack? Y/N (Default is N): ";
  if (isDebugger) {
    console.log(prompt);
    return false;
  } else {
    return (await readline.question(prompt)) === "Y";
  }
};
