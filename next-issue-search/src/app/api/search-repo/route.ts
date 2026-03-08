import { NextResponse } from 'next/server';
import { searchDocuments } from '@/lib/zeroentropy';

// Cache semantic search queries to avoid hitting ZeroEntropy repeatedly for identical searches
const searchCache = new Map<string, { data: any, timestamp: number }>();
const SEARCH_CACHE_TTL = 60 * 1000 * 5; // 5 minutes

export async function POST(req: Request) {
  try {
    const { repoFullName, query } = await req.json();

    if (!repoFullName || !repoFullName.includes('/')) {
      return NextResponse.json({ error: 'Valid repository name required (e.g., vercel/next.js)' }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const collectionName = repoFullName.replace('/', '-').toLowerCase();

    // Check cache
    const cacheKey = `${collectionName}:${query.toLowerCase().trim()}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
      return NextResponse.json({ results: cached.data });
    }

    // Search ZeroEntropy API for the top 10 most semantically similar documents
    let results;
    try {
      results = await searchDocuments(collectionName, query, 10);
    } catch (e: any) {
      if (e.message.includes('404')) {
        return NextResponse.json({ error: `Repository not indexed yet. Please click 'Initialize Agent' first.` }, { status: 404 });
      }
      throw e;
    }
    
    // Process results back into an issue-like format for the UI
    const formattedResults = results.results.map((r: any) => ({
      path: r.path,
      score: r.score,
      title: r.metadata.title, 
      metadata: r.metadata,
      fileUrl: r.file_url
    }));

    // Save to cache
    searchCache.set(cacheKey, { data: formattedResults, timestamp: Date.now() });

    return NextResponse.json({ results: formattedResults });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}