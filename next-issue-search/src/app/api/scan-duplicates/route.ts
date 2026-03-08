import { NextResponse } from 'next/server';
import { fetchGithubIssues } from '@/lib/github';
import { searchDocuments } from '@/lib/zeroentropy';

const scanCache = new Map<string, { data: any, timestamp: number }>();
const SCAN_CACHE_TTL = 60 * 1000 * 15; // 15 minutes

export async function POST(req: Request) {
  try {
    const { repoFullName } = await req.json();

    if (!repoFullName || !repoFullName.includes('/')) {
      return NextResponse.json({ error: 'Valid repository name required (e.g., vercel/next.js)' }, { status: 400 });
    }

    const collectionName = repoFullName.replace('/', '-').toLowerCase();

    // Check cache
    if (scanCache.has(collectionName)) {
      const cached = scanCache.get(collectionName);
      if (cached && Date.now() - cached.timestamp < SCAN_CACHE_TTL) {
        return NextResponse.json({ duplicates: cached.data });
      }
    }

    // 1. Fetch the latest 20 issues to scan against the historical index
    const latestIssues = await fetchGithubIssues(repoFullName, 1); // 1 page = up to 100 issues, but let's just take top 10 to be fast
    const issuesToScan = latestIssues.slice(0, 10);

    // Check if the collection actually exists by trying a dummy search first.
    // If it throws 404, we tell the user to index the repo first.
    try {
      await searchDocuments(collectionName, "test", 1);
    } catch (e: any) {
      if (e.message.includes('404')) {
        return NextResponse.json({ error: `Repository not indexed yet. Please click 'Initialize Agent' first.` }, { status: 400 });
      }
    }

    // 2. For each recent issue, query the ZeroEntropy semantic index concurrently (10x faster)
    const scanPromises = issuesToScan.map(async (issue) => {
      const query = `${issue.title} ${issue.body || ''}`.substring(0, 1000); // truncate for safety
      
      try {
        const results = await searchDocuments(collectionName, query, 5);
        
        // Filter out the issue itself and low-confidence matches.
        // We increase threshold to 0.92 to only catch extremely similar/duplicate issues
        const matches = results.results.filter((r: any) => {
          const matchNumber = r.metadata.number || r.path.split('-')[1];
          return matchNumber != issue.number && r.score > 0.92; // VERY High confidence threshold
        });

        if (matches.length > 0) {
          return {
            original: {
              number: issue.number,
              title: issue.title,
              url: issue.url,
              state: issue.state,
              created_at: issue.created_at
            },
            possible_duplicates: matches.map((m: any) => ({
              number: m.metadata.number,
              title: m.metadata.title,
              url: m.metadata.url,
              score: m.score,
              state: m.metadata.state
            }))
          };
        }
      } catch (err) {
        console.error(`Failed to scan issue ${issue.number}:`, err);
      }
      return null;
    });

    const resultsArray = await Promise.all(scanPromises);
    const duplicatePairs = resultsArray.filter(Boolean);

    scanCache.set(collectionName, { data: duplicatePairs, timestamp: Date.now() });

    return NextResponse.json({ duplicates: duplicatePairs });
  } catch (error: any) {
    console.error('Scan API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
