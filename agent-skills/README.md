# Agentic Issue Hub & Triage Copilot

This repository contains everything you need to give your AI Agent the ultimate GitHub Issue Triaging skill.

## What is this?
When managing large open-source repositories, human maintainers lose countless hours triaging duplicate bug reports. This skill equips your agent with a **ZeroEntropy-powered semantic vector search engine**.

## Available Tools

Once connected via the MCP protocol, your agent gains access to:

### 1. `search_duplicate_issues`
Queries the vector database to find semantically similar issues.
- `repo` (string): e.g. "owner/repo"
- `query` (string): The bug description

### 2. `close_duplicate_issue`
Executes the GitHub CLI (`gh`) locally to securely close a specific issue, leaving a comment referencing the original duplicate.
- `repo` (string)
- `issue_number` (number)
- `duplicate_of_number` (number)

### 3. `scan_repo_duplicates`
Runs a batch auto-scan across the most recent issues in a repository to discover clusters of duplicates simultaneously.
- `repo` (string)

## How to Install the Skill (Cursor, OpenClaw, Claude)
Add the following command to your agent's MCP server configuration:
```bash
npx -y @farizanjum/issue-agent-zeroentropy
```

## Recommended Agent System Prompt
Bake this instruction into your agent's context window:

> You are a GitHub issue triaging assistant. 
> When a user reports a new bug, immediately use the `search_duplicate_issues` tool to check if a similar issue exists in the repository.
> 
> Use the following strict thresholds to govern your autonomous actions:
> - If similarity > 0.85 and issues share the same label area: suggest related bugs to the user, auto-tag the new issue as a `possible-duplicate`, and leave a comment linking the two for maintainers before it hits the backlog.
> - If similarity > 0.92: autonomously use the `close_duplicate_issue` tool to close the new issue and link it to the existing one immediately.
> 
> You can also use `scan_repo_duplicates` to run a batch analysis and present a triage report of all duplicates in the repo.
