"use client";

import { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";

const CONTENT_TYPES = ["Social Media Post", "Google Ad", "Email Campaign", "SMS Promo", "Blog Post"];
const PLATFORMS = ["Facebook", "Instagram", "Google Ads", "Email", "SMS"];
const TONES = ["Professional", "Casual", "Urgent", "Friendly", "Seasonal"];

export default function ContentPage() {
  const [type, setType] = useState(CONTENT_TYPES[0]);
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    // TODO: Call /api/content/generate
    setTimeout(() => {
      setResult(`🏗️ Need a dumpster? We've got you covered!\n\nBook online in under 2 minutes. Fast delivery, transparent pricing, no hidden fees.\n\n10 Yard starting at $300 | 20 Yard starting at $400\n\n📞 Call (555) 123-4567 or book at dumpsterrental.com\n\n#dumpsterrental #construction #renovation #cleanup`);
      setLoading(false);
    }, 1500);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-tippd-green" />
        <h1 className="text-2xl font-bold text-white">Content Generator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config */}
        <div className="rounded-lg border border-white/10 bg-tippd-charcoal p-5 space-y-4">
          <div>
            <label className="block text-sm text-tippd-smoke mb-2">Content Type</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((t) => (
                <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${type === t ? "bg-tippd-blue text-white" : "bg-tippd-steel text-tippd-smoke hover:text-white"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-tippd-smoke mb-2">Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => setPlatform(p)} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${platform === p ? "bg-tippd-blue text-white" : "bg-tippd-steel text-tippd-smoke hover:text-white"}`}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-tippd-smoke mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button key={t} onClick={() => setTone(t)} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${tone === t ? "bg-tippd-blue text-white" : "bg-tippd-steel text-tippd-smoke hover:text-white"}`}>{t}</button>
              ))}
            </div>
          </div>
          <button onClick={generate} disabled={loading} className="w-full py-2.5 bg-tippd-blue text-white rounded-md text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            {loading ? "Generating..." : "Generate Content"}
          </button>
        </div>

        {/* Output */}
        <div className="rounded-lg border border-white/10 bg-tippd-charcoal p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-tippd-smoke">Generated Content</h2>
            {result && (
              <button
                onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1 text-xs text-tippd-smoke hover:text-white"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
          {result ? (
            <pre className="text-sm text-white whitespace-pre-wrap font-sans">{result}</pre>
          ) : (
            <p className="text-sm text-tippd-ash">Click generate to create content with AI.</p>
          )}
        </div>
      </div>
    </div>
  );
}
