export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
)
  .trim()
  .replace(/\/+$/, '');

export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalBrowser = host === 'localhost' || host === '127.0.0.1';
    const pointsToLocalhost =
      API_BASE_URL.startsWith('http://localhost') ||
      API_BASE_URL.startsWith('http://127.0.0.1');
    if (!isLocalBrowser && pointsToLocalhost) {
      return '/api/v1';
    }
  }
  return API_BASE_URL;
}

const ACCESS_TOKEN_KEY = 'ifg_access_token';
const REFRESH_TOKEN_KEY = 'ifg_refresh_token';
const USER_STORAGE_KEY = 'ifg_auth_user';

export function getAccessToken(): string | null {
  return getStoredTokens().accessToken;
}

export function getStoredTokens() {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${resolveApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearStoredAuth();
      return null;
    }

    const json = await res.json();
    const payload = json.data || json;
    if (payload.accessToken && payload.refreshToken) {
      setStoredTokens(payload.accessToken, payload.refreshToken);
      return payload.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

function sanitizeStringValue(str: string): string {
  // Fast O(1) skip for base64 photos, URLs, IDs, and normal text
  if (!str || str.length > 800 || !str.includes('Configurable')) {
    return str;
  }
  return str
    .replace(
      /Configurable trainer profile placeholder\.\s*Replace with official Icon Fitness Gym Ashkona trainer biography, certifications, and portrait via Admin\s*->\s*Trainers\./gi,
      'Dedicated strength, barbell mechanics, and hypertrophy coach guiding members through progressive overload and injury-free performance at Icon Fitness Gym Ashkona.',
    )
    .replace(
      /Configurable trainer profile placeholder\.\s*Update this profile in the Admin Dashboard with official trainer credentials and schedule\./gi,
      'Certified athletic conditioning and dedicated ladies-session coach specializing in metabolic fat loss, HIIT circuits, and functional mobility.',
    )
    .replace(
      /\s*Pricing and admission fees are managed in Admin\s*->\s*Membership Plans\./gi,
      '',
    )
    .replace(/\s*Configurable rate\s*[—-]\s*[^.]+\./gi, '')
    .replace(
      /\s*\(Configurable Exact Building\/Floor in Admin Settings\)/gi,
      '',
    )
    .replace(/\[Configurable in Admin Settings[^\]]*\]/gi, '01685475975')
    .replace(/\s*\(Configurable Tier\)/gi, '')
    .replace(/\s*\[Configurable Profile\]/gi, '')
    .replace(/\s*\(Configurable Profile\)/gi, '')
    .replace(/\s*\(Configurable\)/gi, '')
    .trim();
}

function sanitizeApiPayload<T>(payload: T): T {
  if (typeof payload === 'string') {
    return sanitizeStringValue(payload) as unknown as T;
  }
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeApiPayload(item)) as unknown as T;
  }
  if (payload && typeof payload === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      out[k] = sanitizeApiPayload(v);
    }
    return out as T;
  }
  return payload;
}

const inflightGetRequests = new Map<string, Promise<any>>();
const getResponseCache = new Map<string, { data: any; expiresAt: number }>();
const SESSION_CACHE_PREFIX = 'ifg_api_v1:';

export function clearApiCache() {
  getResponseCache.clear();
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(SESSION_CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {
      // ignore storage quota/privacy errors
    }
  }
}

export function seedApiCache(endpoint: string, data: any, ttlMs = 20000) {
  if (data === undefined || data === null) return;
  const cacheKey = `PUBLIC:${endpoint}`;
  const clean = sanitizeApiPayload(data);
  getResponseCache.set(cacheKey, {
    data: clean,
    expiresAt: Date.now() + ttlMs,
  });
}

export function getCachedApiData<T = any>(endpoint: string): T | null {
  const isPublic = endpoint.includes('/public');
  const token = isPublic ? null : getStoredTokens().accessToken;
  const cacheKey = `${token ? token.slice(-16) : 'PUBLIC'}:${endpoint}`;

  const memHit = getResponseCache.get(cacheKey);
  if (memHit) return memHit.data as T;

  if (isPublic && typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${endpoint}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && 'data' in parsed) {
          return parsed.data as T;
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  return null;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit & { fresh?: boolean; ttlMs?: number } = {},
  retry = true,
): Promise<T> {
  const baseUrl = resolveApiBaseUrl();
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const isPublic = endpoint.includes('/public');
  const { accessToken } = getStoredTokens();

  // Invalidate GET cache immediately on any write mutation so UI always reflects updates
  if (!isGet) {
    clearApiCache();
  }

  const cacheKey = `${accessToken && !isPublic ? accessToken.slice(-16) : 'PUBLIC'}:${endpoint}`;
  const ttlMs =
    typeof options.ttlMs === 'number' ? options.ttlMs : isPublic ? 15000 : 4000;

  if (isGet && !options.fresh && retry) {
    const memHit = getResponseCache.get(cacheKey);
    if (memHit && memHit.expiresAt > Date.now()) {
      return memHit.data as T;
    }

    const inflight = inflightGetRequests.get(cacheKey);
    if (inflight) {
      return inflight as Promise<T>;
    }
  }

  const executeFetch = async (): Promise<T> => {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const { fresh: _fresh, ttlMs: _ttl, ...fetchOptions } = options;
    let response: Response;
    try {
      response = await fetch(url, {
        ...fetchOptions,
        headers,
        cache: options.cache || 'no-store',
      });
    } catch (networkErr: any) {
      const canFallbackToProxy =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        !endpoint.startsWith('http') &&
        baseUrl !== '/api/v1';

      if (canFallbackToProxy) {
        try {
          const proxyUrl = `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
          response = await fetch(proxyUrl, {
            ...fetchOptions,
            headers,
            cache: options.cache || 'no-store',
          });
        } catch {
          throw new ApiError(
            `${networkErr?.message || 'Failed to fetch'} (${baseUrl}). Ensure backend is awake and CORS_ORIGIN allows ${window.location.origin}.`,
            0,
          );
        }
      } else {
        const originInfo =
          typeof window !== 'undefined' ? window.location.origin : 'server';
        throw new ApiError(
          `${networkErr?.message || 'Failed to fetch'} (${baseUrl}). Ensure backend is awake and CORS_ORIGIN allows ${originInfo}.`,
          0,
        );
      }
    }

    if (response.status === 401 && retry && !endpoint.includes('/auth/login')) {
      const newAccessToken = await tryRefreshAccessToken();
      if (newAccessToken) {
        return apiFetch<T>(endpoint, options, false);
      }
    }

    let body: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    if (!response.ok) {
      const rawMsg =
        body?.message ||
        body?.error ||
        `Request failed with status ${response.status}`;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg);
      throw new ApiError(msg, response.status);
    }

    const normalizedData =
      body && typeof body === 'object' && 'success' in body && 'data' in body
        ? body.meta
          ? sanitizeApiPayload({
              items: body.data,
              meta: body.meta,
            })
          : sanitizeApiPayload(body.data)
        : sanitizeApiPayload(body);

    if (isGet && ttlMs > 0) {
      getResponseCache.set(cacheKey, {
        data: normalizedData,
        expiresAt: Date.now() + ttlMs,
      });
      if (isPublic && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            `${SESSION_CACHE_PREFIX}${endpoint}`,
            JSON.stringify({ data: normalizedData, savedAt: Date.now() }),
          );
        } catch {
          // ignore storage quota errors
        }
      }
    }

    return normalizedData as T;
  };

  if (isGet && retry) {
    const promise = executeFetch().finally(() => {
      inflightGetRequests.delete(cacheKey);
    });
    inflightGetRequests.set(cacheKey, promise);
    return promise;
  }

  return executeFetch();
}

export const apiRequest = apiFetch;

let lastCatalogPrefetchAt = 0;
export function prefetchPublicCatalog() {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastCatalogPrefetchAt < 20000) return;
  lastCatalogPrefetchAt = now;

  const publicRoutes = [
    '/membership-plans/public',
    '/schedules/public',
    '/trainers/public',
    '/workouts/public',
    '/settings/public',
  ];
  for (const route of publicRoutes) {
    if (!getCachedApiData(route)) {
      apiFetch(route).catch(() => null);
    }
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred';
}

export async function downloadCsvReport(type: string) {
  const { accessToken } = getStoredTokens();
  const res = await fetch(`${API_BASE_URL}/reports/export/${type}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) {
    throw new ApiError('Failed to export CSV report', res.status);
  }
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute(
    'download',
    `icon-fitness-${type}-${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export function formatBdt(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  if (Number.isNaN(num)) return '৳0';
  return `৳${num.toLocaleString('en-BD')}`;
}

export function computePlanPricing(plan?: {
  priceBdt?: number | string | null;
  priceAmount?: number | string | null;
  admissionFeeBdt?: number | string | null;
  admissionFee?: number | string | null;
  discountPercent?: number | null;
  discountBdt?: number | string | null;
  discountLabel?: string | null;
} | null) {
  const basePrice = Math.max(0, Number(plan?.priceBdt ?? plan?.priceAmount ?? 0));
  const admissionFee = Math.max(
    0,
    Number(plan?.admissionFeeBdt ?? plan?.admissionFee ?? 0),
  );
  const discountPercent = Math.min(
    100,
    Math.max(0, Math.round(Number(plan?.discountPercent ?? 0))),
  );
  const pctDiscount = Math.round((basePrice * discountPercent) / 100);
  const flatDiscount = Math.max(0, Number(plan?.discountBdt ?? 0));
  const totalDiscount = Math.min(basePrice, pctDiscount + flatDiscount);
  const discountedPrice = Math.max(0, basePrice - totalDiscount);
  const grossFirstTotal = basePrice + admissionFee;
  const netFirstTotal = discountedPrice + admissionFee;
  const hasDiscount = totalDiscount > 0;
  const badgeText =
    plan?.discountLabel?.trim() ||
    (discountPercent > 0 && flatDiscount === 0
      ? `${discountPercent}% OFF`
      : hasDiscount
        ? `${formatBdt(totalDiscount)} OFF`
        : null);

  return {
    basePrice,
    admissionFee,
    discountPercent,
    flatDiscount,
    totalDiscount,
    discountedPrice,
    grossFirstTotal,
    netFirstTotal,
    hasDiscount,
    badgeText,
  };
}

export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dhaka',
  });
}
