import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient, setAuthToken } from "@/lib/apiClient";

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
  organizationId?: string | null;
  isEmailVerified?: boolean;
  newsletterSubscribed?: boolean;
  avatarUrl?: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  organization_id?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refresh: async () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await apiClient<{ id?: string; _id?: string; displayName: string; email: string; role: string; organizationId?: string; avatarUrl?: string }>('/api/auth/me');
      const raw = res.data ?? null;
      const authUser = raw ? { ...raw, id: raw.id || raw._id || "" } : null;
      setUser(authUser as any);
      setProfile(
        authUser
          ? {
              id: authUser.id,
              user_id: authUser.id,
              display_name: authUser.displayName,
              avatar_url: authUser.avatarUrl || null,
              organization_id: authUser.organizationId || null,
            }
          : null
      );
    } catch {
      setUser(null);
      setProfile(null);
      setAuthToken(null);
    }
  };

  const refresh = async () => {
    setLoading(true);
    await fetchMe();
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
