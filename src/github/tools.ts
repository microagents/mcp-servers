import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CreateOrUpdateFileSchema,
  SearchRepositoriesSchema,
  CreateRepositorySchema,
  GetFileContentsSchema,
  PushFilesSchema,
  CreateIssueSchema,
  CreatePullRequestSchema,
  ForkRepositorySchema,
  CreateBranchSchema,
  ListCommitsSchema,
  ListIssuesOptionsSchema,
  UpdateIssueOptionsSchema,
  IssueCommentSchema,
  SearchCodeSchema,
  SearchIssuesSchema,
  SearchUsersSchema,
  GetIssueSchema,
} from "./schemas.js";

export const AVAILABLE_TOOLS = [
  {
    name: "create_or_update_file",
    description: "Create or update a single file in a GitHub repository",
    inputSchema: zodToJsonSchema(CreateOrUpdateFileSchema),
  },
  {
    name: "search_repositories",
    description: "Search for GitHub repositories",
    inputSchema: zodToJsonSchema(SearchRepositoriesSchema),
  },
  {
    name: "create_repository",
    description: "Create a new GitHub repository in your account",
    inputSchema: zodToJsonSchema(CreateRepositorySchema),
  },
  {
    name: "get_file_contents",
    description:
      "Get the contents of a file or directory from a GitHub repository",
    inputSchema: zodToJsonSchema(GetFileContentsSchema),
  },
  {
    name: "push_files",
    description:
      "Push multiple files to a GitHub repository in a single commit",
    inputSchema: zodToJsonSchema(PushFilesSchema),
  },
  {
    name: "create_issue",
    description: "Create a new issue in a GitHub repository",
    inputSchema: zodToJsonSchema(CreateIssueSchema),
  },
  {
    name: "create_pull_request",
    description: "Create a new pull request in a GitHub repository",
    inputSchema: zodToJsonSchema(CreatePullRequestSchema),
  },
  {
    name: "fork_repository",
    description:
      "Fork a GitHub repository to your account or specified organization",
    inputSchema: zodToJsonSchema(ForkRepositorySchema),
  },
  {
    name: "create_branch",
    description: "Create a new branch in a GitHub repository",
    inputSchema: zodToJsonSchema(CreateBranchSchema),
  },
  {
    name: "list_commits",
    description: "Get list of commits of a branch in a GitHub repository",
    inputSchema: zodToJsonSchema(ListCommitsSchema),
  },
  {
    name: "list_issues",
    description: "List issues in a GitHub repository with filtering options",
    inputSchema: zodToJsonSchema(ListIssuesOptionsSchema),
  },
  {
    name: "update_issue",
    description: "Update an existing issue in a GitHub repository",
    inputSchema: zodToJsonSchema(UpdateIssueOptionsSchema),
  },
  {
    name: "add_issue_comment",
    description: "Add a comment to an existing issue",
    inputSchema: zodToJsonSchema(IssueCommentSchema),
  },
  {
    name: "search_code",
    description: "Search for code across GitHub repositories",
    inputSchema: zodToJsonSchema(SearchCodeSchema),
  },
  {
    name: "search_issues",
    description:
      "Search for issues and pull requests across GitHub repositories",
    inputSchema: zodToJsonSchema(SearchIssuesSchema),
  },
  {
    name: "search_users",
    description: "Search for users on GitHub",
    inputSchema: zodToJsonSchema(SearchUsersSchema),
  },
  {
    name: "get_issue",
    description: "Get details of a specific issue in a GitHub repository.",
    inputSchema: zodToJsonSchema(GetIssueSchema),
  },
];
