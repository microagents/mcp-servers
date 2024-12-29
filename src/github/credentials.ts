export const CREDENTIALS_INFORMATION ={
    fields: [
      {
        id: "GITHUB_PERSONAL_ACCESS_TOKEN",
        name: "Github Personal Access Token",
        type: "string",
        description: "The personal access token for the Github integration",
        required: true,
        placeholder: "ghp_1234567890abcdef1234567890abcdef1234567890",
      },
    ],
    documentation: {
      markdown: `
      # How to get a Github Personal Access Token
  
      - Step 1: Go to Github
      - Step 2: Go to Settings
      - Step 3: Go to Developer Settings
      - Step 4: Go to Personal Access Tokens
      - Step 5: Click on "Generate new token"
      - Step 6: Enter a name for the token
      - Step 7: Click on "Generate token"
      - Step 8: Copy the token
      `,
    },
  };
  