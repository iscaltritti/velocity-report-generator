export const settings = {
  slack: {
    accessToken: "",
  },
  jira: {
    apiToken: "",
    domain: "https://<domain-name>.atlassian.net",
    email: "",
    doneStatuses: ["Staged", "Done", "Dropped"],
    effortFieldName: "customfield_10024",
  },
  projects: {
    "<project-id>": {
      boardId: 0,
      channelId: "",
      defaultWorkedDays: 10,
      analyticsThreshold: 5,
    },
  },
};
