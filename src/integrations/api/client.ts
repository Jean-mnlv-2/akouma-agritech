
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '';

async function http(method: string, path: string, options?: { params?: Record<string, any>; body?: any; headers?: Record<string, string> }) {
  try {
    const isRelative = !API_BASE_URL || API_BASE_URL.startsWith('/');
    const baseUrl = isRelative ? window.location.origin : API_BASE_URL;
    const url = new URL(path.replace(/^\/+/, "/"), baseUrl);
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
      if (res.status !== 401 && res.status !== 403 && res.status !== 404) {
        console.warn(`[API] ${method} ${path}: ${res.status}`);
      }
      throw new Error(text || `HTTP ${res.status}`);
    }
    const contentType = res.headers.get("content-type") || "";
    return contentType.includes("application/json") ? res.json() : res.text();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const key = `api_error_${method}_${path}`;
      const lastLog = (window as any)[key];
      const now = Date.now();
      if (!lastLog || now - lastLog > 60000) {
        (window as any)[key] = now;
        console.warn(`[API] Serveur indisponible pour ${method} ${path}`);
      }
      throw new Error('Serveur indisponible. Vérifiez votre connexion.');
    }
    throw error;
  }
}

// Query builder minimal pour imiter l'API utilisée dans le front existant
function createTableQuery(table: string) {
  let pendingOrder: { column: string; ascending: boolean } | null = null;

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
        try {
          const res = await http('GET', '/auth/session');
          return { data: { session: res.user ? { user: res.user } : null } };
        } catch (error) {
          return { data: { session: null } };
        }
      },
      getUser: async () => {
        try {
          const res = await http('GET', '/auth/session');
          return { data: { user: res.user || null } };
        } catch (error) {
          return { data: { user: null } };
        }
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
        return { data: { user: args }, error: null };
      },
      forgotPassword: async (email: string) => {
        const res = await http('POST', '/auth/forgot-password', { body: { email } });
        return { data: res, error: null };
      },
      resetPassword: async (args: { token: string; password: any }) => {
        const res = await http('POST', '/auth/reset-password', { body: args });
        return { data: res, error: null };
      },
      admin: {
        createUser: async (args: any) => {
          const res = await http('POST', '/auth/sign-up', { body: { email: args.email, password: args.password, fullName: args.user_metadata?.first_name ? `${args.user_metadata.first_name} ${args.user_metadata.last_name || ''}`.trim() : undefined } });
          return { data: { user: res.user }, error: null } as any;
        },
      },
      promoCodes: {
        validate: async (code: string, subtotal: number) => {
          const res = await http('POST', '/api/promo-codes/validate', { body: { code, subtotal } });
          return { data: res.data, error: null };
        },
        list: async () => {
          const res = await http('GET', '/api/promo-codes');
          return { data: res.data, error: null };
        },
        create: async (payload: any) => {
          const res = await http('POST', '/api/promo-codes', { body: payload });
          return { data: res.data, error: null };
        },
        update: async (id: number, payload: any) => {
          const res = await http('PUT', `/api/promo-codes/${id}`, { body: payload });
          return { data: res.data, error: null };
        },
        toggle: async (id: number, isActive: boolean) => {
          const res = await http('PATCH', `/api/promo-codes/${id}/toggle`, { body: { isActive } });
          return { data: res.data, error: null };
        },
      },
    },
    from: (table: string) => createTableQuery(table),
    request: async (method: 'GET'|'POST'|'PUT'|'DELETE', path: string, opts?: { params?: any; body?: any; headers?: Record<string,string> }) => {
      return http(method, path, opts);
    },
    deliveryPartners: {
      list: async () => {
        const res = await http('GET', '/api/delivery-partners');
        return { data: res.data, error: null };
      },
      adminList: async () => {
        const res = await http('GET', '/api/delivery-partners/admin');
        return { data: res.data, error: null };
      },
      create: async (payload: any) => {
        const res = await http('POST', '/api/delivery-partners', { body: payload });
        return { data: res.data, error: null };
      },
      update: async (id: number, payload: any) => {
        const res = await http('PUT', `/api/delivery-partners/${id}`, { body: payload });
        return { data: res.data, error: null };
      },
      toggle: async (id: number) => {
        const res = await http('PATCH', `/api/delivery-partners/${id}/toggle`);
        return { data: res.data, error: null };
      },
      remove: async (id: number) => {
        await http('DELETE', `/api/delivery-partners/${id}`);
        return { error: null };
      },
    }
  } as any;
}

export const api: any = createApiClient();


