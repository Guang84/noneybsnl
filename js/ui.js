import { formatLatency, formatResponseCode, formatTimestamp } from './utils.js';

export function renderServerCards(servers, selectedUrl, containerEl) {
  if (!containerEl) return;

  containerEl.innerHTML = '';
  const fragment = document.createDocumentFragment();

  servers.forEach((server, index) => {
    const card = document.createElement('article');
    const statusClass = server.status === 'online' ? 'online' : server.status === 'checking' ? 'checking' : server.status === 'disabled' ? 'disabled' : 'offline';
    card.className = `server-card ${statusClass}${selectedUrl && server.url === selectedUrl ? ' best' : ''}`;

    card.innerHTML = `
      <div class="server-main">
        <span class="server-name">${server.name}</span>
        <div class="server-url">${server.url}</div>
      </div>
      <div class="server-meta">
        <span class="server-badge ${statusClass}">${server.status}</span>
        <div>${server.latencyMs ? formatLatency(server.latencyMs) : '—'}</div>
        <div>Code: ${formatResponseCode(server.responseCode)}</div>
        <div>Priority: ${server.priority}</div>
      </div>
    `;
    fragment.appendChild(card);
  });

  containerEl.appendChild(fragment);
}

export function renderMetrics(state, metricsEl) {
  if (!metricsEl) return;

  const onlineCount = state.servers.filter((server) => server.status === 'online').length;
  const offlineCount = state.servers.filter((server) => server.status === 'offline').length;
  const averageLatency = state.servers.filter((server) => server.status === 'online' && Number.isFinite(server.latencyMs)).reduce((sum, server) => sum + server.latencyMs, 0) / Math.max(1, onlineCount);

  metricsEl.innerHTML = `
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Servers Online</span>
        <span class="metric-value">${onlineCount}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Servers Offline</span>
        <span class="metric-value">${offlineCount}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Average Latency</span>
        <span class="metric-value">${Number.isFinite(averageLatency) ? formatLatency(averageLatency) : '—'}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Fastest Server</span>
        <span class="metric-value">${state.fastestServer?.name || '—'}</span>
      </div>
    </div>
  `;
}

export function updateProgress(stepIndex, totalSteps, progressEl, stepsEl) {
  if (progressEl) {
    const percent = Math.round((stepIndex / totalSteps) * 100);
    progressEl.style.width = `${percent}%`;
  }

  if (stepsEl) {
    const steps = Array.from(stepsEl.querySelectorAll('.progress-step'));
    steps.forEach((step, index) => {
      step.classList.toggle('active', index <= stepIndex);
    });
  }
}

export function renderCountdown(seconds, countdownEl, progressEl) {
  if (countdownEl) {
    countdownEl.textContent = seconds;
  }

  if (progressEl) {
    const percent = Math.max(0, (seconds / 5) * 100);
    progressEl.style.width = `${percent}%`;
  }
}

export function updateStatusText(text, targetEl) {
  if (targetEl) {
    targetEl.textContent = text;
  }
}

export function setVisibility(el, visible) {
  if (!el) return;
  el.style.display = visible ? 'block' : 'none';
}

export function populateErrorPage(params, errorPageEl) {
  if (!errorPageEl) return;
  errorPageEl.querySelector('#errorCode').textContent = params.code || 'ERR_UNKNOWN';
  errorPageEl.querySelector('#errorMessage').textContent = params.message || 'The redirect gateway could not find a healthy server.';
  errorPageEl.querySelector('#errorTimestamp').textContent = formatTimestamp(new Date());
  const summaryList = errorPageEl.querySelector('#serverSummary');
  if (summaryList) {
    summaryList.innerHTML = '';
    const items = Array.isArray(params.failedServers) ? params.failedServers : [];
    if (!items.length) {
      summaryList.innerHTML = '<li>No server details available.</li>';
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `${item.name}: ${item.status} (${item.error || 'unknown'})`;
      fragment.appendChild(li);
    });
    summaryList.appendChild(fragment);
  }
}
