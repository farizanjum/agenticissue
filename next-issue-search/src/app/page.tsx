'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Database, 
  Scan, 
  Github, 
  Loader2, 
  ArrowRight,
  Terminal,
  Cpu,
  Code2,
  AlertCircle,
  CheckCircle2,
  X,
  Star,
  Zap,
  Network,
  Radar,
  Copy,
  Check
} from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  number: number;
  state: string;
  similarity?: number;
  url?: string;
  path?: string;
}

interface RepoSuggestion {
  full_name: string;
  description: string;
  stargazers_count: number;
  avatar_url?: string;
}


const MARQUEE_ITEMS = [
  { name: "OpenClaw", action: "indexing issues", icon: Terminal },
  { name: "PicoClaw", action: "scanning duplicates", icon: Cpu },
  { name: "Shannon", action: "analyzing entropy", icon: Database },
  { name: "React", action: "optimizing renders", icon: Code2 },
  { name: "Next.js", action: "hydrating routes", icon: ArrowRight },
  { name: "Tailwind", action: "compiling styles", icon: Scan },
  { name: "TypeScript", action: "checking types", icon: CheckCircle2 },
  { name: "Vercel", action: "deploying edge", icon: Github },
  { name: "Supabase", action: "syncing rows", icon: Database },
  { name: "Anthropic", action: "generating thoughts", icon: Cpu },
];

export default function Home() {
  // State
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<RepoSuggestion | null>(null);
  const [query, setQuery] = useState('');

  const [results, setResults] = useState<Issue[]>([]);
  const [scanResults, setScanResults] = useState<any[] | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isIndexed, setIsIndexed] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [suggestions, setSuggestions] = useState<RepoSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const searchAbortController = useRef<AbortController | null>(null);

  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced repo search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (repoUrl.length > 2 && !repoUrl.includes('/')) {
        try {
          const res = await fetch(`/api/search-github-repos?q=${encodeURIComponent(repoUrl)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.items || []);
            setShowSuggestions(true);
          }
        } catch (e) {
          console.error("Failed to fetch suggestions", e);
        }
      } else {
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [repoUrl]);
  const handleIndex = async (overrideRepoUrl?: string) => {
    const targetRepo = overrideRepoUrl || selectedRepo?.full_name || repoUrl;
    if (!targetRepo) return;
    setIsIndexing(true);
    setStatus({ type: 'info', message: 'Indexing repository...' });
    try {
      const res = await fetch('/api/index-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: targetRepo })
      });
      if (!res.ok) throw new Error('Indexing failed');
      setIsIndexed(true);
      setStatus({ type: 'success', message: 'Repository indexed successfully' });
    } catch (e) {
      setStatus({ type: 'error', message: 'Failed to index repository' });
    } finally {
      setIsIndexing(false);
    }
  };

  // --- Real-time Debounced Issue Search ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim() || !selectedRepo || !isIndexed) {
        if (!query.trim()) setResults([]);
        return;
      }
      
      const abortController = new AbortController();
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
      searchAbortController.current = abortController;

      setIsSearching(true);
      setScanResults(null);
      
      try {
        const res = await fetch('/api/search-repo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoFullName: selectedRepo.full_name, query }),
          signal: abortController.signal
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed');

        setResults(data.results || []);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Search aborted due to new input');
        } else {
          setStatus({ type: 'error', message: err.message || 'Search failed' });
        }
      } finally {
        if (searchAbortController.current === abortController) {
          setIsSearching(false);
        }
      }
    }, 300); // 300ms debounce for real-time feel

    return () => clearTimeout(timer);
  }, [query, selectedRepo, isIndexed]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Handled by debounced effect
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText("npx -y @farizanjum/issue-agent-zeroentropy");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScan = async () => {
    setIsScanning(true);
    setResults([]);
    setStatus({ type: 'info', message: 'Scanning for duplicates...' });
    try {
      const res = await fetch('/api/scan-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: selectedRepo?.full_name || repoUrl })
      });
      if (res.ok) {
        const data = await res.json();
        setScanResults(data.duplicates || []);
        setStatus({ type: 'success', message: `Found ${data.duplicates?.length || 0} potential duplicate clusters` });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Scan failed' });
    } finally {
      setIsScanning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 0.8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]';
    if (score > 0.6) return 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_10px_rgba(96,165,250,0.1)]';
    if (score > 0.4) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
  };

  return (
    <main className="min-h-screen bg-black text-gray-200 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Net Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />


      <div className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        {/* Header */}
        <header className={`text-center transition-all duration-700 ease-in-out origin-top ${
          (isIndexed || selectedRepo || repoUrl.trim().length > 0) ? 'opacity-0 max-h-0 overflow-hidden mb-0 scale-95 pointer-events-none' : 'opacity-100 max-h-[1000px] mb-16 scale-100 space-y-6'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ZeroEntropy Agent Endpoint v2.0
            </div>
            <Link href="/docs" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-emerald-400 transition-colors bg-white/5 px-3 py-1 rounded-full border border-white/10 hover:border-emerald-500/30">
              <Code2 size={12} />
              Read Docs
            </Link>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-2">
            Agentic Issue Hub
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Centralized endpoint for <strong className="text-blue-400 font-semibold">OpenClaw</strong> and <strong className="text-purple-400 font-semibold">Nano Claw</strong> autonomous agents to deduplicate, index, and resolve GitHub issues.
          </p>

          {/* API Snippet */}
          <div className="max-w-2xl mx-auto mt-10 text-left">
            <div className="bg-zinc-900/80 rounded-xl border border-white/10 overflow-hidden backdrop-blur-md shadow-2xl">
              <div className="bg-black/40 px-4 py-2 flex items-center gap-2 border-b border-white/5">
                <span className="text-zinc-600 text-xs font-mono flex-1">{'>_'} agent-protocol.sh</span>
              </div>
              <div className="p-5 font-mono text-sm leading-relaxed overflow-x-auto text-zinc-300">
                <span className="text-purple-400">curl</span> <span className="text-zinc-500">-X</span> <span className="text-yellow-300">POST</span> <span className="text-emerald-400">/api/search-repo</span> \
                <br />
                <div className="pl-4 flex gap-2">
                  <span className="text-zinc-500">-d</span>
                  <span className="text-blue-300">'{`{"repo": "owner/repo", "query": "bug_trace"}`}'</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Agent Installation Docs */}
          <div className="max-w-2xl mx-auto mt-4 text-left space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-200 flex items-start gap-3 backdrop-blur-md shadow-lg transition-all hover:bg-emerald-500/15">
              <Terminal size={18} className="mt-0.5 text-emerald-400 shrink-0" />
              <div className="w-full">
                <p className="font-semibold text-emerald-300 mb-1">Equip Your Agents via MCP</p>
                <p className="text-emerald-200/80 mb-3 text-xs">Give Cursor, OpenClaw, or Claude Desktop the ability to autonomously search and close duplicate issues.</p>
                <div className="group relative bg-black/60 p-4 rounded-lg border border-white/5 font-mono text-xs text-zinc-300 flex items-center justify-between overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                  <div>
                    <span className="text-zinc-500 select-none">$ </span>
                    <span className="text-purple-400">npx</span> -y @farizanjum/issue-agent-zeroentropy
                  </div>
                  <button 
                    onClick={handleCopyCommand}
                    className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-all active:scale-95"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <a href="/duplicate-hunter.json" download className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all">
                    Download Skill JSON
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* Main Controls */}
        <div className="space-y-6 max-w-2xl mx-auto animate-fade-in-up">
          {/* Repo Input */}
          {/* Repo Input / Selected Card */}
          <div className="relative" ref={suggestionsRef}>
            {selectedRepo ? (
              <div className="relative group max-w-2xl mx-auto animate-fade-in-zoom">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                <div className="relative flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-4">
                    {selectedRepo.avatar_url || selectedRepo.full_name ? (
                      <div className="relative shrink-0">
                        <img 
                          src={selectedRepo.avatar_url || `https://github.com/${selectedRepo.full_name.split('/')[0]}.png?size=64`} 
                          alt={selectedRepo.full_name.split('/')[0]}
                          className="w-10 h-10 rounded-full border border-white/10 bg-zinc-800 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-gray-400">
                          <Github className="w-5 h-5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                        <Github className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{selectedRepo.full_name}</h3>
                        <span className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                          <Star className="w-3 h-3 fill-current" />
                          {selectedRepo.stargazers_count}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 max-w-[300px] truncate">{selectedRepo.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isIndexed ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                        <Zap className="w-3 h-3" />
                        Agent Ready
                      </div>
                    ) : (
                      <button
                        onClick={() => handleIndex()}
                        disabled={isIndexing}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                      >
                        {isIndexing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                        Initialize Agent
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedRepo(null);
                        setRepoUrl('');
                        setResults([]);
                        setScanResults(null);
                        setIsIndexed(false);
                        setStatus(null);
                      }}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                <div className="relative flex items-center bg-black rounded-lg border border-white/10 focus-within:border-indigo-500/50 transition-colors">
                  <Github className="w-5 h-5 text-gray-500 ml-4" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="owner/repo (e.g. facebook/react)"
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-200 placeholder-gray-600 py-4 px-4"
                  />
                </div>
              </div>
            )}

            {/* Autocomplete Suggestions */}
            {!selectedRepo && showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 animate-fade-in-zoom">
                {suggestions.map((repo) => (
                  <button
                    key={repo.full_name}
                    onClick={() => {
                      setRepoUrl(repo.full_name);
                      setSelectedRepo(repo);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex items-start gap-3 group/item"
                  >
                    <div className="mt-0.5 shrink-0">
                      <img 
                        src={repo.avatar_url || `https://github.com/${repo.full_name.split('/')[0]}.png?size=40`} 
                        alt={repo.full_name.split('/')[0]}
                        className="w-6 h-6 rounded-md bg-zinc-800 border border-white/10 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-6 h-6 rounded-md bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400">
                        <Github size={14} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-200 truncate">{repo.full_name}</div>
                      <div className="text-xs text-gray-500 truncate">{repo.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Bar */}
          {selectedRepo && (
            <div className="max-w-3xl mx-auto mt-4 flex items-center gap-4 animate-fade-in-up">
              <div className="relative group flex-1">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                <div className="relative flex items-center bg-zinc-900 rounded-lg border border-white/10 focus-within:border-emerald-500/50 transition-colors">
                  <Search className="w-5 h-5 text-gray-500 ml-4" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Query agent memory (e.g. 'race condition in auth')..."
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-200 placeholder-gray-600 py-4 px-4"
                  />
                  
                  <div className="flex items-center gap-2 pr-2">
                    <button 
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Execute"}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning}
                className="flex flex-col items-center justify-center shrink-0 w-[120px] h-[56px] bg-[#131024] hover:bg-[#1a1733] border border-[#241f3e] rounded-lg text-[#6e61a6] font-medium transition-all disabled:opacity-50 group"
              >
                {isScanning ? (
                  <Loader2 size={20} className="animate-spin mb-1" />
                ) : (
                  <>
                    <Radar size={18} className="mb-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Auto-Scan</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quick Examples */}
          {!selectedRepo && !repoUrl && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8 animate-fade-in-up delay-200">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mr-1">Examples:</span>
              <button 
                onClick={() => { 
                  setRepoUrl('openclaw/openclaw'); 
                  setSelectedRepo({ full_name: 'openclaw/openclaw', description: 'Your own personal AI assistant.', stargazers_count: 278000, avatar_url: 'https://github.com/openclaw.png?size=64' });
                  handleIndex('openclaw/openclaw');
                }} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-white/5 hover:border-white/20 text-xs font-medium text-zinc-400 hover:text-white transition-all backdrop-blur-sm"
              >
                <Radar size={12} className="text-indigo-400" />
                openclaw/openclaw <span className="opacity-50">Auto-Scan</span>
              </button>
              <button 
                onClick={() => { 
                  setRepoUrl('koala73/worldmonitor'); 
                  setSelectedRepo({ full_name: 'koala73/worldmonitor', description: 'Open source world monitor', stargazers_count: 33500, avatar_url: 'https://github.com/koala73.png?size=64' });
                  handleIndex('koala73/worldmonitor');
                }} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-white/5 hover:border-white/20 text-xs font-medium text-zinc-400 hover:text-white transition-all backdrop-blur-sm"
              >
                <Radar size={12} className="text-indigo-400" />
                koala73/worldmonitor <span className="opacity-50">Auto-Scan</span>
              </button>
              <button 
                onClick={() => { 
                  setRepoUrl('paperclipai/paperclip'); 
                  setSelectedRepo({ full_name: 'paperclipai/paperclip', description: 'Visual layer for Next.js, React & HTML', stargazers_count: 3500, avatar_url: 'https://github.com/paperclipai.png?size=64' });
                  setQuery('API calls fail'); 
                  handleIndex('paperclipai/paperclip');
                }} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-white/5 hover:border-white/20 text-xs font-medium text-zinc-400 hover:text-white transition-all backdrop-blur-sm"
              >
                <Search size={12} className="text-blue-400" />
                paperclipai/paperclip <span className="opacity-50">API calls fail</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {selectedRepo && results.length === 0 && !isSearching && !isScanning && query.trim().length > 0 && (
            <div className="mt-16 max-w-2xl mx-auto text-center p-12 rounded-xl border border-dashed border-white/10 bg-zinc-900/30 animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4">
                <Network className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">No agent memories found</h3>
              <p className="text-gray-500 text-sm">
                The agent could not find any relevant issues in the vector index.
              </p>
            </div>
          )}

          {/* Status Message */}
          {status && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
              status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              'bg-blue-500/10 border-blue-500/20 text-blue-400'
            } animate-fade-in-zoom`}>
              {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
               status.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
               <Loader2 className="w-4 h-4 animate-spin" />}
              <span className="text-sm">{status.message}</span>
            </div>
          )}
        </div>

        {/* Loading Bar (Scanning) */}
        {isScanning && (
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-1/2 animate-scanning blur-[2px]"></div>
            </div>
            <p className="text-center text-xs text-indigo-400 mt-2 font-mono animate-pulse">
              ANALYZING REPOSITORY VECTORS...
            </p>
          </div>
        )}

        {/* Auto-Scan Results */}
        {scanResults && scanResults.length > 0 && (
          <div className="mt-16 max-w-4xl mx-auto space-y-6 animate-fade-in-down">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Radar size={14} className="text-indigo-400" />
                Duplicate Clusters Found
              </h3>
              <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                {scanResults.length} CLUSTERS
              </span>
            </div>
            
            {scanResults.map((cluster, i) => (
              <div key={i} className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
                <div className="mb-4">
                  <span className="text-xs font-mono text-zinc-500 mb-1 block">RECENT ISSUE</span>
                  <a href={cluster.original.url} target="_blank" rel="noreferrer" className="text-lg font-medium text-white hover:text-indigo-400 transition-colors block">
                    <span className="text-zinc-500 mr-2">#{cluster.original.number}</span>
                    {cluster.original.title}
                  </a>
                </div>
                
                <div className="pl-6 border-l border-zinc-800 space-y-3 relative">
                  <div className="absolute -left-[17px] top-4 bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded rotate-[-90deg] tracking-widest border border-zinc-700">
                    Matches
                  </div>
                  {cluster.possible_duplicates.map((dup: any, j: number) => (
                    <a key={j} href={dup.url || `https://github.com/${repoUrl}/issues/${dup.number}`} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-zinc-500 font-mono text-sm shrink-0">#{dup.number}</span>
                        <span className="text-zinc-300 text-sm truncate group-hover:text-blue-400 transition-colors">{dup.title}</span>
                      </div>
                      <span className={`text-xs font-mono px-2 py-1 rounded border shrink-0 ml-3 ${getScoreColor(dup.score)}`}>
                        {dup.score > 1 ? Math.min(99, Math.round((dup.score / 4) * 100)) : Math.round(dup.score * 100)}%
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {scanResults && scanResults.length === 0 && !isScanning && (
          <div className="text-center py-12 max-w-4xl mx-auto bg-white/5 rounded-2xl border border-dashed border-white/10 backdrop-blur-sm mt-12">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white">Repository looks clean!</h3>
            <p className="text-zinc-500">No high-confidence duplicates were found in recent issues.</p>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && !scanResults && (
          <div className="mt-16 grid gap-4 animate-fade-in-up max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              Results
            </h2>
            {results.map((issue, index) => (
              <div 
                key={issue.id || issue.path || `issue-${index}`}
                className="group relative p-6 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.07] transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-indigo-400">#{issue.number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                        issue.state === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {issue.state}
                      </span>
                      {issue.similarity && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-gray-400 border border-white/10">
                          {Math.round(issue.similarity * 100)}% Match
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-200 group-hover:text-white transition-colors">
                      {issue.title}
                    </h3>
                  </div>
                  <a 
                    href={issue.url || `https://github.com/${repoUrl}/issues/${issue.number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}