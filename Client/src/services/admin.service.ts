import { apiGet, apiPost, apiPatch } from '../utils/api.utils';
import { AUTH_ENDPOINTS } from '../config/api.config';
import type { AdminStats, ManagedUser } from '../types/admin.types';

// ─── Mapping ─────────────────────────────────────────────────────────────────

function mapStats(raw: Record<string, unknown>): AdminStats {
  const users = (raw.users ?? {}) as Record<string, unknown>;
  const security = (raw.security ?? {}) as Record<string, unknown>;
  const sessions = (raw.sessions ?? {}) as Record<string, unknown>;
  const system = (raw.system ?? {}) as Record<string, unknown>;

  return {
    users: {
      total: Number(users.total ?? 0),
      active: Number(users.active ?? 0),
      banned: Number(users.banned ?? 0),
      deactivated: Number(users.deactivated ?? 0),
      unverified: Number(users.unverified ?? 0),
      newToday: Number(users.new_today ?? users.newToday ?? 0),
      newThisWeek: Number(users.new_this_week ?? users.newThisWeek ?? 0),
      newThisMonth: Number(users.new_this_month ?? users.newThisMonth ?? 0),
    },
    security: {
      failedLogins24h: Number(security.failed_logins_24h ?? security.failedLogins24h ?? 0),
      lockedAccounts: Number(security.locked_accounts ?? security.lockedAccounts ?? 0),
      suspiciousActivities: Number(security.suspicious_activities ?? security.suspiciousActivities ?? 0),
    },
    sessions: {
      activeSessions: Number(sessions.active_sessions ?? sessions.activeSessions ?? 0),
      averageSessionsPerUser: Number(sessions.average_sessions_per_user ?? sessions.averageSessionsPerUser ?? 0),
    },
    system: {
      uptime: (system.uptime as string) ?? undefined,
      version: (system.version as string) ?? undefined,
    },
  };
}

function mapManagedUser(raw: Record<string, unknown>): ManagedUser {
  const profile = (raw.profile ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.user_id ?? raw._id ?? raw.id ?? ''),
    email: String(raw.email ?? ''),
    username: String(raw.username ?? ''),
    firstName: String(profile.first_name ?? raw.first_name ?? raw.firstName ?? ''),
    lastName: String(profile.last_name ?? raw.last_name ?? raw.lastName ?? ''),
    role: String(raw.role ?? 'player'),
    avatarUrl: (profile.avatar_url ?? raw.avatar_url ?? raw.avatarUrl) as string | undefined,
    isEmailVerified: Boolean(raw.is_email_verified ?? raw.isEmailVerified ?? false),
    isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
    isBanned: Boolean(raw.is_banned ?? raw.isBanned ?? false),
    banReason: (raw.ban_reason ?? raw.banReason) as string | undefined,
    lastLogin: (raw.last_login ?? raw.lastLogin) as string | undefined,
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface UsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string; // active, banned, deactivated, unverified
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface UsersListResult {
  users: ManagedUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const adminService = {
  async fetchStats(): Promise<AdminStats | null> {
    const response = await apiGet(AUTH_ENDPOINTS.ADMIN_STATS);
    if (!response.success) return null;
    return mapStats(response.data as Record<string, unknown>);
  },

  async fetchUsers(params: UsersListParams = {}): Promise<UsersListResult> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.status) query.set('status', params.status);
    if (params.sort) query.set('sort', params.sort);
    if (params.order) query.set('order', params.order);

    const url = `${AUTH_ENDPOINTS.ADMIN_USERS}?${query.toString()}`;
    const response = await apiGet(url);

    if (!response.success) {
      return { users: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } };
    }

    const data = response.data as Record<string, unknown>;
    const rawUsers = (data.users ?? data.data ?? []) as Record<string, unknown>[];
    const rawPagination = (data.pagination ?? {}) as Record<string, unknown>;

    return {
      users: rawUsers.map(mapManagedUser),
      pagination: {
        total: Number(rawPagination.total ?? 0),
        page: Number(rawPagination.page ?? 1),
        limit: Number(rawPagination.limit ?? 20),
        pages: Number(rawPagination.pages ?? rawPagination.total_pages ?? 0),
      },
    };
  },

  async banUser(userId: string, reason: string): Promise<boolean> {
    const response = await apiPost(`${AUTH_ENDPOINTS.ADMIN_USER_BAN}/${userId}/ban`, { reason });
    return response.success;
  },

  async unbanUser(userId: string): Promise<boolean> {
    const response = await apiPost(`${AUTH_ENDPOINTS.ADMIN_USER_UNBAN}/${userId}/unban`, {});
    return response.success;
  },

  async deactivateUser(userId: string): Promise<boolean> {
    const response = await apiPost(`${AUTH_ENDPOINTS.ADMIN_USER_DEACTIVATE}/${userId}/deactivate`, {});
    return response.success;
  },

  async reactivateUser(userId: string): Promise<boolean> {
    const response = await apiPost(`${AUTH_ENDPOINTS.ADMIN_USER_REACTIVATE}/${userId}/reactivate`, {});
    return response.success;
  },

  async changeUserRole(userId: string, role: string): Promise<boolean> {
    const response = await apiPatch(`${AUTH_ENDPOINTS.ADMIN_USER_ROLE}/${userId}/role`, { role });
    return response.success;
  },

  async forceVerifyEmail(userId: string): Promise<boolean> {
    const response = await apiPost(`${AUTH_ENDPOINTS.ADMIN_USER_FORCE_VERIFY_EMAIL}/${userId}/verify-email`, {});
    return response.success;
  },

  async forceLogout(userId: string): Promise<boolean> {
    const response = await apiPost(`${AUTH_ENDPOINTS.ADMIN_USER_FORCE_LOGOUT}/${userId}/force-logout`, {});
    return response.success;
  },

  async unlockUser(userId: string): Promise<boolean> {
    const response = await apiPost(`${AUTH_ENDPOINTS.ADMIN_USER_UNLOCK}/${userId}/unlock`, {});
    return response.success;
  },
};
