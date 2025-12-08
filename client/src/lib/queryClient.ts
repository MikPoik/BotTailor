import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { stackClientApp } from "./stack";

function getEmbeddedConfig(): any {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as any).__CHAT_WIDGET_CONFIG__;
}

function getBaseUrl(): string {
  const config = getEmbeddedConfig();
  return config?.apiUrl || "";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Cache-Control": "no-cache",
  };

  // Only attempt to resolve Stack user on the client
  if (typeof window === "undefined") {
    return headers;
  }

  try {
    const user = await stackClientApp.getUser();
    if (user) {
      headers["x-stack-user-id"] = user.id;
    }
  } catch (_error) {
    // User not authenticated; proceed without header
  }

  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use absolute URL when widget is embedded to avoid CORS issues
  const baseUrl = getBaseUrl();
  const urlString = String(url);
  const fullUrl = urlString.startsWith('http') ? urlString : `${baseUrl}${urlString}`;

  const headers = await getAuthHeaders();
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(fullUrl, {
    method,
    headers,
    cache: "no-store",
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use absolute URL when widget is embedded to avoid CORS issues
    const baseUrl = getBaseUrl();
    const url = queryKey.join("/");
    const urlString = String(url);
    const fullUrl = urlString.startsWith('http') ? urlString : `${baseUrl}${urlString}`;
    const headers = await getAuthHeaders();
    
    const res = await fetch(fullUrl, {
      credentials: "include",
      cache: "no-store",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      gcTime: 10 * 60 * 1000, // garbage collection time
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
