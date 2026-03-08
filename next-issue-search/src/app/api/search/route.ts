import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Load the fetched issues (in a real app, this would query the ZeroEntropy API/DB directly)
    const issuesPath = path.join(process.cwd(), 'data/issues.json');
    if (!fs.existsSync(issuesPath)) {
      return NextResponse.json({ error: 'Data not indexed yet.' }, { status: 500 });
    }

    const fileData = fs.readFileSync(issuesPath, 'utf8');
    const issues = JSON.parse(fileData);

    // MOCK SEMANTIC SEARCH:
    // In production, you would call:
    // const results = await ZeroEntropy.search({ apiKey: process.env.ZERO_ENTROPY_KEY, query, topK: 10 });
    
    // Fallback naive keyword search to simulate semantic matching
    const q = query.toLowerCase();
    const scoredIssues = issues.map((issue: any) => {
      let score = 0;
      const title = (issue.title || '').toLowerCase();
      const body = (issue.body || '').toLowerCase();
      
      if (title.includes(q)) score += 10;
      if (body.includes(q)) score += 5;
      
      // basic word matching
      const words = q.split(' ');
      words.forEach((w: string) => {
        if (w.length > 2) {
          if (title.includes(w)) score += 2;
          if (body.includes(w)) score += 1;
        }
      });
      
      return { ...issue, score };
    });

    const results = scoredIssues
      .filter((i: any) => i.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
