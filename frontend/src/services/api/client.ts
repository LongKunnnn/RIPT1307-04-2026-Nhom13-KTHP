const ACCESS_KEY = 'svforum_access_token';
const REFRESH_KEY = 'svforum_refresh_token';
const USER_KEY = 'svforum_user';

export function getApiBaseUrl(): string {
  // Trả về đúng gốc localhost:3000 thôi, vì các hàm dưới kia đã tự cộng thêm /api rồi
  let baseUrl = process.env.UMI_APP_API_BASE_URL || 'http://localhost:3000';
  
  // Xóa gạch chéo ở cuối (nếu có) để lúc cộng chuỗi không bị lỗi //
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  // Xóa luôn chữ /api ở cuối (nếu trong .env lỡ khai báo thừa)
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  }
  
  return baseUrl;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser<T>(): T | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser<T>(user: T | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  // Base URL is just http://localhost:3000, so we need to add /api prefix!
  const res = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Các route auth công khai: 401 = sai mật khẩu, không phải hết phiên. */
const PUBLIC_AUTH_PATHS =
  /^\/api\/auth\/(login|register|refresh|forgot-password|reset-password)(\/|$)/;

function isPublicAuthPath(path: string): boolean {
  return PUBLIC_AUTH_PATHS.test(path);
}

export function getApiErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function messageFromErrorBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const o = body as Record<string, unknown>;

  const fromMessage = (msg: unknown): string | undefined => {
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (Array.isArray(msg)) {
      const parts = msg.filter((x): x is string => typeof x === 'string');
      if (parts.length) return parts.join(', ');
    }
    return undefined;
  };

  const nested = o.error;
  if (nested && typeof nested === 'object') {
    const m = fromMessage((nested as Record<string, unknown>).message);
    if (m) return m;
  }
  if (typeof nested === 'string' && nested.trim()) return nested;

  const top = fromMessage(o.message);
  if (top) return top;

  return undefined;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });

  // 401 trên login/register = báo lỗi cho form, không refresh token / không redirect
  if (res.status === 401 && isPublicAuthPath(path)) {
    let message = 'Thông tin đăng nhập không chính xác.';
    try {
      const body = await res.json();
      message = messageFromErrorBody(body) ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(message, 401);
  }

  // 401 trên API có token: thử refresh, hết hạn thì về trang đăng nhập
  if (res.status === 401) {
    if (retry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiFetch<T>(path, options, false);
      }
    }
    clearTokens();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
      return new Promise(() => {}) as Promise<T>;
    }
    throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = messageFromErrorBody(body) ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204 || res.status === 205) return undefined as T;

  const text = await res.text();
  if (!text.trim()) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Phản hồi không hợp lệ từ máy chủ', res.status);
  }
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}