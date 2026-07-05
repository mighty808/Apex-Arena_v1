import { useState } from "react";
import { Route, Share2 } from "lucide-react";
import ShareCardModal from "../share-cards/ShareCardModal";
import JourneyCardTemplate from "../share-cards/JourneyCardTemplate";

// Organizer run-to-final overview (spec §4.3): every participant's journey
// in one place. Click a player to preview/export their journey card — the
// full-tournament recap the organizer can post for their audience.

export interface JourneyParticipant {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export default function JourneyOverview({
  tournamentId,
  participants,
}: {
  tournamentId: string;
  participants: JourneyParticipant[];
}) {
  const [selected, setSelected] = useState<JourneyParticipant | null>(null);

  if (participants.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-6">No participants to show.</p>;
  }

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        Every participant gets a Run-to-the-Final card — tap a player to preview and export theirs.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {participants.map((p) => (
          <button
            key={p.userId}
            onClick={() => setSelected(p)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5 text-left hover:border-orange-500/40 hover:bg-orange-500/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-slate-400">
                  {(p.username[0] ?? "?").toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{p.displayName || p.username}</p>
              <p className="text-[10px] text-slate-500 truncate">@{p.username}</p>
            </div>
            <Share2 className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-400 shrink-0 transition-colors" />
          </button>
        ))}
      </div>

      {selected && (
        <ShareCardModal
          open
          onClose={() => setSelected(null)}
          filename={`apex-journey-${tournamentId}-${selected.username}`}
          shareText={`${selected.displayName || selected.username}'s run — on Apex Arenas`}
        >
          <JourneyCardTemplate tournamentId={tournamentId} username={selected.username} />
        </ShareCardModal>
      )}
    </div>
  );
}

export const JourneyOverviewIcon = Route;
