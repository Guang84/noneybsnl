import { formatTimestamp } from './utils.js';

export class Logger {
  constructor(targetEl) {
    this.targetEl = targetEl;
    this.entries = [];
  }

  add(level, message) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level,
      message,
      timestamp: formatTimestamp(new Date())
    };

    this.entries.push(entry);
    this.render();
  }

  info(message) {
    this.add('info', message);
  }

  success(message) {
    this.add('success', message);
  }

  warning(message) {
    this.add('warning', message);
  }

  error(message) {
    this.add('error', message);
  }

  render() {
    if (!this.targetEl) return;

    const fragment = document.createDocumentFragment();
    const slice = this.entries.slice(-30);

    slice.forEach((entry) => {
      const row = document.createElement('div');
      row.className = `log-entry ${entry.level}`;
      row.innerHTML = `
        <span class="timestamp">${entry.timestamp}</span>
        <span class="level">${entry.level}</span>
        <span>${entry.message}</span>
      `;
      fragment.appendChild(row);
    });

    this.targetEl.innerHTML = '';
    this.targetEl.appendChild(fragment);
    this.targetEl.scrollTop = this.targetEl.scrollHeight;
  }
}

export function logInfo(logger, message) {
  logger?.info(message);
}

export function logSuccess(logger, message) {
  logger?.success(message);
}

export function logWarning(logger, message) {
  logger?.warning(message);
}

export function logError(logger, message) {
  logger?.error(message);
}
