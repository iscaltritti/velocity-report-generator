import { WebClient } from "@slack/web-api";
import { settings } from "../settings.js";

export const sendMessage = async (channel, text) => {
  try {
    const client = new WebClient(settings.slack.accessToken);
    await client.chat.postMessage({ text, channel });
  } catch (error) {
    console.warn(error);
    console.warn("Posting to Slack failed. Is channelId correct? Was your bot invited to the channel?");
  }
};
