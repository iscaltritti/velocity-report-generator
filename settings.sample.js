export const settings = {
  slack: {
    accessToken: "",
  },
  jira: {
    apiToken: "",
    domain: "https://boatyard.atlassian.net",
    email: "",
    doneStatuses: ["Staged", "Done", "Dropped"],
    effortFieldName: "customfield_10024",
    originalEffortFieldName: "customfield_10287",
  },
  projects: {
    IIQSAAS: {
      boardId: 0,
      channelId: "",
      defaultWorkedDays: 10,
      analyticsThreshold: 5,
    },
    YIQ: {
      boardId: 0,
      channelId: "",
      defaultWorkedDays: 10,
      analyticsThreshold: 5,
    },
  },
};
