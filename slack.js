import { WebClient } from "@slack/web-api";
import { settings } from "./settings.js";

export const sendMessage = async (channel, text) => {
  const client = new WebClient(settings.slack.accessToken);
  await client.chat.postMessage({ text, channel });
};
