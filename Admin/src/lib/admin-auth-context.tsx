import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  adminAuthService,
  AdminApiError,
} from "../services/admin-auth.service";
import type { AdminUser, AdminTokens } from "../types/admin.types";
import { saveAdminTokens, clearAdminTokens } from "../utils/auth.utils";

function getTokenExpiryMs(accessToken: string): number {
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1])) as {
      exp?: number;
    };
    return (payload.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

const ADMIN_STORAGE_KEY = "apex_arenas_admin_auth";

interface StoredAdminSession {
  tokens: AdminTokens;
  user?: AdminUser;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  tokens: AdminTokens | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setSession: (tokens: AdminTokens | null, user?: AdminUser | null) => void;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(
  undefined,
);

const persistSession = (session: StoredAdminSession | null): void => {
  if (!session) {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    return;
  }
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
};

const readSession = (): StoredAdminSession | null => {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAdminSession;
    if (!parsed?.tokens?.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const AdminAuthProvider = ({ children }: PropsWithChildren) => {
  const [tokens, setTokens] = useState<AdminTokens | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;
  const adminRef = useRef(admin);
  adminRef.current = admin;

  const setSession = useCallback(
    (nextTokens: AdminTokens | null, nextUser?: AdminUser | null) => {
      if (!nextTokens?.accessToken) {
        setTokens(null);
        setAdmin(null);
        persistSession(null);
        clearAdminTokens();
        return;
      }
      const resolvedUser = nextUser ?? null;
      setTokens(nextTokens);
      setAdmin(resolvedUser);
      persistSession({ tokens: nextTokens, user: resolvedUser ?? undefined });
      saveAdminTokens(nextTokens);
    },
    [],
  );

  const logout = useCallback(async () => {
    const accessToken = tokensRef.current?.accessToken;
    try {
      await adminAuthService.logout(accessToken);
    } finally {
      setSession(null, null);
    }
  }, [setSession]);

  // Bootstrap: validate stored admin session on mount
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const stored = readSession();

      if (!stored?.tokens.accessToken) {
        if (active) setIsInitializing(false);
        return;
      }

      // Hydrate immediately
      setTokens(stored.tokens);
      setAdmin(stored.user ?? null);
      tokensRef.current = stored.tokens;
      saveAdminTokens(stored.tokens);

      try {
        const result = await adminAuthService.validateToken(
          stored.tokens.accessToken,
        );
        if (!active) return;

        if (result.user) {
          // Merge with stored user so fields like avatarUrl that the
          // sessions endpoint may not return are not wiped out.
          const mergedUser: AdminUser = { ...(stored.user ?? {}), ...result.user };
          setAdmin(mergedUser);
          persistSession({ tokens: stored.tokens, user: mergedUser });
        }
      } catch (error) {
        if (!active) return;

        const isAuthError =
          error instanceof AdminApiError &&
          (error.status === 401 || error.status === 403);

        if (isAuthError && stored.tokens.refreshToken) {
          try {
            const refreshResult = await adminAuthService.refreshToken(
              stored.tokens.refreshToken,
            );
            if (!active) return;

            if (refreshResult.tokens?.accessToken) {
              const freshTokens: AdminTokens = {
                accessToken: refreshResult.tokens.accessToken,
                refreshToken:
                  refreshResult.tokens.refreshToken ??
                  stored.tokens.refreshToken,
              };
              setSession(freshTokens, stored.user ?? null);
            } else {
              setSession(null, null);
            }
          } catch {
            if (active) setSession(null, null);
          }
        } else {
          setSession(null, null);
        }
      } finally {
        if (active) setIsInitializing(false);
      }
    };

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  // Proactive background token refresh — checks every 60 s, refreshes when
  // the access token has less than 2 minutes remaining.
  useEffect(() => {
    const id = setInterval(async () => {
      const currentTokens = tokensRef.current;
      if (!currentTokens?.accessToken || !currentTokens.refreshToken) return;

      const expiresAt = getTokenExpiryMs(currentTokens.accessToken);
      const timeLeft = expiresAt - Date.now();
      if (timeLeft > 2 * 60 * 1000) return; // still plenty of time

      try {
        const result = await adminAuthService.refreshToken(
          currentTokens.refreshToken,
        );
        if (result.tokens?.accessToken) {
          const freshTokens: AdminTokens = {
            accessToken: result.tokens.accessToken,
            refreshToken:
              result.tokens.refreshToken ?? currentTokens.refreshToken,
          };
          setSession(freshTokens, adminRef.current);
        }
      } catch {
        // silent — reactive 401 handling in api.utils.ts is the fallback
      }
    }, 60_000);

    return () => clearInterval(id);
  }, [setSession]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      admin,
      tokens,
      isAuthenticated: Boolean(tokens?.accessToken),
      isInitializing,
      setSession,
      logout,
    }),
    [admin, tokens, isInitializing, setSession, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextValue => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth must be used within <AdminAuthProvider>");
  return ctx;
};
