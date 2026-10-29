import { getAuthToken } from '../auth/authToken';
import { getActiveBoardId } from './activeBoard';

const API_BASE = '/api';

/** `code` of a 502 from the backend when an AI provider failed, not us (contract with the BE's photo import). */
export const AI_UNAVAILABLE = 'ai_unavailable';

/** A failed API call: the HTTP status plus the backend's machine-readable `code`, when it sent one. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const boardId = getActiveBoardId();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(boardId ? { 'X-Board-Id': boardId } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const code = typeof body === 'object' && body !== null && 'code' in body ? String(body.code) : undefined;
    throw new ApiError(`${init?.method ?? 'GET'} ${path} failed: ${res.status}`, res.status, code);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  postForm: <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
