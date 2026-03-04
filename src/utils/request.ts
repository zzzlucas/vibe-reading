import { useAppStore } from '@/store/appStore';

export function generateSecurityHash(payload: string | number, deviceId: string): string {
  const salt = "f!nD_dEep#82";
  const raw = `${salt}:${payload}:@:${deviceId}`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  // Expand to a 64-character UUID-like intimidating hash string (8x8)
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const p4 = ((~h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const p5 = ((h1 ^ ~h2) >>> 0).toString(16).padStart(8, '0');
  const p6 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  const p7 = ((h1 - h2) >>> 0).toString(16).padStart(8, '0');
  const p8 = ((h2 - h1) >>> 0).toString(16).padStart(8, '0');

  return p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Only intercept our own API calls starting with /api/
  if (!url.startsWith('/api/')) {
    return fetch(url, options);
  }

  const store = useAppStore();
  let deviceId = 'unknown';
  try {
    deviceId = await store.ensureDeviceId();
  } catch (e) {
    // fallback if store is not fully initialized, though unlikely
    deviceId = localStorage.getItem('find_deep_device_id') || 'unknown';
  }

  const timestamp = Date.now();
  const urlObj = new URL(url, window.location.origin);
  const path = urlObj.pathname;

  const payload = `${timestamp}:${path}`;
  const signature = generateSecurityHash(payload, deviceId);

  const headers = new Headers(options.headers || {});
  headers.set('X-Device-Id', deviceId);
  headers.set('X-Timestamp', timestamp.toString());
  headers.set('X-Signature', signature);

  return fetch(url, { ...options, headers });
}
