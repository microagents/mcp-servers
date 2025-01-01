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
import { Tool } from "@modelcontextprotocol/sdk/types.js";

type ToolSchema = NonNullable<Tool["inputSchema"]>;

const toToolSchema = (schema: any): ToolSchema => zodToJsonSchema(schema) as ToolSchema;

export const AVAILABLE_TOOLS: Tool[] = [
  {
    name: "github_create_or_update_file",
    description: "Create or update a single file in a GitHub repository",
    type: "function",
    inputSchema: toToolSchema(CreateOrUpdateFileSchema),
  },
  {
    name: "github_search_repositories",
    description: "Search for GitHub repositories",
    inputSchema: toToolSchema(SearchRepositoriesSchema),
  },
  {
    name: "github_create_repository",
    description: "Create a new GitHub repository in your account",
    inputSchema: toToolSchema(CreateRepositorySchema),
  },
  {
    name: "github_get_file_contents",
    description:
      "Get the contents of a file or directory from a GitHub repository",
    inputSchema: toToolSchema(GetFileContentsSchema),
  },
  {
    name: "github_push_files",
    description:
      "Push multiple files to a GitHub repository in a single commit",
    inputSchema: toToolSchema(PushFilesSchema),
  },
  {
    name: "github_create_issue",
    description: "Create a new issue in a GitHub repository",
    inputSchema: toToolSchema(CreateIssueSchema),
  },
  {
    name: "github_create_pull_request",
    description: "Create a new pull request in a GitHub repository",
    inputSchema: toToolSchema(CreatePullRequestSchema),
  },
  {
    name: "github_fork_repository",
    description:
      "Fork a GitHub repository to your account or specified organization",
    inputSchema: toToolSchema(ForkRepositorySchema),
  },
  {
    name: "github_create_branch",
    description: "Create a new branch in a GitHub repository",
    inputSchema: toToolSchema(CreateBranchSchema),
  },
  {
    name: "github_list_commits",
    description: "Get list of commits of a branch in a GitHub repository",
    inputSchema: toToolSchema(ListCommitsSchema),
  },
  {
    name: "github_list_issues",
    description: "List issues in a GitHub repository with filtering options",
    inputSchema: toToolSchema(ListIssuesOptionsSchema),
  },
  {
    name: "github_update_issue",
    description: "Update an existing issue in a GitHub repository",
    inputSchema: toToolSchema(UpdateIssueOptionsSchema),
  },
  {
    name: "github_add_issue_comment",
    description: "Add a comment to an existing issue",
    inputSchema: toToolSchema(IssueCommentSchema),
  },
  {
    name: "github_search_code",
    description: "Search for code across GitHub repositories",
    inputSchema: toToolSchema(SearchCodeSchema),
  },
  {
    name: "github_search_issues",
    description:
      "Search for issues and pull requests across GitHub repositories",
    inputSchema: toToolSchema(SearchIssuesSchema),
  },
  {
    name: "github_search_users",
    description: "Search for users on GitHub",
    inputSchema: toToolSchema(SearchUsersSchema),
  },
  {
    name: "github_get_issue",
    description: "Get details of a specific issue in a GitHub repository.",
    inputSchema: toToolSchema(GetIssueSchema),
  },
];
