import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { LeagueTableRow } from '../../services/tournament.service';

interface LeagueTableProps {
  table: LeagueTableRow[];
  highlightUserId?: string;
}

// ── Form badge ────────────────────────────────────────────────────────────────
function FormBadge({ result }: { result: string }) {
  if (result === 'W')
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
        W
      </span>
    );
  if (result === 'D')
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
        D
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
      L
    </span>
  );
}

// ── Trend indicator ────────────────────────────────────────────────────────────
function Trend({ change }: { change: number }) {
  if (change > 0) return <TrendingUp className="w-3 h-3 text-emerald-400" />;
  if (change < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-slate-600" />;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({
  avatarUrl, displayName, size = 'md',
}: {
  avatarUrl?: string; displayName: string; size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'md' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs';
  if (avatarUrl)
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${dim} rounded-full object-cover border border-slate-700 shrink-0`}
      />
    );
  return (
    <div className={`${dim} rounded-full bg-linear-to-br from-cyan-800 to-indigo-800 flex items-center justify-center font-bold text-white border border-slate-700 shrink-0`}>
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Position medal ────────────────────────────────────────────────────────────
function PositionMedal({ pos }: { pos: number }) {
  if (pos === 1) return <span className="text-base leading-none">🥇</span>;
  if (pos === 2) return <span className="text-base leading-none">🥈</span>;
  if (pos === 3) return <span className="text-base leading-none">🥉</span>;
  return null;
}

// ── Top-3 Podium ──────────────────────────────────────────────────────────────
function Podium({ top3, highlightUserId }: { top3: LeagueTableRow[]; highlightUserId?: string }) {
  // Arrange as [2nd, 1st, 3rd]
  const ordered = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumHeights = [top3[1] ? 'pt-6' : 'pt-0', 'pt-0', top3[2] ? 'pt-10' : 'pt-0'];

  return (
    <div className="flex items-end justify-center gap-3 px-4 pb-1">
      {ordered.map((row, i) => {
        const isCenter = i === 1;
        const isMe = !!highlightUserId && (row.userId === highlightUserId || row.teamId === highlightUserId);
        const heightClass = podiumHeights[i];

        return (
          <div
            key={row.position}
            className={`flex flex-col items-center gap-2 flex-1 max-w-[120px] ${heightClass}`}
          >
            {/* Avatar + medal */}
            <div className="relative">
              <Avatar avatarUrl={row.avatarUrl} displayName={row.displayName} size={isCenter ? 'lg' : 'md'} />
              <span className="absolute -bottom-1 -right-1 text-sm leading-none">
                <PositionMedal pos={row.position} />
              </span>
            </div>

            {/* Name */}
            <div className="text-center">
              <p className={`text-xs font-semibold truncate max-w-[96px] ${isMe ? 'text-cyan-300' : isCenter ? 'text-white' : 'text-slate-300'}`}>
                {row.displayName}
                {isMe && <span className="ml-1 text-[10px] text-cyan-500">(you)</span>}
              </p>
            </div>

            {/* Pedestal */}
            <div
              className={`w-full rounded-t-lg flex flex-col items-center justify-center py-3 gap-1
                ${isCenter
                  ? 'bg-linear-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/30 min-h-[72px]'
                  : row.position === 2
                    ? 'bg-linear-to-b from-slate-400/10 to-slate-400/5 border border-slate-500/30 min-h-[52px]'
                    : 'bg-linear-to-b from-amber-700/10 to-amber-700/5 border border-amber-700/30 min-h-[40px]'
                }`}
            >
              <span className={`text-lg font-bold tabular-nums ${isCenter ? 'text-amber-400' : 'text-slate-300'}`}>
                {row.points}
              </span>
              <span className="text-[10px] text-slate-500">pts</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Row border accent ─────────────────────────────────────────────────────────
function rowAccent(position: number, total: number): string {
  if (position === 1) return 'border-l-2 border-l-amber-400';
  if (position <= 3) return 'border-l-2 border-l-emerald-500';
  if (position >= total - 2) return 'border-l-2 border-l-red-500/60';
  return 'border-l-2 border-l-transparent';
}

// ── Main component ────────────────────────────────────────────────────────────
export function LeagueTable({ table, highlightUserId }: LeagueTableProps) {
  if (table.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        No standings yet. Fixtures need to be generated first.
      </div>
    );
  }

  const top3 = table.slice(0, 3);
  const hasPodium = top3.length >= 2;

  return (
    <div className="space-y-5">
      {/* Podium */}
      {hasPodium && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 pt-5 pb-0 overflow-hidden">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold text-center mb-4">
            Top Players
          </p>
          <Podium top3={top3} highlightUserId={highlightUserId} />
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="bg-slate-900/80 text-slate-500 uppercase text-[10px] tracking-wider">
              <th className="pl-3 pr-2 py-3 text-left w-10">#</th>
              <th className="px-2 py-3 text-left">Player</th>
              <th className="px-2 py-3 text-center w-8" title="Played">P</th>
              <th className="px-2 py-3 text-center w-8 text-emerald-500/70" title="Won">W</th>
              <th className="px-2 py-3 text-center w-8 text-amber-500/70" title="Drawn">D</th>
              <th className="px-2 py-3 text-center w-8 text-red-500/70" title="Lost">L</th>
              <th className="px-2 py-3 text-center w-10 hidden sm:table-cell" title="Goals For">GF</th>
              <th className="px-2 py-3 text-center w-10 hidden sm:table-cell" title="Goals Against">GA</th>
              <th className="px-2 py-3 text-center w-10" title="Goal Difference">GD</th>
              <th className="px-3 py-3 text-center w-12 text-white" title="Points">Pts</th>
              <th className="px-2 py-3 text-center hidden md:table-cell">Form</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {table.map((row) => {
              const isMe = !!highlightUserId && (row.userId === highlightUserId || row.teamId === highlightUserId);
              return (
                <tr
                  key={row.position}
                  className={`transition-colors ${
                    isMe
                      ? 'bg-cyan-950/40 hover:bg-cyan-950/60'
                      : 'bg-slate-900/30 hover:bg-slate-800/40'
                  } ${rowAccent(row.position, table.length)}`}
                >
                  {/* Position */}
                  <td className="pl-3 pr-2 py-3">
                    <div className="flex items-center gap-1">
                      <Trend change={row.positionChange} />
                      {row.position <= 3 ? (
                        <PositionMedal pos={row.position} />
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs w-4 text-center">
                          {row.position}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Player */}
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar avatarUrl={row.avatarUrl} displayName={row.displayName} size="sm" />
                      <div className="min-w-0">
                        <span className={`font-medium text-sm block truncate max-w-[120px] sm:max-w-none ${isMe ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {row.displayName}
                          {isMe && <span className="ml-1.5 text-[10px] text-cyan-500 font-semibold">(you)</span>}
                        </span>
                        {row.inGameId && (
                          <span className="text-[10px] text-slate-500 block">{row.inGameId}</span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-2 py-3 text-center text-slate-400 text-xs">{row.played}</td>
                  <td className="px-2 py-3 text-center text-emerald-400 font-semibold text-xs">{row.won}</td>
                  <td className="px-2 py-3 text-center text-amber-400 font-medium text-xs">{row.drawn}</td>
                  <td className="px-2 py-3 text-center text-red-400 font-medium text-xs">{row.lost}</td>
                  <td className="px-2 py-3 text-center text-slate-400 text-xs hidden sm:table-cell">{row.goalsFor}</td>
                  <td className="px-2 py-3 text-center text-slate-400 text-xs hidden sm:table-cell">{row.goalsAgainst}</td>
                  <td className="px-2 py-3 text-center text-xs">
                    <span className={row.goalDifference > 0 ? 'text-emerald-400' : row.goalDifference < 0 ? 'text-red-400' : 'text-slate-500'}>
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </span>
                  </td>

                  {/* Points — highlighted */}
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-9 h-7 rounded-lg text-sm font-bold
                      ${row.position === 1
                        ? 'bg-amber-500/20 text-amber-300'
                        : isMe
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-slate-800/60 text-slate-300'
                      }`}>
                      {row.points}
                    </span>
                  </td>

                  {/* Form */}
                  <td className="px-2 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-0.5 justify-center">
                      {row.form.length > 0
                        ? row.form.slice(-5).map((r, i) => <FormBadge key={i} result={r} />)
                        : <span className="text-[10px] text-slate-600">—</span>
                      }
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Legend */}
        <div className="flex items-center gap-5 px-4 py-2.5 bg-slate-900/60 border-t border-slate-800 text-[10px] text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-4 rounded-sm bg-amber-400 inline-block" /> 1st place
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-4 rounded-sm bg-emerald-500 inline-block" /> Top 3
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-4 rounded-sm bg-red-500/60 inline-block" /> Bottom 3
          </span>
          <span className="ml-auto hidden sm:flex items-center gap-3">
            <span>P = Played</span>
            <span>W/D/L = Win/Draw/Loss</span>
            <span>GD = Goal Diff</span>
            <span>Pts = Points</span>
          </span>
        </div>
      </div>
    </div>
  );
}
