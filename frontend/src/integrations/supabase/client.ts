// This file provides a lightweight shim for legacy Supabase-style code while using a custom backend API.
import { apiClient, setAuthToken, getAuthToken } from "@/lib/apiClient";

const tableMap: Record<string, string> = {
  templates: "/api/templates",
  certificate_templates: "/api/templates",
  certificates: "/api/certificates",
  organizations: "/api/organizations",
  organization_members: "/api/organizations",
  users: "/api/users",
  profiles: "/api/users",
  user_roles: "/api/admin/user-roles",
  orders: "/api/orders",
  plans: "/api/plans",
  coupons: "/api/coupons",
  contact_messages: "/api/contact",
  external_certificates: "/api/certificates/external",
  admin_audit_logs: "/api/admin/audit-logs",
};

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const response = await apiClient<{ token: string }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setAuthToken(response.data!.token);
        return { data: response.data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    signUp: async ({ email, password, options }: any) => {
      try {
        const response = await apiClient<{ token: string }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            displayName: options?.data?.display_name ?? "",
            email,
            password,
          }),
        });
        if (response.data?.token) setAuthToken(response.data.token);
        return { data: response.data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    signOut: async () => {
      setAuthToken(null);
      return { data: null, error: null };
    },
    getSession: async () => {
      const token = getAuthToken();
      return { data: { session: token ? { access_token: token } : null } };
    },
    updateUser: async (_opts: any) => {
      return { data: null, error: { message: "Use apiClient directly for password change" } };
    },
    onAuthStateChange: (_callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  functions: {
    invoke: async (path: string, opts: any) => {
      try {
        if (path === "ai-assist") {
          const response = await apiClient("/api/ai/assist", {
            method: "POST",
            body: JSON.stringify(opts.body),
          });
          return { data: response.data, error: null };
        }
        return { data: null, error: new Error("Unknown function") };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
  },
  rpc: async (query: string, params?: any) => {
    try {
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
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },
  from: (table: string) => {
    const baseUrl = tableMap[table] || `/api/${table}`;
    const state: any = {
      filters: {} as Record<string, any>,
      orderField: null as string | null,
      orderAsc: true,
      limitCount: null as number | null,
      id: null as string | null,
      updateData: null as any,
      insertData: null as any,
      del: false,
      selectFields: "*",
    };

    const execute = async (): Promise<{ data: any; error: any }> => {
      try {
        // DELETE
        if (state.del && state.id) {
          const response = await apiClient(`${baseUrl}/${state.id}`, { method: "DELETE" });
          return { data: response.data, error: null };
        }
        // UPDATE
        if (state.updateData && state.id) {
          const response = await apiClient(`${baseUrl}/${state.id}`, {
            method: "PUT",
            body: JSON.stringify(state.updateData),
          });
          return { data: response.data, error: null };
        }
        // INSERT
        if (state.insertData) {
          const response = await apiClient(baseUrl, {
            method: "POST",
            body: JSON.stringify(state.insertData),
          });
          return { data: response.data, error: null };
        }
        // SELECT
        const params = new URLSearchParams();
        Object.entries(state.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) params.append(key, String(value));
        });
        if (state.orderField) {
          params.append("sort", state.orderAsc ? state.orderField : `-${state.orderField}`);
        }
        if (state.limitCount) params.append("limit", String(state.limitCount));
        const qs = params.toString();
        const url = state.id ? `${baseUrl}/${state.id}` : `${baseUrl}${qs ? `?${qs}` : ""}`;
        const response = await apiClient<any>(url);
        return { data: response.data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    };

    const builder: any = {
      select: (_fields?: string) => {
        if (_fields) state.selectFields = _fields;
        return builder;
      },
      insert: (data: any) => {
        state.insertData = data;
        return builder;
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
        if (field === "id" || field === "_id") {
          state.id = value;
        } else {
          state.filters[field] = value;
        }
        return builder;
      },
      neq: (field: string, value: any) => {
        state.filters[`${field}_ne`] = value;
        return builder;
      },
      ilike: (field: string, value: any) => {
        state.filters[`${field}_like`] = value;
        return builder;
      },
      in: (field: string, values: any[]) => {
        state.filters[`${field}_in`] = values.join(",");
        return builder;
      },
      order: (field: string, opts?: { ascending?: boolean }) => {
        state.orderField = field;
        state.orderAsc = opts?.ascending !== false;
        return builder;
      },
      limit: (count: number) => {
        state.limitCount = count;
        return builder;
      },
      range: (_from: number, _to: number) => {
        state.limitCount = _to - _from + 1;
        return builder;
      },
      single: async () => {
        const result = await execute();
        if (Array.isArray(result.data)) {
          return { data: result.data[0] ?? null, error: result.error };
        }
        return result;
      },
      maybeSingle: async () => builder.single(),
      then: (onFulfilled: any, onRejected?: any) => {
        return execute().then(onFulfilled, onRejected);
      },
    };

    return builder;
  },
};

