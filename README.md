# Velocity Report Generator

1. Execute a Jira filter such as `project = $projectKey AND type IN standardIssueTypes() AND sprint = $sprintId`
2. Export into a regular CSV
  - If using "filter fields", include `Assignee`, `Key`, `Summary`, `Story Points`, `Status`, and `Label`
3. Add CSV to its corresponding project directory
4. Rename file to `$sprintId.csv`
5. Run `node index.js`
  - Might need to run `npm i` the first time around
  - Might need to update settings in `./settings.js`
