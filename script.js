// Configuration
const CONFIG = {
  REDIRECTS: [
    {
      name: "Main Server",
      url: "https://079c8ac4790f.ngrok-free.app/",
      delay: 2000
    },
    {
      name: "Backup Node",
      url: "https://079c8ac4790f.ngrok-free.app/",
      delay: 3000
    }
  ],
  MESSAGES: [
    "Please wait while we take you to the Noney BSNL Wi-Fi webpage.",
    "Hang tight! We're redirecting you to the Noney BSNL Wi-Fi page.",
    "Just a moment... taking you to the Noney BSNL Wi-Fi site.",
    "Please hold on, we're connecting you to the Noney BSNL Wi-Fi portal.",
    "One moment please — redirecting to the Noney BSNL Wi-Fi webpage.",
    "Please wait, loading the Noney BSNL Wi-Fi page.",
    "Redirecting... you'll be at the Noney BSNL Wi-Fi page shortly.",
    "Stand by as we guide you to the Noney BSNL Wi-Fi site.",
    "Connecting you to the Noney BSNL Wi-Fi webpage. Please wait.",
    "Taking you to the Noney BSNL Wi-Fi portal. Just a second.",
    "Loading the Noney BSNL Wi-Fi page — this won't take long.",
    "Please wait while we connect you to the Noney BSNL Wi-Fi site.",
    "You're being redirected to the Noney BSNL Wi-Fi page. Hang on!",
    "Hold tight — we're almost there!",
    "In a moment, you'll be at the Noney BSNL Wi-Fi webpage.",
    "Transitioning to the Noney BSNL Wi-Fi portal — please wait.",
    "We're moving you to the Noney BSNL Wi-Fi page. Please hold on.",
    "Navigating to the Noney BSNL Wi-Fi website... please be patient.",
    "Sit tight, we're opening the Noney BSNL Wi-Fi page for you.",
    "Almost there... loading the Noney BSNL Wi-Fi site now."
  ],
  MIN_DELAY: 1500,
  MESSAGE_INTERVAL: 2500,
  HEALTH_CHECK_TIMEOUT: 3000,
  PARTICLE_COUNT: 15,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  PROGRESS_UPDATE_INTERVAL: 50,
  FALLBACK_DELAY: 2000
};

// Application State
const state = {
  currentServerIndex: 0,
  retryCount: 0,
  isHealthy: false,
  progress: 0,
  messageIndex: 0,
  intervalIds: [],
  activeRequests: []
};

// DOM Elements
const elements = {
  messageContainer: document.getElementById('messageContainer'),
  message: document.querySelector('#messageContainer .message'),
  manualRedirect: document.getElementById('manualRedirect'),
  progress: document.getElementById('progress'),
  progressText: document.getElementById('progressText'),
  particlesContainer: document.getElementById('particles'),
  errorNotification: document.getElementById('errorNotification'),
  errorMessage: document.getElementById('errorMessage'),
  spinner: document.querySelector('.spinner')
};

// Initialize the application
function init() {
  createParticles();
  initMessages();
  startConnectionProcess();
}

// Create animated background particles
function createParticles() {
  for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    const size = Math.random() * 4 + 2;
    const posX = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * -20;
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${posX}%`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.opacity = Math.random() * 0.2 + 0.1;
    particle.style.background = `hsl(${Math.random() * 30 + 270}, 80%, 70%)`;
    
    elements.particlesContainer.appendChild(particle);
  }
}

// Initialize rotating messages
function initMessages() {
  if (CONFIG.MESSAGES.length === 0) {
    elements.messageContainer.style.display = 'none';
    return;
  }

  updateMessage();
  const intervalId = setInterval(updateMessage, CONFIG.MESSAGE_INTERVAL);
  state.intervalIds.push(intervalId);
}

function updateMessage() {
  elements.message.textContent = CONFIG.MESSAGES[state.messageIndex];
  state.messageIndex = (state.messageIndex + 1) % CONFIG.MESSAGES.length;
}

// Setup manual redirect button
function setupManualRedirect() {
  const server = CONFIG.REDIRECTS[state.currentServerIndex];
  elements.manualRedirect.href = server.url;
  elements.manualRedirect.querySelector('.btn-text').textContent = `Open ${server.name} Now`;
  elements.manualRedirect.onclick = (e) => {
    e.preventDefault();
    window.location.href = server.url;
  };
}

// Show error notification
function showError(message, isFatal = false) {
  elements.errorMessage.textContent = message;
  elements.errorNotification.style.display = 'flex';
  
  if (isFatal) {
    elements.manualRedirect.style.display = 'inline-flex';
    elements.progress.classList.add('error');
    elements.spinner.style.borderTopColor = 'var(--error)';
    elements.spinner.style.borderBottomColor = 'var(--error-dark)';
  }
}

// Hide error notification
function hideError() {
  elements.errorNotification.style.display = 'none';
  elements.progress.classList.remove('error');
  elements.spinner.style.borderTopColor = 'var(--primary)';
  elements.spinner.style.borderBottomColor = 'var(--secondary)';
}

// Update progress bar
function updateProgress(percentage) {
  const progress = Math.min(Math.max(percentage, 0), 100);
  elements.progress.style.width = `${progress}%`;
  elements.progressText.textContent = `${Math.round(progress)}%`;
}

// Check server health
async function checkServerHealth(url) {
  const controller = new AbortController();
  state.activeRequests.push(controller);
  
  try {
    const timeout = setTimeout(() => controller.abort(), CONFIG.HEALTH_CHECK_TIMEOUT);
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);
    return true;
  } catch (error) {
    console.warn('Health check failed:', error);
    return false;
  } finally {
    state.activeRequests = state.activeRequests.filter(c => c !== controller);
  }
}

// Attempt connection with retries
async function attemptConnection() {
  hideError();
  state.isHealthy = false;
  
  const server = CONFIG.REDIRECTS[state.currentServerIndex];
  
  for (let i = 0; i < CONFIG.MAX_RETRIES; i++) {
    state.retryCount = i + 1;
    const isHealthy = await checkServerHealth(server.url);
    
    if (isHealthy) {
      state.isHealthy = true;
      return true;
    }
    
    if (i < CONFIG.MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
    }
  }
  
  return false;
}

// Handle fallback to next server
async function handleFallback() {
  if (state.currentServerIndex < CONFIG.REDIRECTS.length - 1) {
    state.currentServerIndex++;
    showError(`Trying ${CONFIG.REDIRECTS[state.currentServerIndex].name}...`, false);
    await new Promise(resolve => setTimeout(resolve, CONFIG.FALLBACK_DELAY));
    return startConnectionProcess();
  }
  
  showError("All connection attempts failed. Please try again later.", true);
  setupManualRedirect();
  return false;
}

// Start progress animation
async function startProgressAnimation() {
  const server = CONFIG.REDIRECTS[state.currentServerIndex];
  const duration = Math.max(server.delay || 0, CONFIG.MIN_DELAY);
  
  return new Promise(resolve => {
    const startTime = Date.now();
    
    function update() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      updateProgress(progress);
      
      if (progress < 100) {
        requestAnimationFrame(update);
      } else {
        resolve();
      }
    }
    
    update();
  });
}

// Main connection process
async function startConnectionProcess() {
  setupManualRedirect();
  
  const isHealthy = await attemptConnection();
  if (!isHealthy) return handleFallback();
  
  await startProgressAnimation();
  window.location.href = CONFIG.REDIRECTS[state.currentServerIndex].url;
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  state.intervalIds.forEach(clearInterval);
  state.activeRequests.forEach(controller => controller.abort());
});

// Start the application
document.addEventListener('DOMContentLoaded', init);