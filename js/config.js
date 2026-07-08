import { normalizeUrl } from './utils.js';

const DEFAULT_CONFIG = {
  serverLinks: [],
  servers: [],
  timeout: 3000,
  retry: 2,
  delay: 250,
  countdown: 5,
  mainMessage: 'Redirecting you to the best available server...',
  subMessage: 'Checking available servers. You will be redirected soon.',
  errorMessage: 'Redirection failed. Please select a server below.'
};

function coerceServer(entry, index) {
  const url = normalizeUrl(entry?.url || entry?.link || entry);
  if (!url) return null;

  return {
    id: entry?.id || `server-${index + 1}`,
    name: entry?.name || `Server ${index + 1}`,
    url,
    priority: Number(entry?.priority) || index + 1,
    enabled: entry?.enabled !== false,
    status: 'pending',
    latencyMs: null,
    responseCode: null,
    attempts: 0,
    timestamp: null,
    error: null
  };
}

export async function loadAppConfig() {
  const [configResponse, messagesResponse] = await Promise.all([
    fetch('redirect-config.json').then((response) => response.json()),
    fetch('messages.json').then((response) => response.json())
  ]);

  const data = configResponse && typeof configResponse === 'object' ? configResponse : {};
  const config = {
    ...DEFAULT_CONFIG,
    ...data,
    timeout: Number(data.timeout) || DEFAULT_CONFIG.timeout,
    retry: Number(data.retry) || DEFAULT_CONFIG.retry,
    delay: Number(data.delay) || DEFAULT_CONFIG.delay,
    countdown: Number(data.countdown ?? data.countdownSeconds) || DEFAULT_CONFIG.countdown,
    mainMessage: data.mainMessage || DEFAULT_CONFIG.mainMessage,
    subMessage: data.subMessage || DEFAULT_CONFIG.subMessage,
    errorMessage: data.errorMessage || DEFAULT_CONFIG.errorMessage
  };

  const structuredServers = Array.isArray(data.servers)
    ? data.servers
    : [];
  const legacyServers = Array.isArray(data.serverLinks)
    ? data.serverLinks
    : [];

  const servers = [];
  structuredServers.forEach((entry, index) => {
    const server = coerceServer(entry, index);
    if (server) servers.push(server);
  });

  if (!servers.length) {
    legacyServers.forEach((entry, index) => {
      const server = coerceServer({ url: entry }, index);
      if (server) servers.push(server);
    });
  }

  const messages = Array.isArray(messagesResponse?.messages) ? messagesResponse.messages : [];

  return { config, messages, servers };
}
