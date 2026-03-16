// This file provides a lightweight shim for legacy Supabase-style code while using a custom backend API.
import { apiClient, setAuthToken, getAuthToken } from "@/lib/apiClient";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

const tableMap: Record<string, string> = {
  templates: "/api/templates",
  certificates: "/api/certificates",
  organizations: "/api/organizations",
  users: "/api/users",
  "user_roles": "/api/admin/user-roles",
};

const buildQueryParams = (filters: Record<string, any>) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiClient<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuthToken(response.data.token);
      return { data: response.data, error: null };
    },
    signUp: async ({ email, password, options }: any) => {
      const response = await apiClient<{ token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          displayName: options?.data?.display_name ?? "",
          email,
          password,
        }),
      });
      setAuthToken(response.data.token);
      return { data: response.data, error: null };
    },
    signOut: async () => {
      setAuthToken(null);
      return { data: null, error: null };
    },
    getSession: async () => {
      const token = getAuthToken();
      return { data: { session: token ? { access_token: token } : null } };
    },
    onAuthStateChange: (_callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  functions: {
    invoke: async (path: string, opts: any) => {
      if (path === "ai-assist") {
        const response = await apiClient("/api/ai/assist", {
          method: "POST",
          body: JSON.stringify(opts.body),
        });
        return { data: response.data, error: null };
      }
      return { data: null, error: new Error("Unknown function") };
    },
  },
  rpc: async (query: string, params?: any) => {
    if (query === "get_admin_users") {
      const response = await apiClient("/api/admin/users");
      return { data: response.data, error: null };
    }
    if (query === "log_admin_action") {
      await apiClient("/api/admin/log", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return { data: null, error: null };
    }
    return { data: null, error: new Error("Unknown RPC") };
  },
  from: (table: string) => {
    const baseUrl = tableMap[table] || `/api/${table}`;
    const state: any = { filters: {}, order: null, limit: null, id: null, updateData: null, del: false };

    const builder: any = {
      select: async () => {
        const url = `${baseUrl}${buildQueryParams(state.filters)}`;
        const response = await apiClient<any[]>(url);
        return { data: response.data, error: null };
      },
      insert: async (data: any) => {
        const response = await apiClient(baseUrl, {
          method: "POST",
          body: JSON.stringify(data),
        });
        return { data: response.data, error: null };
      },
      update: (data: any) => {
        state.updateData = data;
        return builder;
      },
      delete: () => {
        state.del = true;
        return builder;
      },
      eq: (field: string, value: any) => {
        if (field === "id") {
          state.id = value;
        } else {
          state.filters[field] = value;
        }
        return builder;
      },
      order: (field: string, opts: any) => {
        state.order = { field, opts };
        return builder;
      },
      single: async () => {
        if (state.id) {
          const response = await apiClient<any>(`${baseUrl}/${state.id}`);
          return { data: response.data, error: null };
        }
        const url = `${baseUrl}${buildQueryParams(state.filters)}`;
        const response = await apiClient<any[]>(url);
        return { data: (response.data as any[])[0] ?? null, error: null };
      },
      maybeSingle: async () => builder.single(),
      then: async (onFulfilled: any) => {
        const result = await builder.select();
        return onFulfilled(result);
      },
    };

    builder.execute = async () => {
      if (state.id && state.updateData) {
        const response = await apiClient(`${baseUrl}/${state.id}`, { method: "PUT", body: JSON.stringify(state.updateData) });
        return { data: response.data, error: null };
      }
      if (state.id && state.del) {
        const response = await apiClient(`${baseUrl}/${state.id}`, { method: "DELETE" });
        return { data: response.data, error: null };
      }
      return builder.select();
    };

    return builder;
  },
};

// export { supabase };
