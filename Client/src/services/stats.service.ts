import { apiGet } from '../utils/api.utils';
import { TOURNAMENT_ENDPOINTS } from '../config/api.config';

// Client for the Phase 1 stats engine endpoints (see new_build.md).

export interface CareerStatLine {
  game?: { id: string; name: string; slug?: string } | null;
  matches_played: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  goals_for: number;
  goals_against: number;
  clean_sheets: number;
  win_rate: number;
  avg_goals_per_match: number;
  current_win_streak: number;
  best_win_streak: number;
  best_clean_sheet_streak: number;
  tournaments_played: number;
  tournament_wins: number;
  podium_finishes: number;
}

export interface PlayerCareerStats {
  username: string;
  per_game: CareerStatLine[];
  totals: CareerStatLine;
}

export interface TournamentStatRow {
  user_id: string;
  username?: string;
  avatar_url?: string;
  goals?: number;
  clean_sheets?: number;
  goals_conceded?: number;
  matches?: number;
}

export interface MatchHighlight {
  round_label: string;
  sides: { user_id: string; username?: string; score: number }[];
  total_goals: number;
  margin: number;
}

export interface CardSponsor {
  name: string;
  logo_url: string;
  size: 'small' | 'medium' | 'large';
  display_order: number;
  website_url?: string;
}

export interface TournamentStats {
  top_scorers: TournamentStatRow[];
  most_clean_sheets: TournamentStatRow[];
  best_defence: TournamentStatRow[];
  most_matches: TournamentStatRow[];
  completed_matches: number;
  champion?: { user_id: string; username?: string; avatar_url?: string } | null;
  highest_scoring_match?: MatchHighlight | null;
  most_one_sided?: MatchHighlight | null;
  sponsors?: CardSponsor[];
}

export interface JourneyStep {
  round_label: string;
  opponent: { username?: string; avatar_url?: string };
  my_score: number;
  opponent_score: number;
  clean_sheet: boolean;
  outcome: 'win' | 'loss' | 'draw';
}

export interface PlayerJourney {
  username: string;
  avatar_url?: string;
  tournament: { id: string; title: string; date?: string; organizer_name?: string; sponsors?: CardSponsor[] };
  steps: JourneyStep[];
  final_result: string;
}

export type LeaderboardMetric =
  | 'goals'
  | 'tournament_wins'
  | 'clean_sheet_streak'
  | 'podiums'
  | 'clean_sheets'
  | 'matches_won';

export interface LeaderboardEntry extends CareerStatLine {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  value: number;
}

export interface LeaderboardResult {
  metric: string;
  entries: LeaderboardEntry[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export interface PlayerBadgeItem {
  badge_type: string;
  game?: { id: string; name: string } | null;
  tournament_id?: string;
  value?: number;
  awarded_at: string;
}

export interface HeadToHead {
  player: { username: string; avatar_url?: string };
  opponent: { username: string; avatar_url?: string };
  summary: { played: number; wins: number; draws: number; losses: number; goals_for: number; goals_against: number };
  matches: {
    tournament_title?: string;
    round_label: string;
    my_score: number;
    opponent_score: number;
    outcome: 'win' | 'loss' | 'draw';
    date?: string;
  }[];
}

export interface PlayerSearchResult {
  username: string;
  role?: string;
  avatar_url?: string;
  country?: string;
}

const PLAYER_SEARCH_URL = 'https://api-apexarenas.onrender.com/api/v1/auth/user/public-search';

export const statsService = {
  async getHeadToHead(username: string, opponent: string): Promise<HeadToHead | null> {
    const res = await apiGet(
      `${TOURNAMENT_ENDPOINTS.STATS_PLAYER}/${encodeURIComponent(username)}/h2h/${encodeURIComponent(opponent)}`,
      { skipAuth: true },
    );
    if (!res.success) return null;
    return res.data as HeadToHead;
  },

  async searchPlayers(query: string): Promise<PlayerSearchResult[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const res = await apiGet(`${PLAYER_SEARCH_URL}?q=${encodeURIComponent(q)}`, {
      skipAuth: true,
      skipCache: true,
    });
    if (!res.success) return [];
    const data = res.data as { players?: PlayerSearchResult[] };
    return data.players ?? [];
  },

  async getPlayerBadges(username: string): Promise<PlayerBadgeItem[]> {
    const res = await apiGet(
      `${TOURNAMENT_ENDPOINTS.STATS_PLAYER}/${encodeURIComponent(username)}/badges`,
      { skipAuth: true },
    );
    if (!res.success) return [];
    const data = res.data as { badges?: PlayerBadgeItem[] };
    return data.badges ?? [];
  },

  async getPlayerCareerStats(username: string): Promise<PlayerCareerStats | null> {
    const res = await apiGet(
      `${TOURNAMENT_ENDPOINTS.STATS_PLAYER}/${encodeURIComponent(username)}`,
      { skipAuth: true },
    );
    if (!res.success) return null;
    return res.data as PlayerCareerStats;
  },

  async getPlayerJourney(tournamentId: string, username: string): Promise<PlayerJourney | null> {
    const res = await apiGet(
      `${TOURNAMENT_ENDPOINTS.STATS_TOURNAMENT}/${encodeURIComponent(tournamentId)}/journey/${encodeURIComponent(username)}`,
      { skipAuth: true },
    );
    if (!res.success) return null;
    return res.data as PlayerJourney;
  },

  async getTournamentStats(tournamentId: string): Promise<TournamentStats | null> {
    const res = await apiGet(
      `${TOURNAMENT_ENDPOINTS.STATS_TOURNAMENT}/${encodeURIComponent(tournamentId)}`,
      { skipAuth: true },
    );
    if (!res.success) return null;
    return res.data as TournamentStats;
  },

  async getLeaderboard(params: {
    metric: LeaderboardMetric;
    gameId?: string;
    page?: number;
    limit?: number;
  }): Promise<LeaderboardResult | null> {
    const search = new URLSearchParams({ metric: params.metric });
    if (params.gameId) search.set('game_id', params.gameId);
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const res = await apiGet(`${TOURNAMENT_ENDPOINTS.STATS_LEADERBOARD}?${search.toString()}`, {
      skipAuth: true,
    });
    if (!res.success) return null;
    return res.data as LeaderboardResult;
  },
};
