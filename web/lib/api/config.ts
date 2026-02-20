/**
 * API configuration and shared fetch utilities.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/**
 * Build a fully-qualified URL for a backend API path.
 *
 * @param path - Relative path starting with `/` (e.g. `/api/videos`).
 * @param params - Optional query-string parameters.
 */
export function apiUrl(
  path: string,
  params?: Record<string, string>,
): string {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/** Default headers applied to every JSON request. */
export const DEFAULT_HEADERS: HeadersInit = {
  Accept: "application/json",
};

/** Default headers for requests that send a JSON body. */
export const JSON_HEADERS: HeadersInit = {
  ...DEFAULT_HEADERS,
  "Content-Type": "application/json",
};

/**
 * Thin wrapper around `fetch` that:
 * 1. Prepends the base URL.
 * 2. Merges default headers.
 * 3. Throws an `ApiError` on non-2xx responses.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = apiUrl(path);

  const isFormData = init?.body instanceof FormData;

  const response = await fetch(url, {
    ...init,
    headers: {
      ...(isFormData ? DEFAULT_HEADERS : JSON_HEADERS),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const body = await response.json();
      detail = body?.detail ?? JSON.stringify(body);
    } catch {
      detail = response.statusText;
    }
    throw new ApiError(response.status, detail ?? "Unknown error", path);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

/**
 * Structured error thrown when a backend request fails.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly path: string,
  ) {
    super(`API ${status} on ${path}: ${detail}`);
    this.name = "ApiError";
  }
}
