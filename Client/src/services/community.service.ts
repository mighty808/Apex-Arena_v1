import { apiGet, apiPost, apiDelete } from '../utils/api.utils';

// Client for the community module (feed/votes/comments) and the LFG board
// (team recruitment, lives under the tournament module). See new_build.md
// Phase 5.

const COMMUNITY_BASE = 'https://api-apexarenas.onrender.com/api/v1/community';
const RECRUIT_BASE = 'https://api-apexarenas.onrender.com/api/v1/tournament/teams-recruit';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostAuthor {
  id: string;
  username: string;
  role?: string;
  avatarUrl?: string;
}

export interface CommunityPost {
  id: string;
  author: PostAuthor;
  postType: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  upvotes: number;
  downvotes: number;
  score: number;
  commentCount: number;
  viewerVote: 'up' | 'down' | null;
  isPinned: boolean;
  createdAt?: string;
}

export interface FeedResult {
  posts: CommunityPost[];
  total: number;
  page: number;
  hasMore: boolean;
}

export type FeedSort = 'recent' | 'top' | 'trending';

export interface CommunityComment {
  id: string;
  author: PostAuthor;
  content: string;
  upvotes: number;
  replyCount: number;
  createdAt?: string;
}

export interface CommentThread {
  comment: CommunityComment;
  replies: CommunityComment[];
}

export interface VoteResult {
  action: 'added' | 'changed' | 'removed';
  direction: 'up' | 'down' | null;
  upvotes: number;
  downvotes: number;
  score: number;
}

export interface LfgPost {
  id: string;
  title: string;
  description: string;
  postingAs: string;
  team?: { name: string; tag?: string; logoUrl?: string };
  game?: { name: string; slug?: string; logoUrl?: string };
  postedBy?: { username?: string; avatarUrl?: string };
  roles: string[];
  skillLevel: string;
  region?: string;
  microphoneRequired: boolean;
  contactMethod?: string;
  applicantCount: number;
  createdAt?: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapAuthor(raw: unknown): PostAuthor {
  const a = (raw ?? {}) as Record<string, unknown>;
  const profile = (a.profile ?? {}) as Record<string, unknown>;
  return {
    id: String(a._id ?? ''),
    username: String(a.username ?? 'Unknown'),
    role: a.role ? String(a.role) : undefined,
    avatarUrl: profile.avatar_url ? String(profile.avatar_url) : undefined,
  };
}

function mapPost(raw: Record<string, unknown>): CommunityPost {
  return {
    id: String(raw._id ?? ''),
    author: mapAuthor(raw.author_id),
    postType: String(raw.post_type ?? 'general'),
    title: String(raw.title ?? ''),
    content: String(raw.content ?? ''),
    images: Array.isArray(raw.images) ? (raw.images as string[]) : [],
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    upvotes: Number(raw.upvotes ?? 0),
    downvotes: Number(raw.downvotes ?? 0),
    score: Number(raw.score ?? 0),
    commentCount: Number(raw.comment_count ?? 0),
    viewerVote: (raw.viewer_vote as 'up' | 'down' | null | undefined) ?? null,
    isPinned: Boolean(raw.is_pinned ?? false),
    createdAt: raw.created_at ? String(raw.created_at) : undefined,
  };
}

function mapComment(raw: Record<string, unknown>): CommunityComment {
  return {
    id: String(raw._id ?? ''),
    author: mapAuthor(raw.author_id),
    content: String(raw.content ?? ''),
    upvotes: Number(raw.upvotes ?? 0),
    replyCount: Number(raw.reply_count ?? 0),
    createdAt: raw.created_at ? String(raw.created_at) : undefined,
  };
}

function mapLfgPost(raw: Record<string, unknown>): LfgPost {
  const team = (raw.team_id ?? {}) as Record<string, unknown>;
  const game = (raw.game_id ?? {}) as Record<string, unknown>;
  const postedBy = (raw.posted_by ?? {}) as Record<string, unknown>;
  const postedByProfile = (postedBy.profile ?? {}) as Record<string, unknown>;
  return {
    id: String(raw._id ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    postingAs: String(raw.posting_as ?? 'team_looking_for_player'),
    team: team && team.name ? { name: String(team.name), tag: team.tag ? String(team.tag) : undefined, logoUrl: team.logo_url ? String(team.logo_url) : undefined } : undefined,
    game: game && game.name ? { name: String(game.name), slug: game.slug ? String(game.slug) : undefined, logoUrl: game.logo_url ? String(game.logo_url) : undefined } : undefined,
    postedBy: postedBy.username
      ? { username: String(postedBy.username), avatarUrl: postedByProfile.avatar_url ? String(postedByProfile.avatar_url) : undefined }
      : undefined,
    roles: Array.isArray(raw.looking_for_roles) ? (raw.looking_for_roles as string[]) : [],
    skillLevel: String(raw.looking_for_skill_level ?? 'any'),
    region: raw.region ? String(raw.region) : undefined,
    microphoneRequired: Boolean(raw.microphone_required ?? false),
    contactMethod: raw.contact_method ? String(raw.contact_method) : undefined,
    applicantCount: Number(raw.applicant_count ?? 0),
    createdAt: raw.created_at ? String(raw.created_at) : undefined,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const communityService = {
  async getFeed(params: { sort?: FeedSort; gameId?: string; page?: number; limit?: number } = {}): Promise<FeedResult> {
    const search = new URLSearchParams();
    if (params.sort) search.set('sort', params.sort);
    if (params.gameId) search.set('game_id', params.gameId);
    if (params.page) search.set('page', String(params.page));
    search.set('limit', String(params.limit ?? 20));

    // Feed is public but sends viewer_vote when authenticated — keep auth on
    const res = await apiGet(`${COMMUNITY_BASE}/posts?${search.toString()}`, { skipCache: true });
    if (!res.success) throw new Error(res.error?.message ?? 'Failed to load feed');

    const data = res.data as Record<string, unknown>;
    const list = (data.posts ?? []) as Record<string, unknown>[];
    return {
      posts: list.map(mapPost),
      total: Number(data.total ?? list.length),
      page: Number(data.page ?? 1),
      hasMore: Boolean(data.has_more ?? false),
    };
  },

  async createPost(input: { title: string; content: string; gameId?: string; tags?: string[] }): Promise<void> {
    const res = await apiPost(`${COMMUNITY_BASE}/posts`, {
      title: input.title,
      content: input.content,
      ...(input.gameId ? { game_id: input.gameId } : {}),
      ...(input.tags && input.tags.length > 0 ? { tags: input.tags } : {}),
    });
    if (!res.success) throw new Error(res.error?.message ?? 'Failed to create post');
  },

  /** Owner-only server-side (postOwnerMiddleware); admins moderate via the Admin app. */
  async deletePost(postId: string): Promise<void> {
    const res = await apiDelete(`${COMMUNITY_BASE}/posts/${postId}`);
    if (!res.success) throw new Error(res.error?.message ?? 'Failed to delete post');
  },

  /** Voting the same direction again removes the vote (backend toggle). */
  async votePost(postId: string, direction: 'up' | 'down'): Promise<VoteResult> {
    const res = await apiPost(`${COMMUNITY_BASE}/posts/${postId}/vote`, { direction });
    if (!res.success) throw new Error(res.error?.message ?? 'Failed to vote');
    const data = res.data as Record<string, unknown>;
    return {
      action: data.action as VoteResult['action'],
      direction: (data.direction as VoteResult['direction']) ?? null,
      upvotes: Number(data.new_upvotes ?? 0),
      downvotes: Number(data.new_downvotes ?? 0),
      score: Number(data.new_score ?? 0),
    };
  },

  async getComments(postId: string, page = 1): Promise<{ threads: CommentThread[]; hasMore: boolean }> {
    const res = await apiGet(`${COMMUNITY_BASE}/posts/${postId}/comments?page=${page}&limit=20`, {
      skipAuth: true,
      skipCache: true,
    });
    if (!res.success) throw new Error(res.error?.message ?? 'Failed to load comments');
    const data = res.data as Record<string, unknown>;
    const threads = ((data.threads ?? []) as Record<string, unknown>[]).map((t) => ({
      comment: mapComment((t.comment ?? {}) as Record<string, unknown>),
      replies: ((t.replies ?? []) as Record<string, unknown>[]).map(mapComment),
    }));
    return { threads, hasMore: Boolean(data.has_more ?? false) };
  },

  async addComment(postId: string, content: string, parentCommentId?: string): Promise<void> {
    const res = await apiPost(`${COMMUNITY_BASE}/posts/${postId}/comments`, {
      content,
      ...(parentCommentId ? { parent_comment_id: parentCommentId } : {}),
    });
    if (!res.success) throw new Error(res.error?.message ?? 'Failed to add comment');
  },

  // ── LFG board (team recruitment) ──

  async getLfgPosts(params: { gameId?: string; skillLevel?: string; search?: string } = {}): Promise<LfgPost[]> {
    const search = new URLSearchParams();
    if (params.gameId) search.set('game_id', params.gameId);
    if (params.skillLevel) search.set('skill_level', params.skillLevel);
    if (params.search) search.set('search', params.search);

    const qs = search.toString();
    const res = await apiGet(`${RECRUIT_BASE}${qs ? `?${qs}` : ''}`, { skipAuth: true, skipCache: true });
    if (!res.success) throw new Error(res.error?.message ?? 'Failed to load LFG posts');
    const list = (Array.isArray(res.data) ? res.data : []) as Record<string, unknown>[];
    return list.map(mapLfgPost);
  },

  async applyToLfgPost(postId: string): Promise<void> {
    const res = await apiPost(`${RECRUIT_BASE}/recruitment/${postId}/apply`, {});
    if (!res.success) throw new Error(res.error?.message ?? 'Failed to apply');
  },

  /** Player-side "looking for team" post (spec §6.1). */
  async createLookingForTeamPost(input: {
    gameId: string;
    title: string;
    description: string;
    roles?: string[];
    skillLevel?: string;
    region?: string;
  }): Promise<void> {
    const res = await apiPost(`${RECRUIT_BASE}/looking-for-team`, {
      game_id: input.gameId,
      title: input.title,
      description: input.description,
      ...(input.roles && input.roles.length > 0 ? { looking_for_roles: input.roles } : {}),
      ...(input.skillLevel ? { looking_for_skill_level: input.skillLevel } : {}),
      ...(input.region ? { region: input.region } : {}),
    });
    if (!res.success) throw new Error(res.error?.message ?? 'Failed to create post');
  },
};

// ─── Match hype reactions (spec §6.3) ─────────────────────────────────────────

const MATCHES_BASE = 'https://api-apexarenas.onrender.com/api/v1/tournament/matches';

export type HypeReaction = 'fire' | 'clap' | 'heart' | 'goat';

export interface HypeCounts {
  totals: { target_user_id: string; count: number; by_reaction: Record<string, number> }[];
  total: number;
  viewer_reaction: { target_user_id: string; reaction: HypeReaction } | null;
  crowd_favourite: string | null;
}

export const hypeService = {
  async getCounts(matchId: string): Promise<HypeCounts | null> {
    const res = await apiGet(`${MATCHES_BASE}/${matchId}/hype`, { skipCache: true });
    if (!res.success) return null;
    return res.data as HypeCounts;
  },

  /** Same target+reaction again removes it (backend toggle). */
  async react(matchId: string, targetUserId: string, reaction: HypeReaction): Promise<HypeCounts | null> {
    const res = await apiPost(`${MATCHES_BASE}/${matchId}/hype`, {
      target_user_id: targetUserId,
      reaction,
    });
    if (!res.success) throw new Error(res.error?.message ?? 'Failed to react');
    return res.data as HypeCounts;
  },
};
