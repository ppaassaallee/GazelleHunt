type ApiError = Error & { status?: number; code?: string };

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const base = (import.meta.env.VITE_API_BASE as string | undefined) || "";
  const response = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    ...init,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      typeof data.error === "string" ? data.error : "request_failed",
    ) as ApiError;
    error.status = response.status;
    error.code = typeof data.code === "string" ? data.code : undefined;
    throw error;
  }
  return data as T;
}
