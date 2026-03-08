const ZE_API_URL = 'https://api.zeroentropy.dev/v1';

export async function createCollection(collectionName: string) {
  const token = process.env.ZERO_ENTROPY_KEY;
  if (!token) throw new Error("Missing ZERO_ENTROPY_KEY");

  const res = await fetch(`${ZE_API_URL}/collections/add-collection`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ collection_name: collectionName })
  });

  if (res.status === 409) {
    return 'exists'; // Return a specific string so we know it existed, vs newly created
  }
  
  if (!res.ok) {
    const error = await res.text();
    console.error('ZeroEntropy Create Collection Error:', error);
    throw new Error(`Failed to create collection: ${res.status}`);
  }
  return 'created';
}

export async function addDocument(collectionName: string, path: string, title: string, body: string, metadata: any) {
  const token = process.env.ZERO_ENTROPY_KEY;
  if (!token) throw new Error("Missing ZERO_ENTROPY_KEY");

  // Stringify all metadata values to comply with dict[str, str | list[str]]
  const safeMetadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== null && value !== undefined) {
      safeMetadata[key] = String(value);
    }
  }
  
  // We explicitly store title in metadata so we can display it later
  safeMetadata.title = title;

  const res = await fetch(`${ZE_API_URL}/documents/add-document`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      collection_name: collectionName,
      path: path,
      content: {
        type: "text",
        text: `Title: ${title}\n\nBody: ${body}`
      },
      metadata: safeMetadata,
    })
  });

  if (res.status === 409) {
    // If it already exists and overwrite is disabled on the backend, just ignore the error.
    return true; 
  }

  if (!res.ok) {
    const error = await res.text();
    console.error('ZeroEntropy Add Document Error:', error);
    throw new Error(`Failed to add document: ${res.status}`);
  }
  return true;
}

export async function searchDocuments(collectionName: string, query: string, k: number = 10) {
  const token = process.env.ZERO_ENTROPY_KEY;
  if (!token) throw new Error("Missing ZERO_ENTROPY_KEY");

  const res = await fetch(`${ZE_API_URL}/queries/top-documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      collection_name: collectionName,
      query: query,
      k: k,
      include_metadata: true,
      latency_mode: "high" // Engages deeper reranking pipeline for higher accuracy
    })
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('ZeroEntropy Search Error:', error);
    throw new Error(`Failed to search documents: ${res.status}`);
  }

  return await res.json();
}
