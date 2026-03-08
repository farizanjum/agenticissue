export async function fetchGithubIssues(repoFullName: string, maxPages: number = 10) {
  const token = process.env.GITHUB_TOKEN;
  let issues: any[] = [];
  let page = 1;
  const perPage = 100;


  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ZeroEntropy-Issue-Fetcher',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  while (page <= maxPages) {
    // We remove the `since` parameter to fetch ALL issues historically, not just the last year.
    // GitHub API will sort them by newest first by default.
    const url = `https://api.github.com/repos/${repoFullName}/issues?state=all&per_page=${perPage}&page=${page}`;
    
    const res = await fetch(url, { headers });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`GitHub API error: ${res.status}`, errorText);
      throw new Error(`Failed to fetch from GitHub: ${res.status}`);
    }

    const data = await res.json();
    if (data.length === 0) {
      break; // No more issues
    }

    // Process and filter pull requests (often returned in the issues endpoint)
    // and truncate body to save tokens
    const processed = data
      .filter((issue: any) => !issue.pull_request) // usually we only want issues, not PRs
      .map((issue: any) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        state: issue.state,
        created_at: issue.created_at,
        body: issue.body ? issue.body.slice(0, 500) : '' // Keeping it small
      }));

    issues = issues.concat(processed);
    page++;

    // Smaller delay to speed up fetching since we have a PAT, 
    // but still respect GitHub's secondary rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return issues;
}
