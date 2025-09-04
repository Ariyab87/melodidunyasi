// lib/api.ts

type SongForm = {
    name: string;
    email: string;
    phone?: string;
    specialOccasion: string;
    songStyle: string;
    mood: string;
    tempo?: string;
    language?: string;
    namesToInclude?: string;
    story: string;
    additionalNotes?: string;
    instrumental?: boolean;
    exactLyrics?: boolean;
    model?: string;
  };
  
  export type StartResp = {
    success: boolean;
    songId: string;
    jobId: string | null;
    status: 'queued' | 'pending' | 'processing' | 'completed' | string;
    estimatedTime?: string;
    data?: Record<string, any>;
    errorMessage?: string;
  };
  
  export type StatusResp = {
  status:
    | 'queued'
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'initializing'
    | 'error'
    | string;
  audioUrl: string | null;
  progress?: number;
  etaSeconds?: number | null;
  startedAt?: string | null;
  updatedAt?: string | null;
  errorType?: string;
  errorMessage?: string;
  // Download fields
  downloadUrl?: string | null;
  savedFilename?: string | null;
  fileSize?: number | null;
  // Additional fields that might be present in the actual API response
  data?: any;
  audio_url?: string | null;
  [key: string]: any; // Allow additional properties
};

// API DISABLED - Set to false to disable all API calls
const API_DISABLED = false;

// Always default to disabled API if API_DISABLED is true
export const API_ORIGIN = API_DISABLED 
  ? 'https://api-disabled.example.com' // Non-existent URL
  : (process.env.NEXT_PUBLIC_API_BASE ||
     process.env.NEXT_PUBLIC_BACKEND_URL ||
     'https://melodidunyasi.onrender.com');
  
export const API_BASE = `${API_ORIGIN.replace(/\/$/, '')}/api`;
  
async function jsonFetch<T>(url: string, opts: RequestInit = {}): Promise<T> {
  // If API is disabled, throw an error
  if (API_DISABLED) {
    throw new Error('API is currently disabled');
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });

  if (!res.ok && res.status !== 202) {
    const txt = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} ${txt}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

/* -------------------- Start generation -------------------- */

export async function submitSongForm(form: SongForm): Promise<StartResp> {
  // If API is disabled, return a mock response
  if (API_DISABLED) {
    return {
      success: false,
      songId: 'disabled',
      jobId: null,
      status: 'error',
      errorMessage: 'API is currently disabled'
    };
  }

  const primary = `${API_BASE}/song/generate`;
  const fallback = `${API_BASE}/generate`;

  try {
    return await jsonFetch<StartResp>(primary, {
      method: 'POST',
      body: JSON.stringify(form),
    });
  } catch (e: any) {
    if (String(e?.message || '').startsWith('404')) {
      return jsonFetch<StartResp>(fallback, {
        method: 'POST',
        body: JSON.stringify(form),
      });
    }
    throw e;
  }
}

/* -------------------- Status helpers -------------------- */

export async function getSongStatus(
songId: string,
jobId?: string | null,
cacheBuster?: number
): Promise<StatusResp> {
  // If API is disabled, return a mock response
  if (API_DISABLED) {
    return {
      status: 'error',
      audioUrl: null,
      errorMessage: 'API is currently disabled'
    };
  }

  let q = jobId ? `?jobId=${encodeURIComponent(jobId)}` : '';
  if (cacheBuster) {
    q += q ? `&_t=${cacheBuster}` : `?_t=${cacheBuster}`;
  }
  const url = `${API_BASE}/song/status/${encodeURIComponent(songId)}${q}`;
  return jsonFetch<StatusResp>(url, { cache: 'no-store' as RequestCache });
}

export async function pollSongStatus(
  songId: string,
  jobId?: string | null,
  opts?: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal }
): Promise<StatusResp> {
  // If API is disabled, return a mock response
  if (API_DISABLED) {
    return {
      status: 'error',
      audioUrl: null,
      errorMessage: 'API is currently disabled'
    };
  }

  const intervalMs = opts?.intervalMs ?? 2500;
  const timeoutMs = opts?.timeoutMs ?? 120000;
  const start = Date.now();

  let last = await getSongStatus(songId, jobId);
  if (last.status === 'completed' && last.audioUrl) return last;
  if (last.status === 'failed' || last.status === 'error') return last;

  while (Date.now() - start < timeoutMs) {
    if (opts?.signal?.aborted) throw new Error('aborted');
    await new Promise((r) => setTimeout(r, intervalMs));
    last = await getSongStatus(songId, jobId);
    if (last.status === 'completed' && last.audioUrl) return last;
    if (last.status === 'failed' || last.status === 'error') return last;
  }

  return last;
}

/* -------------------- Provider health -------------------- */

export function checkProvider() {
  // If API is disabled, return a mock response
  if (API_DISABLED) {
    return Promise.resolve({
      ok: false,
      provider: 'disabled',
      status: 503,
      message: 'API is currently disabled'
    });
  }

  return jsonFetch<{ ok: boolean; provider: string; status: number; message: string }>(
    `${API_BASE}/song/provider/health`
  );
}
  