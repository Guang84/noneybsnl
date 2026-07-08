import { sleep } from './utils.js';

async function probeServer(server, config, logger) {
  const timeout = Math.min(1400, Number(config.timeout) || 1400);
  const retries = Math.min(1, Number(config.retry) || 1);
  const delay = Math.min(140, Number(config.delay) || 120);

  server.status = 'checking';
  server.error = null;
  server.attempts = 0;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const startedAt = performance.now();
    const timer = window.setTimeout(() => controller.abort(), timeout);

    try {
      server.attempts += 1;
      const response = await fetch(server.url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal
      });
      window.clearTimeout(timer);
      server.status = 'online';
      server.latencyMs = Math.round(performance.now() - startedAt);
      server.responseCode = response?.status ?? 200;
      server.timestamp = new Date().toISOString();
      return server;
    } catch (error) {
      window.clearTimeout(timer);
      try {
        const fallbackResponse = await fetch(server.url, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
          redirect: 'follow',
          signal: AbortSignal.timeout(timeout)
        });
        server.status = 'online';
        server.latencyMs = Math.round(performance.now() - startedAt);
        server.responseCode = fallbackResponse?.status ?? 200;
        server.timestamp = new Date().toISOString();
        return server;
      } catch (fallbackError) {
        server.status = 'offline';
        server.latencyMs = null;
        server.responseCode = null;
        server.error = fallbackError?.name || error?.name || 'Network error';

        if (attempt < retries) {
          logger?.warning(`${server.name}: attempt ${attempt + 1} failed, retrying...`);
          await sleep(delay);
        }
      }
    }
  }

  return server;
}

export async function checkServers(servers, config, logger, onProgress = null) {
  const results = await Promise.all(
    servers.map((server) => {
      if (!server.enabled) {
        server.status = 'disabled';
        server.latencyMs = null;
        server.responseCode = null;
        onProgress?.(server);
        return Promise.resolve(server);
      }
      return probeServer(server, config, logger).then((result) => {
        onProgress?.(result);
        return result;
      });
    })
  );

  return results;
}
