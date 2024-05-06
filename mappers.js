export const rowToIssue = (row) => {
  return {
    assignee: row["Assignee"],
    effort: row["Custom field (Story Points)"],
    issue: `[${row["Issue key"]}] ${row["Summary"]}`,
    status: row["Status"],
    isNew: row["Labels"]?.includes("New")
  };
};

export const issueToString = (key, title) => key && `[${key}] ${title}`;
