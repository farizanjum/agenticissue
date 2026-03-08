import { NextResponse } from 'next/server';
import { fetchGithubIssues } from '@/lib/github';
import { createCollection, addDocument } from '@/lib/zeroentropy';

// Cache indexed repos in memory to skip re-indexing immediately
// In production, you might store this in Redis or a DB
const indexedReposCache = new Set<string>();

export async function POST(req: Request) {
  try {
    const { repoFullName } = await req.json();

    if (!repoFullName || !repoFullName.includes('/')) {
      return NextResponse.json({ error: 'Valid repository name required (e.g., vercel/next.js)' }, { status: 400 });
    }

    const collectionName = repoFullName.replace('/', '-').toLowerCase();

    // Check if we recently indexed this repo
    if (indexedReposCache.has(collectionName)) {
      return NextResponse.json({ 
        success: true, 
        message: `${repoFullName} was already indexed recently. Ready to search!`,
        collectionName,
        cached: true
      });
    }

    // 1. Ensure collection exists
    console.log(`Ensuring collection ${collectionName} exists...`);
    const collectionStatus = await createCollection(collectionName);
    
    // If collection already exists, we assume it's indexed for this demo to save huge API calls
    if (collectionStatus === 'exists') {
        // Just mark as cached and return
        indexedReposCache.add(collectionName);
        return NextResponse.json({ 
          success: true, 
          message: `${repoFullName} already exists in database. Ready to search!`,
          collectionName,
          cached: true
        });
    }

    // 2. Fetch issues from GitHub (All time)
    // Increase max pages to grab a much deeper history (20 pages = 2000 issues)
    // You can increase this to fetch thousands more if needed.
    console.log(`Fetching issues for ${repoFullName}...`);
    const issues = await fetchGithubIssues(repoFullName, 20); 
    
    if (issues.length === 0) {
       // Return a clear 400 error so the frontend knows indexing failed due to zero issues
       return NextResponse.json({ error: `Repository ${repoFullName} has no open/closed issues in the last year to index.` }, { status: 400 });
    }

    // 3. Index issues into ZeroEntropy
    console.log(`Indexing ${issues.length} issues into collection ${collectionName}...`);
    
    // Lowered batch size to 20 and added a small delay between batches
    // to prevent Node.js UND_ERR_CONNECT_TIMEOUT when doing bulk uploads.
    const batchSize = 20;
    let indexedCount = 0;

    for (let i = 0; i < issues.length; i += batchSize) {
      const batch = issues.slice(i, i + batchSize);
      
      // We will also use a simple retry wrapper inside the map to be extra safe
      await Promise.all(batch.map(async (issue) => {
        let retries = 3;
        while (retries > 0) {
          try {
            await addDocument(
              collectionName,
              `issue-${issue.number}`,
              issue.title,
              issue.body || 'No description provided.',
              {
                id: issue.id,
                number: issue.number,
                url: issue.url,
                state: issue.state,
                created_at: issue.created_at
              }
            );
            break; // success
          } catch (e: any) {
            retries--;
            if (retries === 0) {
              console.error(`Failed to index issue ${issue.number} after 3 retries:`, e.message);
            } else {
              // Wait 500ms before retrying
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
      }));
      
      indexedCount += batch.length;
      console.log(`Indexed ${indexedCount}/${issues.length} issues`);
      
      // Delay between batches to let the network breathe
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Mark as indexed
    indexedReposCache.add(collectionName);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully fetched and indexed ${issues.length} issues for ${repoFullName}`,
      collectionName,
      count: issues.length
    });

  } catch (error: any) {
    console.error('Index API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
