import { createInterface } from "node:readline/promises";
import { settings } from "./settings.js";
import { importSprint } from "./src/import.js";
import { generateAnalytics } from "./src/analytics.js";
import { sendMessage } from "./src/slack.js";

export const readline = createInterface({ input: process.stdin, output: process.stdout });

const main = async () => {
  console.log("Welcome to the Velocity Report Generator v0.1");
  const projects = Object.keys(settings.projects);
  let projectPrompt = "Select a project:\n";
  projectPrompt += projects.map((project, index) => `[${index}] ${project}`).join("\n");
  projectPrompt += "\nYour Choice: ";
  const projectChoice = await readline.question(projectPrompt);
  // const projectChoice = 0;
  const { directory, channel } = settings.projects[projects[projectChoice]];
  const sprintId = await readline.question(`Sprint ID: `);
  // const sprintId = "200";
  const sprint = await importSprint(directory, sprintId, readline);
  const analityics = await generateAnalytics(directory);
  const report = await generateReport(sprintId, sprint, analityics);
  console.log(report);
  const isSlack = await readline.question("Would you like to send it through Slack? y/N: ");
  if (isSlack.toUpperCase() === "Y") {
    await sendMessage(channel, report);
  }
};

const generateReport = async (sprintId, sprint, analytics) => {
  const { completed, committed, uncommitted } = sprint.summary;
  let message = `[Velocity Report] Sprint ${sprintId} Completed! 👏👏👏`;
  message += `\nThe team completed ${completed} out of ${committed} committed effort points.`;
  if (uncommitted) {
    message += `\n${uncommitted} points were added to the sprint while active.`;
  }
  for (const [name, assignee] of Object.entries(sprint.assignees)) {
    const metrics = analytics.assignees[name];
    const accuracy = metrics.ratio <= 0 ? 0 : Math.round(Math.max(0, 100 - Math.abs(1 - metrics.ratio) * 100));
    const eD = metrics.effortPerDay.toFixed(1);
    message += `\n- ${name}: ${assignee.completed} of ${assignee.committed} in ${assignee.daysWorked} days`;
    message += ` (\`Accuracy: ${accuracy}%, E/D: ${eD}\`)`;
  }
  message += "\n```";
  message += `\nAccuracy and E/D (effort points per worked day) were based on the last ${analytics.sprintCount} sprints.`;
  message += "\n```";
  return message;
};

await main();
process.exit();
