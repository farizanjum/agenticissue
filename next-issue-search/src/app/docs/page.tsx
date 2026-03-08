import Link from 'next/link';
import { ArrowLeft, Terminal, Server, Bot, Shield, Code, Check, Search } from 'lucide-react';

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-12 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Hub
        </Link>

        <header className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            DOCUMENTATION
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Agentic Issue Hub Docs
          </h1>
          <p className="text-xl text-zinc-400 leading-relaxed">
            The definitive guide to equipping your autonomous AI agents with the ability to detect and close duplicate GitHub issues using the Model Context Protocol (MCP).
          </p>
        </header>

        <div className="space-y-16">
          
          {/* Section 1: Overview */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Bot size={24} className="text-blue-400" />
              <h2 className="text-2xl font-semibold text-white">How It Works</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              When working in massive open-source repositories, human maintainers lose countless hours triaging duplicate bug reports. 
              The Agentic Issue Hub solves this by providing a semantic vector search engine built entirely on <strong className="text-white">ZeroEntropy</strong>.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                <div className="bg-emerald-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-4 border border-emerald-500/30">
                  <Server size={18} className="text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">1. Index</h3>
                <p className="text-sm text-zinc-400">Issues are fetched from GitHub and embedded into a high-dimensional vector space via ZeroEntropy.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                <div className="bg-blue-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-4 border border-blue-500/30">
                  <Search size={18} className="text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">2. Search</h3>
                <p className="text-sm text-zinc-400">Agents can query the index using natural language to find exact semantic matches instantly.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                <div className="bg-purple-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-4 border border-purple-500/30">
                  <Shield size={18} className="text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">3. Resolve</h3>
                <p className="text-sm text-zinc-400">If a 90%+ match is found, the agent uses the GitHub CLI to autonomously close the duplicate.</p>
              </div>
            </div>
          </section>

          {/* Section 2: MCP Installation */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Terminal size={24} className="text-emerald-400" />
              <h2 className="text-2xl font-semibold text-white">Installing the MCP Server</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              We provide a ready-to-use Model Context Protocol (MCP) server. MCP is an open standard that allows AI tools (like Cursor, Claude Desktop, or custom scripts) to securely connect to external data sources and execute tools.
            </p>
            
            <div className="bg-black/60 rounded-xl border border-white/10 overflow-hidden">
              <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="w-3 h-3 rounded-full bg-amber-500/50" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/50" />
                <span className="ml-2 text-xs font-mono text-zinc-500">terminal</span>
              </div>
              <div className="p-5 font-mono text-sm text-zinc-300">
                <p className="text-zinc-500 mb-2"># Install the package globally or run it directly via npx</p>
                <p><span className="text-purple-400">npx</span> -y @farizanjum/issue-agent-zeroentropy</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <a href="/duplicate-hunter.json" download className="inline-flex items-center gap-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl border border-white/10 transition-all shadow-sm">
                <Code size={16} className="text-emerald-400" />
                Download Skill Definition (.json)
              </a>
              <span className="text-zinc-500 text-sm">For OpenClaw / Custom Agents</span>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 text-sm text-blue-200 mt-6">
              <h4 className="font-bold text-blue-300 mb-2">Prerequisites:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4 text-blue-200/80">
                <li>Node.js v18 or higher installed on the machine running the agent.</li>
                <li><a href="https://cli.github.com/" target="_blank" className="text-blue-400 hover:underline">GitHub CLI (gh)</a> installed and authenticated (run <code className="bg-black/30 px-1 rounded">gh auth login</code>) so the agent has permission to close issues.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Available Tools */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Code size={24} className="text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">Agent Tools Reference</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Once connected, your agent will gain access to two powerful tools. You do not need to write code to use these; the agent will call them autonomously when instructed.
            </p>

            <div className="space-y-4">
              {/* Tool 1 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-mono text-lg text-emerald-400">search_duplicate_issues</h3>
                </div>
                <p className="text-zinc-400 text-sm mb-4">
                  Queries the ZeroEntropy vector database to find semantically similar issues.
                </p>
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 font-mono text-xs text-zinc-300">
                  <span className="text-blue-400">Parameters:</span>
                  <br />
                  &nbsp;&nbsp;<span className="text-zinc-400">repo:</span> <span className="text-emerald-300">"owner/repo"</span>
                  <br />
                  &nbsp;&nbsp;<span className="text-zinc-400">query:</span> <span className="text-emerald-300">"String describing the bug or feature"</span>
                </div>
              </div>

              {/* Tool 2 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-mono text-lg text-amber-400">close_duplicate_issue</h3>
                </div>
                <p className="text-zinc-400 text-sm mb-4">
                  Executes the GitHub CLI to securely close a specific issue, leaving a comment referencing the original duplicate.
                </p>
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 font-mono text-xs text-zinc-300">
                  <span className="text-blue-400">Parameters:</span>
                  <br />
                  &nbsp;&nbsp;<span className="text-zinc-400">repo:</span> <span className="text-emerald-300">"owner/repo"</span>
                  <br />
                  &nbsp;&nbsp;<span className="text-zinc-400">issue_number:</span> <span className="text-purple-300">1234</span>
                  <br />
                  &nbsp;&nbsp;<span className="text-zinc-400">duplicate_of_number:</span> <span className="text-purple-300">5678</span>
                </div>
              </div>

              {/* Tool 3 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-mono text-lg text-indigo-400">scan_repo_duplicates</h3>
                </div>
                <p className="text-zinc-400 text-sm mb-4">
                  Runs a comprehensive auto-scan across the most recent issues in a repository to discover clusters of duplicates simultaneously.
                </p>
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 font-mono text-xs text-zinc-300">
                  <span className="text-blue-400">Parameters:</span>
                  <br />
                  &nbsp;&nbsp;<span className="text-zinc-400">repo:</span> <span className="text-emerald-300">"owner/repo"</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Prompt Engineering */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-white border-b border-white/10 pb-4">Example Agent Prompt</h2>
            <p className="text-zinc-400 leading-relaxed">
              If you are building a custom agent flow, you can use a system prompt similar to this to trigger the behavior reliably:
            </p>
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl relative group">
              <p className="font-mono text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                You are a GitHub issue triaging assistant. 
                When a user reports a new bug, immediately use the `search_duplicate_issues` tool to check if a similar issue exists in the repository.
                
                Use the following strict thresholds to govern your autonomous actions:
                - If similarity &gt; 0.85 and issues share the same label area: suggest related bugs to the user, auto-tag the new issue as a `possible-duplicate`, and leave a comment linking the two for maintainers before it hits the backlog.
                - If similarity &gt; 0.92: autonomously use the `close_duplicate_issue` tool to close the new issue and link it to the existing one immediately.
                
                You can also use `scan_repo_duplicates` to run a batch analysis and present a triage report of all duplicates in the repo.
              </p>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
