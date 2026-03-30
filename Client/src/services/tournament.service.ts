import { apiGet, apiPost, apiDelete } from '../utils/api.utils';
import { TOURNAMENT_ENDPOINTS } from '../config/api.config';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TournamentGame {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface TournamentSchedule {
  registrationStart?: string;
  registrationEnd?: string;
  tournamentStart?: string;
  tournamentEnd?: string;
  checkInStart?: string;
  checkInEnd?: string;
}

export interface PrizeDistribution {
  position: number;
  percentage: number;
  amount?: number;
}

export interface Tournament {
  id: string;
  title: string;
  description?: string;
  game?: TournamentGame;
  organizerId: string;
  organizerName?: string;
  tournamentType?: string;
  format?: string;
  isFree: boolean;
  entryFee: number;
  currency: string;
  maxParticipants: number;
  minParticipants: number;
  currentCount: number;
  status: string;
  schedule: TournamentSchedule;
  prizePool?: number;
  prizeDistribution?: PrizeDistribution[];
  thumbnailUrl?: string;
  bannerUrl?: string;
  rules?: string;
  region?: string;
  visibility: string;
  isRegistered?: boolean;
}

export interface TournamentFilters {
  page?: number;
  limit?: number;
  game?: string;
  status?: string;
  isFree?: boolean;
  search?: string;
}

export interface TournamentsResult {
  tournaments: Tournament[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface RegistrationPayload {
  inGameId: string;
  registrationType?: 'solo' | 'team';
  teamId?: string;
}

export interface RegistrationResult {
  registrationId: string;
  status: string;
  message?: string;
}

export interface CanRegisterResult {
  canRegister: boolean;
  reason?: string;
}

// ─── Mappers ────────────────────────────────────────────────────────────────

export function mapTournament(raw: Record<string, unknown>): Tournament {
  const game = (raw.game_id ?? raw.game ?? {}) as Record<string, unknown>;
  const schedule = (raw.schedule ?? {}) as Record<string, unknown>;
  const prize = (raw.prize_structure ?? {}) as Record<string, unknown>;
  const capacity = (raw.capacity ?? {}) as Record<string, unknown>;
  const organizer = (raw.organizer_id ?? {}) as Record<string, unknown>;

  return {
    id: String(raw._id ?? raw.id ?? ''),
    title: String(raw.title ?? ''),
    description: raw.description as string | undefined,
    game: game._id
      ? {
          id: String(game._id ?? ''),
          name: String(game.name ?? ''),
          logoUrl: game.logo_url as string | undefined,
        }
      : undefined,
    organizerId: String(organizer._id ?? raw.organizer_id ?? ''),
    organizerName: (organizer.username ?? organizer.first_name) as string | undefined,
    tournamentType: raw.tournament_type as string | undefined,
    format: raw.format as string | undefined,
    isFree: Boolean(raw.is_free ?? false),
    entryFee: Number(raw.entry_fee ?? 0),
    currency: String(raw.currency ?? 'GHS'),
    maxParticipants: Number(capacity.max_participants ?? raw.max_participants ?? 0),
    minParticipants: Number(capacity.min_participants ?? raw.min_participants ?? 0),
    currentCount: Number(capacity.current_count ?? raw.current_count ?? 0),
    status: String(raw.status ?? 'draft'),
    schedule: {
      registrationStart: schedule.registration_start as string | undefined,
      registrationEnd: schedule.registration_end as string | undefined,
      tournamentStart: schedule.tournament_start as string | undefined,
      tournamentEnd: schedule.tournament_end as string | undefined,
      checkInStart: schedule.check_in_start as string | undefined,
      checkInEnd: schedule.check_in_end as string | undefined,
    },
    prizePool: prize.net_pool as number | undefined,
    prizeDistribution: (prize.distribution as Record<string, unknown>[] | undefined)?.map((d) => ({
      position: Number(d.position ?? 0),
      percentage: Number(d.percentage ?? 0),
      amount: d.amount as number | undefined,
    })),
    thumbnailUrl: raw.thumbnail_url as string | undefined,
    bannerUrl: raw.banner_url as string | undefined,
    rules: (raw.rules as Record<string, unknown>)?.description as string | undefined,
    region: raw.region as string | undefined,
    visibility: String(raw.visibility ?? 'public'),
  };
}

// ─── Service ────────────────────────────────────────────────────────────────

export const tournamentService = {
  async getTournaments(filters: TournamentFilters = {}): Promise<TournamentsResult> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.game) params.set('game', filters.game);
    if (filters.status) params.set('status', filters.status);
    if (filters.isFree !== undefined) params.set('is_free', String(filters.isFree));
    if (filters.search) params.set('search', filters.search);

    const url = params.toString()
      ? `${TOURNAMENT_ENDPOINTS.TOURNAMENTS}?${params}`
      : TOURNAMENT_ENDPOINTS.TOURNAMENTS;

    const response = await apiGet(url);
    if (!response.success) return { tournaments: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } };

    const data = response.data as Record<string, unknown>;
    const list = Array.isArray(data) ? data : ((data.tournaments ?? data.data ?? []) as Record<string, unknown>[]);
    const pagination = (data.pagination ?? { total: list.length, page: 1, limit: 10, pages: 1 }) as Record<string, unknown>;

    return {
      tournaments: list.map((t) => mapTournament(t as Record<string, unknown>)),
      pagination: {
        total: Number(pagination.total ?? 0),
        page: Number(pagination.page ?? 1),
        limit: Number(pagination.limit ?? 10),
        pages: Number(pagination.pages ?? 1),
      },
    };
  },

  async getTournamentDetail(tournamentId: string): Promise<Tournament | null> {
    const response = await apiGet(`${TOURNAMENT_ENDPOINTS.TOURNAMENT_DETAIL}/${tournamentId}`);
    if (!response.success) return null;

    const data = response.data as Record<string, unknown>;
    const raw = (data.tournament ?? data) as Record<string, unknown>;
    return mapTournament(raw);
  },

  async canRegister(tournamentId: string): Promise<CanRegisterResult> {
    const response = await apiGet(
      `${TOURNAMENT_ENDPOINTS.VALIDATION_CAN_REGISTER}/${tournamentId}/can-register`,
    );
    if (!response.success) return { canRegister: false, reason: 'Unable to check eligibility' };

    const data = response.data as Record<string, unknown>;
    return {
      canRegister: Boolean(data.can_register ?? data.canRegister ?? false),
      reason: data.reason as string | undefined,
    };
  },

  async register(tournamentId: string, payload: RegistrationPayload): Promise<RegistrationResult> {
    const body = {
      in_game_id: payload.inGameId,
      registration_type: payload.registrationType ?? 'solo',
      ...(payload.teamId && { team_id: payload.teamId }),
    };
    const response = await apiPost(
      `${TOURNAMENT_ENDPOINTS.REGISTER}/${tournamentId}/register`,
      body,
    );

    if (!response.success) {
      const msg = response.error?.message ?? 'Registration failed';
      throw new Error(msg);
    }

    const data = response.data as Record<string, unknown>;
    const reg = (data.registration ?? data) as Record<string, unknown>;
    return {
      registrationId: String(reg._id ?? reg.id ?? ''),
      status: String(reg.status ?? 'registered'),
      message: data.message as string | undefined,
    };
  },

  async unregister(tournamentId: string): Promise<void> {
    const response = await apiDelete(
      `${TOURNAMENT_ENDPOINTS.UNREGISTER}/${tournamentId}/unregister`,
    );
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to unregister';
      throw new Error(msg);
    }
  },
};
