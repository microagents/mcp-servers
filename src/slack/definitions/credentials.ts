export const CREDENTIALS_INFORMATION = {
  fields: [
    {
      id: "SLACK_BOT_TOKEN",
      name: "Slack Bot Token",
      type: "string",
      description: "The bot token for the Slack integration",
      required: true,
      placeholder: "xoxb-1234567890abcdef1234567890abcdef1234567890",
    },
    {
      id: "SLACK_TEAM_ID",
      name: "Slack Team ID",
      type: "string",
      description: "The team ID for the Slack integration",
      required: true,
      placeholder: "T01234567",
    },
  ],
  documentation: {
    markdown: `
      1. Create a Slack App:
   - Visit the [Slack Apps page](https://api.slack.com/apps)
   - Click "Create New App"
   - Choose "From scratch"
   - Name your app and select your workspace

2. Configure Bot Token Scopes:
   Navigate to "OAuth & Permissions" and add these scopes:
   - \`channels:history\` - View messages and other content in public channels
   - \`channels:read\` - View basic channel information
   - \`chat:write\` - Send messages as the app
   - \`reactions:write\` - Add emoji reactions to messages
   - \`users:read\` - View users and their basic information

4. Install App to Workspace:
   - Click "Install to Workspace" and authorize the app
   - Save the "Bot User OAuth Token" that starts with \`xoxb-\`

5. Get your Team ID (starts with a \`T\`) by following [this guidance](https://slack.com/help/articles/221769328-Locate-your-Slack-URL-or-ID#find-your-workspace-or-org-id)
      `,
  },
};
