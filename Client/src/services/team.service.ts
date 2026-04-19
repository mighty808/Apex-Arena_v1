import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api.utils';
import { TOURNAMENT_ENDPOINTS } from '../config/api.config';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TeamMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: 'captain' | 'member';
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  tag?: string;
  description?: string;
  logoUrl?: string;
  captainId: string;
  captainUsername?: string;
  members: TeamMember[];
  memberCount: number;
  maxSize?: number;
  gameId?: string;
  gameName?: string;
  isOpen: boolean;
  createdAt: string;
}

export interface CreateTeamPayload {
  name: string;
  tag?: string;
  description?: string;
  logoUrl?: string;
  gameId?: string;
  maxSize?: number;
  isOpen?: boolean;
}

export interface RecruitmentPost {
  id: string;
  teamId: string;
  teamName: string;
  title: string;
  description?: string;
  requirements?: string;
  positions?: number;
  gameId?: string;
  gameName?: string;
  status: 'open' | 'closed' | 'filled';
  applicantCount: number;
  createdAt: string;
  expiresAt?: string;
}

export interface RecruitmentApplication {
  id: string;
  postId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
}

export interface TeamFilters {
  page?: number;
  limit?: number;
  gameId?: string;
  search?: string;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapMember(raw: Record<string, unknown>): TeamMember {
  const user = (raw.user_id ?? raw.user ?? {}) as Record<string, unknown>;
  const profile = (user.profile ?? {}) as Record<string, unknown>;
  const firstName = String(profile.first_name ?? user.first_name ?? '');
  const lastName = String(profile.last_name ?? user.last_name ?? '');
  return {
    userId: String(user._id ?? user.id ?? raw.user_id ?? ''),
    username: String(user.username ?? raw.username ?? ''),
    displayName: `${firstName} ${lastName}`.trim() || String(user.username ?? raw.username ?? ''),
    avatarUrl: (profile.avatar_url ?? user.avatar_url) as string | undefined,
    role: (raw.role as TeamMember['role']) ?? 'member',
    joinedAt: String(raw.joined_at ?? raw.createdAt ?? raw.created_at ?? ''),
  };
}

function mapTeam(raw: Record<string, unknown>): Team {
  const captain = (raw.captain_id ?? raw.captain ?? {}) as Record<string, unknown>;
  const game = (raw.game_id ?? raw.game ?? {}) as Record<string, unknown>;
  const members = (raw.members ?? []) as Record<string, unknown>[];
  return {
    id: String(raw._id ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    tag: raw.tag as string | undefined,
    description: raw.description as string | undefined,
    logoUrl: (raw.logo_url ?? raw.logoUrl) as string | undefined,
    captainId: String(
      typeof captain === 'object' ? (captain._id ?? captain.id ?? '') : captain
    ),
    captainUsername: typeof captain === 'object' ? (captain.username as string | undefined) : undefined,
    members: members.map(mapMember),
    memberCount: Number(raw.member_count ?? raw.memberCount ?? members.length ?? 0),
    maxSize: raw.max_size as number | undefined,
    gameId: typeof game === 'object' ? String(game._id ?? game.id ?? '') : String(game ?? ''),
    gameName: typeof game === 'object' ? (game.name as string | undefined) : undefined,
    isOpen: Boolean(raw.is_open ?? raw.isOpen ?? false),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
  };
}

function mapRecruitmentPost(raw: Record<string, unknown>): RecruitmentPost {
  const team = (raw.team_id ?? raw.team ?? {}) as Record<string, unknown>;
  const game = (raw.game_id ?? raw.game ?? {}) as Record<string, unknown>;
  return {
    id: String(raw._id ?? raw.id ?? ''),
    teamId: String(typeof team === 'object' ? (team._id ?? team.id ?? '') : team),
    teamName: typeof team === 'object' ? String(team.name ?? '') : '',
    title: String(raw.title ?? ''),
    description: raw.description as string | undefined,
    requirements: raw.requirements as string | undefined,
    positions: raw.positions as number | undefined,
    gameId: typeof game === 'object' ? String(game._id ?? game.id ?? '') : String(game ?? ''),
    gameName: typeof game === 'object' ? (game.name as string | undefined) : undefined,
    status: (raw.status as RecruitmentPost['status']) ?? 'open',
    applicantCount: Number(raw.applicant_count ?? raw.applicantCount ?? 0),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    expiresAt: (raw.expires_at ?? raw.expiresAt) as string | undefined,
  };
}

function mapApplication(raw: Record<string, unknown>): RecruitmentApplication {
  const user = (raw.user_id ?? raw.user ?? {}) as Record<string, unknown>;
  const profile = (user.profile ?? {}) as Record<string, unknown>;
  const firstName = String(profile.first_name ?? user.first_name ?? '');
  const lastName = String(profile.last_name ?? user.last_name ?? '');
  return {
    id: String(raw._id ?? raw.id ?? ''),
    postId: String(raw.post_id ?? raw.postId ?? ''),
    userId: String(user._id ?? user.id ?? raw.user_id ?? ''),
    username: String(user.username ?? raw.username ?? ''),
    displayName: `${firstName} ${lastName}`.trim() || String(user.username ?? ''),
    avatarUrl: (profile.avatar_url ?? user.avatar_url) as string | undefined,
    message: raw.message as string | undefined,
    status: (raw.status as RecruitmentApplication['status']) ?? 'pending',
    appliedAt: String(raw.applied_at ?? raw.created_at ?? raw.createdAt ?? ''),
    reviewedAt: (raw.reviewed_at ?? raw.reviewedAt) as string | undefined,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const teamService = {

  // ─── Teams ─────────────────────────────────────────────────────────────────

  async getTeams(filters: TeamFilters = {}): Promise<{ teams: Team[]; total: number }> {
    const query = new URLSearchParams();
    if (filters.page) query.set('page', String(filters.page));
    if (filters.limit) query.set('limit', String(filters.limit));
    if (filters.gameId) query.set('game_id', filters.gameId);
    if (filters.search) query.set('search', filters.search);
    const url = query.toString()
      ? `${TOURNAMENT_ENDPOINTS.TEAMS}?${query}`
      : TOURNAMENT_ENDPOINTS.TEAMS;
    const response = await apiGet(url);
    if (!response.success) return { teams: [], total: 0 };
    const data = response.data as Record<string, unknown>;
    const list = (Array.isArray(data) ? data : (data.teams ?? data.data ?? [])) as Record<string, unknown>[];
    const total = Number((data.pagination as Record<string, unknown>)?.total ?? data.total ?? list.length);
    return { teams: list.map(mapTeam), total };
  },

  async getTeamDetail(teamId: string): Promise<Team | null> {
    const response = await apiGet(`${TOURNAMENT_ENDPOINTS.TEAM_DETAIL}/${teamId}`);
    if (!response.success) return null;
    const data = response.data as Record<string, unknown>;
    return mapTeam((data.team ?? data) as Record<string, unknown>);
  },

  async createTeam(payload: CreateTeamPayload): Promise<Team> {
    const response = await apiPost(TOURNAMENT_ENDPOINTS.TEAMS, {
      name: payload.name,
      tag: payload.tag,
      description: payload.description,
      logo_url: payload.logoUrl,
      game_id: payload.gameId,
      max_size: payload.maxSize,
      is_open: payload.isOpen ?? false,
    });
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to create team';
      throw new Error(msg);
    }
    const data = response.data as Record<string, unknown>;
    return mapTeam((data.team ?? data) as Record<string, unknown>);
  },

  async updateTeam(teamId: string, updates: Partial<CreateTeamPayload>): Promise<Team> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.tag !== undefined) body.tag = updates.tag;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.logoUrl !== undefined) body.logo_url = updates.logoUrl;
    if (updates.gameId !== undefined) body.game_id = updates.gameId;
    if (updates.maxSize !== undefined) body.max_size = updates.maxSize;
    if (updates.isOpen !== undefined) body.is_open = updates.isOpen;
    const response = await apiPatch(`${TOURNAMENT_ENDPOINTS.TEAM_DETAIL}/${teamId}`, body);
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to update team';
      throw new Error(msg);
    }
    const data = response.data as Record<string, unknown>;
    return mapTeam((data.team ?? data) as Record<string, unknown>);
  },

  async deleteTeam(teamId: string): Promise<void> {
    const response = await apiDelete(`${TOURNAMENT_ENDPOINTS.TEAM_DETAIL}/${teamId}`);
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to delete team';
      throw new Error(msg);
    }
  },

  async inviteTeamMember(teamId: string, userId: string, message?: string): Promise<void> {
    const response = await apiPost(`${TOURNAMENT_ENDPOINTS.TEAM_INVITE}/${teamId}/invite`, {
      user_id: userId,
      message,
    });
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to send invite';
      throw new Error(msg);
    }
  },

  async respondToTeamInvite(teamId: string, accept: boolean): Promise<void> {
    const response = await apiPost(
      `${TOURNAMENT_ENDPOINTS.TEAM_INVITE_RESPOND}/${teamId}/invite/respond`,
      { action: accept ? 'accept' : 'decline' },
    );
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to respond to invite';
      throw new Error(msg);
    }
  },

  async sendJoinRequest(teamId: string, message?: string): Promise<void> {
    const response = await apiPost(
      `${TOURNAMENT_ENDPOINTS.TEAM_JOIN_REQUEST}/${teamId}/join-request`,
      { message },
    );
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to send join request';
      throw new Error(msg);
    }
  },

  async respondToJoinRequest(teamId: string, requestUserId: string, accept: boolean): Promise<void> {
    const response = await apiPost(
      `${TOURNAMENT_ENDPOINTS.TEAM_JOIN_REQUEST_RESPOND}/${teamId}/join-request/respond`,
      { user_id: requestUserId, action: accept ? 'accept' : 'decline' },
    );
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to respond to join request';
      throw new Error(msg);
    }
  },

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const response = await apiDelete(
      `${TOURNAMENT_ENDPOINTS.TEAM_MEMBER_REMOVE}/${teamId}/members/${userId}`,
    );
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to remove member';
      throw new Error(msg);
    }
  },

  async leaveTeam(teamId: string): Promise<void> {
    const response = await apiPost(
      `${TOURNAMENT_ENDPOINTS.TEAM_LEAVE}/${teamId}/leave`,
      {},
    );
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to leave team';
      throw new Error(msg);
    }
  },

  // ─── Team Recruitment ──────────────────────────────────────────────────────

  async getRecruitmentPosts(teamId: string): Promise<RecruitmentPost[]> {
    const response = await apiGet(`${TOURNAMENT_ENDPOINTS.RECRUITMENT_POSTS}/${teamId}/recruitment`);
    if (!response.success) return [];
    const data = response.data as Record<string, unknown>;
    const list = (Array.isArray(data) ? data : (data.posts ?? data.data ?? [])) as Record<string, unknown>[];
    return list.map(mapRecruitmentPost);
  },

  async createRecruitmentPost(
    teamId: string,
    payload: { title: string; description?: string; requirements?: string; positions?: number; gameId?: string; expiresAt?: string },
  ): Promise<RecruitmentPost> {
    const response = await apiPost(`${TOURNAMENT_ENDPOINTS.RECRUITMENT_POSTS}/${teamId}/recruitment`, {
      title: payload.title,
      description: payload.description,
      requirements: payload.requirements,
      positions: payload.positions,
      game_id: payload.gameId,
      expires_at: payload.expiresAt,
    });
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to create recruitment post';
      throw new Error(msg);
    }
    const data = response.data as Record<string, unknown>;
    return mapRecruitmentPost((data.post ?? data) as Record<string, unknown>);
  },

  async getRecruitmentPostDetail(postId: string): Promise<RecruitmentPost | null> {
    const response = await apiGet(`${TOURNAMENT_ENDPOINTS.RECRUITMENT_POST_DETAIL}/${postId}`);
    if (!response.success) return null;
    const data = response.data as Record<string, unknown>;
    return mapRecruitmentPost((data.post ?? data) as Record<string, unknown>);
  },

  async updateRecruitmentPost(
    postId: string,
    updates: { title?: string; description?: string; requirements?: string; positions?: number; status?: string; expiresAt?: string },
  ): Promise<RecruitmentPost> {
    const body: Record<string, unknown> = {};
    if (updates.title !== undefined) body.title = updates.title;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.requirements !== undefined) body.requirements = updates.requirements;
    if (updates.positions !== undefined) body.positions = updates.positions;
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.expiresAt !== undefined) body.expires_at = updates.expiresAt;
    const response = await apiPatch(`${TOURNAMENT_ENDPOINTS.RECRUITMENT_POST_DETAIL}/${postId}`, body);
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to update recruitment post';
      throw new Error(msg);
    }
    const data = response.data as Record<string, unknown>;
    return mapRecruitmentPost((data.post ?? data) as Record<string, unknown>);
  },

  async deleteRecruitmentPost(postId: string): Promise<void> {
    const response = await apiDelete(`${TOURNAMENT_ENDPOINTS.RECRUITMENT_POST_DETAIL}/${postId}`);
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to delete recruitment post';
      throw new Error(msg);
    }
  },

  async applyToRecruitment(postId: string, message?: string): Promise<void> {
    const response = await apiPost(`${TOURNAMENT_ENDPOINTS.RECRUITMENT_APPLY}/${postId}/apply`, {
      message,
    });
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to apply';
      throw new Error(msg);
    }
  },

  async getRecruitmentApplications(postId: string): Promise<RecruitmentApplication[]> {
    const response = await apiGet(`${TOURNAMENT_ENDPOINTS.RECRUITMENT_APPLICATIONS}/${postId}/applications`);
    if (!response.success) return [];
    const data = response.data as Record<string, unknown>;
    const list = (Array.isArray(data) ? data : (data.applications ?? data.data ?? [])) as Record<string, unknown>[];
    return list.map(mapApplication);
  },

  async respondToApplication(
    postId: string,
    applicationId: string,
    accept: boolean,
  ): Promise<void> {
    const response = await apiPost(
      `${TOURNAMENT_ENDPOINTS.RECRUITMENT_APPLICATION_RESPOND}/${postId}/applications/${applicationId}/respond`,
      { action: accept ? 'accept' : 'reject' },
    );
    if (!response.success) {
      const msg = (response as { error?: { message?: string } }).error?.message ?? 'Failed to respond to application';
      throw new Error(msg);
    }
  },
};
