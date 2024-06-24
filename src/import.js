import { join } from "path/posix";
import { readCsv } from "./csv.js";
import { putSprint } from "./db.js";
import { DAYS_WORKED_DEFAULT, STATUS_DONE } from "./constants.js";

const rowToIssue = (row) => {
  return {
    assignee: row["Assignee"],
    effort: row["Custom field (Story Points)"],
    status: row["Status"],
    isNew: row["Labels"]?.includes("New"),
  };
};

export const importSprint = async (directory, sprintId, readline) => {
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
