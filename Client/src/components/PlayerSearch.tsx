import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { statsService, type PlayerSearchResult } from "../services/stats.service";

// Player search (spec §1 "searchable"): type a username prefix, pick a player.
// Default behaviour opens their public profile; pass onSelect to intercept
// (the H2H tab uses that to pick an opponent instead).

export default function PlayerSearch({
  placeholder = "Search players by username…",
  onSelect,
}: {
  placeholder?: string;
  onSelect?: (player: PlayerSearchResult) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced lookup
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      statsService.searchPlayers(q)
        .then((players) => {
          setResults(players);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (player: PlayerSearchResult) => {
    setOpen(false);
    setQuery("");
    if (onSelect) onSelect(player);
    else navigate(`/players/${encodeURIComponent(player.username)}`);
  };

  return (
    <div ref={boxRef} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/70 transition-colors"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-500" />
      )}

      {open && (
        <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-500">No players found.</p>
          ) : (
            results.map((p) => (
              <button
                key={p.username}
                onClick={() => pick(p)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-800/70 transition-colors"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">{p.username[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{p.username}</p>
                  <p className="text-[10px] text-slate-500 capitalize">
                    {p.role ?? "player"}{p.country ? ` · ${p.country}` : ""}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
