import { settings } from "./settings.js";
import { promptDaysWorkedByAssignee, promptProject, promptSlack, promptSprintId } from "./src/prompts.js";
import { getAllIssuesBySprintId, getAllSprintsByBoardId } from "./src/jira.js";
import { analyzeProject, analyzeSprint, generateReport } from "./src/analytics.js";
import { persistProjectAnalytics, persistSprintAnalytics } from "./src/db.js";
import { sendMessage } from "./src/slack.js";

const main = async () => {
  console.log("Welcome to the Velocity Report Generator v0.2");
  const project = await promptProject();
  const sprints = await getAllSprintsByBoardId(settings.projects[project].boardId);
  const sprintId = await promptSprintId(sprints);
  let sprintAnalytics;
  if (sprintId != "0") {
    const issues = await getAllIssuesBySprintId(sprintId);
    const daysWorkedByAssignee = await promptDaysWorkedByAssignee(issues, settings.projects[project].defaultWorkedDays);
    sprintAnalytics = await analyzeSprint(issues, daysWorkedByAssignee);
    await persistSprintAnalytics(sprintId, sprintAnalytics, project);
  }
  const projectAnalytics = await analyzeProject(project);
  await persistProjectAnalytics(projectAnalytics);
  if (sprintId != "0") {
    const report = await generateReport(sprintId, sprintAnalytics, projectAnalytics);
    console.log(report);
    const slack = await promptSlack();
    if (slack) {
      await sendMessage(settings.projects[project].channelId, report);
    }
  }
};

await main();
process.exit();
