import { WebClient } from "@slack/web-api";
import { settings } from "../settings.js";

export const sendMessage = async (channel, text) => {
  try {
    const client = new WebClient(settings.slack.accessToken);
    await client.chat.postMessage({ text, channel });
  } catch (error) {
    console.warn("Sending to Slack failed. (Is channel ID correct? Is bot invited in channel?)");
    console.warn(error);
  }
};
