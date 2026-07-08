import { renderServerCards, renderMetrics, updateProgress, renderCountdown, updateStatusText, setVisibility } from './ui.js';
import { checkServers } from './checker.js';
import { loadAppConfig } from './config.js';
import { Logger, logInfo, logSuccess, logWarning, logError } from './logger.js';

export async function initializeGateway() {
  const mainMessageEl = document.getElementById('mainMessage');
  const subMessageEl = document.getElementById('subMessage');
  const countdownEl = document.getElementById('countdown');
  const countdownBarEl = document.getElementById('countdownBar');
  const progressEl = document.getElementById('progressBar');
  const progressStepsEl = document.getElementById('progressSteps');
  const serverListEl = document.getElementById('serverList');
  const metricsEl = document.getElementById('metrics');
  const statusTextEl = document.getElementById('statusTextInline') || document.getElementById('statusText');
  const errorMessageEl = document.getElementById('errorMessage');
  const fallbackEl = document.getElementById('fallbackPage');
  const loaderWrapEl = document.getElementById('loaderWrap');
  const countdownCardEl = document.getElementById('countdownCard');
  const terminalBodyEl = document.getElementById('terminalBody');
  const terminalCardEl = document.getElementById('terminalCard');
  const cancelBtnEl = document.getElementById('cancelBtn');
  const statusPanelEl = document.getElementById('statusPanel');

  const logger = new Logger(terminalBodyEl);
  const state = {
    config: null,
    messages: [],
    servers: [],
    fastestServer: null,
    selectedServer: null,
    countdownTimer: null,
    redirectCancelled: false
  };

  function updateUI() {
    if (mainMessageEl) mainMessageEl.textContent = state.config?.mainMessage || 'Redirecting...';
    if (subMessageEl) subMessageEl.textContent = state.config?.subMessage || 'Checking available servers...';
    if (countdownEl) countdownEl.textContent = state.config?.countdown || 5;
    if (serverListEl) renderServerCards(state.servers, state.selectedServer?.url, serverListEl);
    if (metricsEl) renderMetrics(state, metricsEl);
  }

  function refreshView() {
    updateUI();
    if (statusPanelEl) {
      statusPanelEl.style.display = 'grid';
    }
    if (serverListEl) {
      serverListEl.style.display = 'grid';
    }
  }

  function showStep(step) {
    const showPanel = step >= 2;
    const showCountdown = step >= 4;
    const showServers = step >= 4;
    const showTerminal = step >= 3;

    if (statusPanelEl) {
      statusPanelEl.style.display = showPanel ? 'grid' : 'none';
    }
    if (countdownCardEl) {
      countdownCardEl.style.display = showCountdown ? 'flex' : 'none';
    }
    if (serverListEl) {
      serverListEl.style.display = showServers ? 'grid' : 'none';
    }
    if (terminalCardEl) {
      terminalCardEl.style.display = showTerminal ? 'block' : 'none';
    }
  }

  function openSameTab(targetUrl) {
    if (!targetUrl) return;
    window.location.assign(targetUrl);
  }

  function showError(message, code) {
    const errorUrl = new URL('error.html', window.location.href);
    errorUrl.searchParams.set('message', message);
    errorUrl.searchParams.set('code', code);
    errorUrl.searchParams.set('details', JSON.stringify({
      failedServers: state.servers.filter((server) => server.status !== 'online').map((server) => ({
        name: server.name,
        status: server.status,
        error: server.error || 'No response'
      }))
    }));
    openSameTab(errorUrl.toString());
  }

  function redirectNow() {
    if (state.redirectCancelled) return;

    updateStatusText('Redirecting now…', statusTextEl);
    logSuccess(logger, `Redirecting to ${state.selectedServer?.name || 'the selected server'} now.`);
    if (loaderWrapEl) loaderWrapEl.style.display = 'none';
    if (countdownCardEl) countdownCardEl.style.display = 'none';
    openSameTab(state.selectedServer?.url || '/');
  }

  cancelBtnEl?.addEventListener('click', () => {
    state.redirectCancelled = true;
    if (state.countdownTimer) {
      window.clearInterval(state.countdownTimer);
    }
    updateStatusText('Redirect cancelled.', statusTextEl);
    logWarning(logger, 'Redirect cancelled by user.');
  });

  try {
    showStep(1);
    logInfo(logger, 'Loading configuration...');
    updateProgress(0, 6, progressEl, progressStepsEl);
    const { config, messages, servers } = await loadAppConfig();
    state.config = config;
    state.messages = messages;
    state.servers = servers;
    logSuccess(logger, `${servers.length} servers loaded from configuration.`);
    updateProgress(1, 6, progressEl, progressStepsEl);
    showStep(2);

    if (messages.length) {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      updateStatusText(randomMessage, statusTextEl);
    }

    logInfo(logger, 'Running health checks across all servers...');
    updateProgress(2, 6, progressEl, progressStepsEl);
    showStep(3);
    const results = await checkServers(state.servers, state.config, logger, () => {
      refreshView();
      updateStatusText('Checking endpoints…', statusTextEl);
    });
    state.servers = results;
    updateProgress(3, 6, progressEl, progressStepsEl);

    const healthyServers = state.servers
      .filter((server) => server.enabled && server.status === 'online' && Number.isFinite(server.latencyMs))
      .sort((a, b) => a.latencyMs - b.latencyMs || a.priority - b.priority);

    if (healthyServers.length) {
      state.fastestServer = healthyServers[0];
      state.selectedServer = state.fastestServer;
      logSuccess(logger, `${state.fastestServer.name} selected as fastest healthy server (${state.fastestServer.latencyMs} ms).`);
      updateProgress(4, 6, progressEl, progressStepsEl);
      showStep(4);
      refreshView();
      redirectNow();
      updateProgress(5, 6, progressEl, progressStepsEl);
      return;
    }

    logError(logger, 'No healthy servers available.');
    updateProgress(5, 6, progressEl, progressStepsEl);
    refreshView();
    showError(state.config.errorMessage || 'No reachable server found.', 'ERR_NO_SERVER');
  } catch (error) {
    logError(logger, 'Failed to load redirect configuration.');
    refreshView();
    showError('Unable to load redirect configuration.', 'ERR_CONFIG');
  }
}
