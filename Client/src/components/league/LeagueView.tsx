import { useState, useEffect } from 'react';
import { Trophy, CalendarDays, Loader2, RefreshCw } from 'lucide-react';
import { tournamentService } from '../../services/tournament.service';
import type { LeagueTableRow, LeagueMatchweek } from '../../services/tournament.service';
import { LeagueTable } from './LeagueTable';
import { MatchweekFixtures } from './MatchweekFixtures';
import { MatchActionModal } from './MatchActionModal';
import { OrganizerMatchModal } from './OrganizerMatchModal';

interface LeagueViewProps {
  tournamentId: string;
  currentMatchweek: number;
  totalMatchweeks: number;
  legs?: number;
  highlightUserId?: string;
  isOrganizer?: boolean;
}

type ActiveTab = 'table' | 'fixtures';

export function LeagueView({
  tournamentId,
  currentMatchweek,
  totalMatchweeks,
  legs = 1,
  highlightUserId,
  isOrganizer = false,
}: LeagueViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('table');
  const [table, setTable] = useState<LeagueTableRow[]>([]);
  const [matchweeks, setMatchweeks] = useState<LeagueMatchweek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(currentMatchweek || 1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  async function loadData(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [tableData, mwData] = await Promise.all([
        tournamentService.getLeagueTable(tournamentId),
        tournamentService.getLeagueMatchweeks(tournamentId),
      ]);
      setTable(tableData);
      setMatchweeks(mwData);
      if (mwData.length > 0 && selectedWeek === 0) {
        setSelectedWeek(currentMatchweek || mwData[0].week);
      }
    } catch {
      setError('Failed to load league data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'table', label: 'Standings', icon: <Trophy className="w-4 h-4" /> },
    { id: 'fixtures', label: 'Fixtures', icon: <CalendarDays className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {totalMatchweeks > 0 && currentMatchweek > 0 && (
            <span className="text-xs text-slate-500 hidden sm:block">
              Week{' '}
              {legs >= 2 ? (
                <span className="text-slate-300 font-semibold">{currentMatchweek - 1} - {currentMatchweek}</span>
              ) : (
                <span className="text-slate-300 font-semibold">{currentMatchweek}</span>
              )}
              {' / '}{totalMatchweeks}
            </span>
          )}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading league data…</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={() => loadData()}
            className="text-sm text-cyan-400 hover:text-cyan-300 underline"
          >
            Try again
          </button>
        </div>
      ) : activeTab === 'table' ? (
        <LeagueTable table={table} highlightUserId={highlightUserId} />
      ) : (
        <MatchweekFixtures
          matchweeks={matchweeks}
          currentWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          highlightUserId={highlightUserId}
          onMatchClick={(id) => setActiveMatchId(id)}
        />
      )}

      {/* Player match action modal */}
      {activeMatchId && highlightUserId && !isOrganizer && (
        <MatchActionModal
          matchId={activeMatchId}
          currentUserId={highlightUserId}
          onClose={() => setActiveMatchId(null)}
          onActionComplete={() => {
            setActiveMatchId(null);
            loadData(true);
          }}
        />
      )}

      {/* Organizer match modal */}
      {activeMatchId && isOrganizer && (
        <OrganizerMatchModal
          matchId={activeMatchId}
          onClose={() => setActiveMatchId(null)}
          onActionComplete={() => {
            setActiveMatchId(null);
            loadData(true);
          }}
        />
      )}
    </div>
  );
}
