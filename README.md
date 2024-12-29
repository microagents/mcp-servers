# Microagents MCP Servers

This repository contains the Model Context Protocol (MCP) servers used by the [Microagents](https://microagents.dev) application. This is a fork of the original [MCP reference implementations](https://modelcontextprotocol.io/) created by Anthropic, with modifications and additional servers to support Microagents' functionality.

Each MCP server is implemented using either the [Typescript MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) providing Large Language Models (LLMs) with secure, controlled access to various tools and data sources.

## 🌟 Available Servers

The following MCP servers are maintained for use with Microagents:

- **[AWS KB Retrieval](src/aws-kb-retrieval-server)** - Retrieval from AWS Knowledge Base using Bedrock Agent Runtime
- **[Brave Search](src/brave-search)** - Web and local search using Brave's Search API
- **[EverArt](src/everart)** - AI image generation using various models
- **[Everything](src/everything)** - Reference / test server with prompts, resources, and tools
- **[Filesystem](src/filesystem)** - Secure file operations with configurable access controls
- **[GitHub](src/github)** - Repository management, file operations, and GitHub API integration
- **[GitLab](src/gitlab)** - GitLab API, enabling project management
- **[Google Drive](src/gdrive)** - File access and search capabilities for Google Drive
- **[Google Maps](src/google-maps)** - Location services, directions, and place details
- **[Memory](src/memory)** - Knowledge graph-based persistent memory system
- **[PostgreSQL](src/postgres)** - Read-only database access with schema inspection
- **[Puppeteer](src/puppeteer)** - Browser automation and web scraping
- **[Sequential Thinking](src/sequentialthinking)** - Dynamic and reflective problem-solving through thought sequences
- **[Slack](src/slack)** - Channel management and messaging capabilities

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for information about contributing to this repository.

## 🔒 Security

See [SECURITY.md](SECURITY.md) for reporting security vulnerabilities.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

This repository is a fork of the original MCP reference implementations created by [Anthropic](https://anthropic.com). We are grateful for their work in developing the Model Context Protocol and the initial server implementations.