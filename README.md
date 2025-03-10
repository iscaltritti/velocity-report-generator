# Velocity Report Generator v0.3.0

## How to use

Upon pulling the repository, follow these steps:

1. Have [node.js](https://nodejs.org/en/) installed
2. Execute `npm i` from the repository's root folder to install all dependencies
3. Make a duplicate of `settings.sample.js`, rename it to `./settings.js` and fill in the blanks
4. Execute `node index.js`, the script will prompt you for everything else you need

The project uses local json files as databases to persist analytics over time, these are found on `./projects/`.

Make sure to pull and push analytic updates to the repository to ensure they are correct across devices.
