export const rowToIssue = (row) => {
  return {
    assignee: row["Assignee"],
    effort: row["Custom field (Story Points)"],
    status: row["Status"],
    isNew: row["Labels"]?.includes("New")
  };
};
