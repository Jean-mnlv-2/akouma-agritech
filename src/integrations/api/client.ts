/* eslint-disable @typescript-eslint/no-explicit-any */

// API HTTP unique (sans Supabase). Par défaut utilise l'origine (Nginx proxy) pour éviter le CORS
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

async function http(method: string, path: string, options?: { params?: Record<string, any>; body?: any; headers?: Record<string, string> }) {
  const url = new URL(path.replace(/^\/+/, "/"), API_BASE_URL);
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    credentials: "include",
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

// Query builder minimal pour imiter l’API utilisée dans le front existant
function createTableQuery(table: string) {
  let pendingOrder: { column: string; ascending: boolean } | null = null;
  let pendingEq: { column: string; value: any } | null = null;

  return {
    select: (_columns?: string) => ({
      order: (col: string, opts?: { ascending?: boolean }) => {
        pendingOrder = { column: col, ascending: opts?.ascending !== false };
        return {
          range: async (_from: number, _to: number) => {
            // Non utilisé actuellement. On ignore et retourne liste entière.
            const params: any = {};
            if (pendingOrder) {
              params.orderBy = pendingOrder.column;
              params.orderDir = pendingOrder.ascending ? 'asc' : 'desc';
            }
            const res = await http('GET', `/api/${table}`, { params });
            return { data: res.data, error: null };
          }
        };
      },
    }),
    insert: async (values: any) => {
      const res = await http('POST', `/api/${table}`, { body: values });
      return { data: res.data, error: null, select: () => ({ single: async () => ({ data: res.data, error: null }) }) } as any;
    },
    update: (values: any) => ({
      eq: (col: string, val: any) => ({
        select: () => ({
          single: async () => {
            // Suppose clé primaire: id
            const id = col === 'id' ? val : val;
            const res = await http('PUT', `/api/${table}/${id}`, { body: values });
            return { data: res.data, error: null };
          }
        })
      })
    }),
    delete: () => ({
      eq: async (col: string, val: any) => {
        const id = col === 'id' ? val : val;
        await http('DELETE', `/api/${table}/${id}`);
        return { error: null } as any;
      }
    }),
    eq: (col: string, val: any) => {
      pendingEq = { column: col, value: val };
      return {
        select: async () => {
          const res = await http('GET', `/api/${table}`, { params: { [col]: val } });
          return { data: res.data, error: null };
        }
      } as any;
    },
  } as any;
}

function createApiClient() {
  return {
    auth: {
      getSession: async () => {
        const res = await http('GET', '/auth/session');
        return { data: { session: res.user ? { user: res.user } : null } };
      },
      getUser: async () => {
        const res = await http('GET', '/auth/session');
        return { data: { user: res.user || null } };
      },
      onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => void 0 } } }),
      signInWithPassword: async (args: any) => {
        const res = await http('POST', '/auth/sign-in', { body: { email: args.email, password: args.password } });
        return { data: { user: res.user }, error: null };
      },
      signUp: async (args: any) => {
        const res = await http('POST', '/auth/sign-up', { body: { email: args.email, password: args.password, fullName: args.options?.data?.full_name } });
        return { data: { user: res.user }, error: null };
      },
      signOut: async () => {
        await http('POST', '/auth/sign-out');
        return { error: null };
      },
      updateUser: async (args: any) => {
        // À implémenter côté backend si nécessaire
        return { data: { user: args }, error: null };
      },
      admin: {
        createUser: async (args: any) => {
          const res = await http('POST', '/auth/sign-up', { body: { email: args.email, password: args.password, fullName: args.user_metadata?.first_name ? `${args.user_metadata.first_name} ${args.user_metadata.last_name || ''}`.trim() : undefined } });
          return { data: { user: res.user }, error: null } as any;
        },
      },
    },
    from: (table: string) => createTableQuery(table),
    request: async (method: 'GET'|'POST'|'PUT'|'DELETE', path: string, opts?: { params?: any; body?: any; headers?: Record<string,string> }) => {
      return http(method, path, opts);
    }
  } as any;
}

export const api: any = createApiClient();


