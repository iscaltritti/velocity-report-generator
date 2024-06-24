import { createInterface } from "node:readline/promises";
import { settings } from "./src/settings.js";
import { importSprint } from "./src/import.js";
import { generateAnalytics } from "./src/analytics.js";
import { sendMessage } from "./src/slack.js";

export const readline = createInterface({ input: process.stdin, output: process.stdout });

const main = async () => {
  console.log("Welcome to the Velocity Report Generator v0.1");
  const profiles = Object.keys(settings.profiles);
  let profilePrompt = "Select a profile:\n";
  profilePrompt += profiles.map((profile, index) => `[${index}] - ${profile}`).join("\n");
  profilePrompt += "\nYour Choice: ";
  const choice = await readline.question(profilePrompt);
  // const choice = 0;
  const { directory, channel } = settings.profiles[profiles[choice]];
  const sprintId = await readline.question("Sprint ID: ");
  // const sprintId = "187";
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
    message += `(\`Accuracy: ${accuracy}%, E/D: ${eD}\`)`;
  }
  message += "\n```";
  message += `\nAccuracy and E/D (effort points per worked day) were based on the last ${analytics.sprintCount} sprints.`;
  message += "\n```";
  return message;
};

const percentageFromRatio = (ratio) => {
  if (ratio <= 0) {
    return 0;
  }
  const distance = Math.abs(1 - ratio);
  const percentage = Math.max(0, 100 - distance * 100);
  return Math.round(percentage);
};

await main();
process.exit();
