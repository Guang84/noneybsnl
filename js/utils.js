export function normalizeUrl(value) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/ngrok\s+link/i.test(trimmed)) return null;

  try {
    if (trimmed.includes('://')) {
      return new URL(trimmed).href;
    }

    const isPrivateHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(trimmed);
    const protocol = isPrivateHost ? 'http://' : 'https://';
    return new URL(`${protocol}${trimmed}`).href;
  } catch (error) {
    return null;
  }
}

export function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function formatLatency(value) {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value)} ms`;
}

export function formatTimestamp(date = new Date()) {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function formatResponseCode(value) {
  return Number.isFinite(value) ? String(value) : '—';
}

export function createId(prefix = 'item') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
