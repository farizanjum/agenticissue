import { NextResponse } from 'next/server';

// Simple in-memory cache for GitHub repo search to speed up autocomplete
const repoSearchCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60 * 1000 * 5; // 5 minutes

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  // Check cache
  const cacheKey = q.toLowerCase();
  const cached = repoSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ items: cached.data });
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ZeroEntropy-Issue-Fetcher',
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=10`, {
      headers,
      next: { revalidate: 300 } // Add Next.js cache too
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GitHub API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    
    // We only need the full_name and description
    const repos = data.items?.map((item: any) => ({
      full_name: item.full_name,
      description: item.description,
      stargazers_count: item.stargazers_count,
      avatar_url: item.owner?.avatar_url,
    })) || [];
    // Save to cache
    repoSearchCache.set(cacheKey, { data: repos, timestamp: Date.now() });

    return NextResponse.json({ items: repos });
  } catch (error: any) {
    console.error('Search GitHub Repos error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}