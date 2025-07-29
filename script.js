// Enhanced Configuration
const CONFIG = {
    REDIRECTS: [
        {
            name: "Main Server",
            url: "https://117-223-119.ngrok-free.app",
            delay: 2000,
            fallbackUrls: [
                "https://backup1.noneybsnl.in",
                "https://backup2.noneybsnl.in"
            ]
        }
    ],
    MESSAGES: [
        "Establishing secure connection...",
        "Authenticating with BSNL network...",
        "Optimizing connection speed...",
        "Verifying network credentials...",
        "Finalizing secure tunnel..."
    ],
    MIN_DELAY: 1500,
    MESSAGE_INTERVAL: 2500,
    HEALTH_CHECK_TIMEOUT: 4000,
    PARTICLE_COUNT: 25,
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000
};

// DOM Elements
const elements = {
    messageContainer: document.getElementById('messageContainer'),
    manualRedirect: document.getElementById('manualRedirect'),
    messages: document.querySelectorAll('.message'),
    progress: document.getElementById('progress'),
    progressText: document.getElementById('progressText'),
    particlesContainer: document.getElementById('particles'),
    errorNotification: document.getElementById('errorNotification'),
    errorMessage: document.getElementById('errorMessage')
};

// State management
let currentState = {
    redirect: null,
    isHealthy: false,
    redirectStartTime: null,
    redirectTimeout: null,
    retryCount: 0,
    currentFallbackIndex: 0
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    initializeApp();
});

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

// Main initialization function
function initializeApp() {
    try {
        // Set the first redirect target
        currentState.redirect = CONFIG.REDIRECTS[0];
        
        // Initialize messages
        initMessages();
        
        // Set manual redirect button
        setupManualRedirect();
        
        // Start the connection process
        startConnectionProcess();
        
    } catch (error) {
        handleError(error, true);
    }
}

// Initialize rotating messages
function initMessages() {
    if (CONFIG.MESSAGES.length === 0) {
        elements.messageContainer.style.display = 'none';
        return;
    }
    
    let currentIndex = 0;
    const showNextMessage = () => {
        elements.messages.forEach((msg, i) => {
            msg.textContent = CONFIG.MESSAGES[currentIndex];
            msg.classList.toggle('active', i === 0);
            currentIndex = (currentIndex + 1) % CONFIG.MESSAGES.length;
        });
    };
    
    showNextMessage();
    setInterval(showNextMessage, CONFIG.MESSAGE_INTERVAL);
}

// Setup manual redirect button
function setupManualRedirect() {
    elements.manualRedirect.href = currentState.redirect.url;
    elements.manualRedirect.querySelector('.btn-text').textContent = `Open ${currentState.redirect.name} Now`;
    elements.manualRedirect.addEventListener('click', (e) => {
        e.preventDefault();
        attemptRedirect();
    });
    elements.manualRedirect.style.display = 'none';
}

// Start the connection process
async function startConnectionProcess() {
    try {
        // Check server health with retries
        currentState.isHealthy = await checkServerHealthWithRetry();
        
        if (currentState.isHealthy) {
            // Start the redirect sequence
            setupRedirect();
        } else {
            showError("Unable to connect to server. Trying fallback...", false);
            attemptFallback();
        }
        
    } catch (error) {
        handleError(error, false);
    }
}

// Check server health with retry logic
async function checkServerHealthWithRetry() {
    for (let i = 0; i < CONFIG.MAX_RETRIES; i++) {
        try {
            const isHealthy = await checkServerHealth();
            if (isHealthy) return true;
            
            if (i < CONFIG.MAX_RETRIES - 1) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            }
        } catch (error) {
            console.error(`Health check attempt ${i + 1} failed:`, error);
        }
    }
    return false;
}

// Check if server is responsive
async function checkServerHealth() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.HEALTH_CHECK_TIMEOUT);
        
        const response = await fetch(currentState.redirect.url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
            cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        return response.ok || true; // no-cors requests won't expose response.ok
    } catch (error) {
        console.error('Server health check failed:', error);
        throw error;
    }
}

// Attempt to use fallback URLs
function attemptFallback() {
    if (currentState.redirect.fallbackUrls && 
        currentState.currentFallbackIndex < currentState.redirect.fallbackUrls.length) {
        
        currentState.redirect.url = currentState.redirect.fallbackUrls[currentState.currentFallbackIndex];
        currentState.currentFallbackIndex++;
        
        showError(`Trying fallback server ${currentState.currentFallbackIndex}...`, false);
        
        // Retry the connection process
        setTimeout(() => {
            startConnectionProcess();
        }, CONFIG.RETRY_DELAY);
    } else {
        handleError(new Error('All connection attempts failed'), true);
    }
}

// Setup the automatic redirect with progress bar
function setupRedirect() {
    currentState.redirectStartTime = Date.now();
    const delay = Math.max(currentState.redirect.delay || 0, CONFIG.MIN_DELAY);
    
    // Show manual button after half the delay
    setTimeout(() => {
        elements.manualRedirect.style.display = 'inline-flex';
        elements.manualRedirect.classList.add('pulse');
    }, delay / 2);
    
    // Start progress animation
    updateProgress();
}

// Update progress bar animation
function updateProgress() {
    const elapsed = Date.now() - currentState.redirectStartTime;
    const delay = Math.max(currentState.redirect.delay || 0, CONFIG.MIN_DELAY);
    const progress = Math.min((elapsed / delay) * 100, 100);
    
    elements.progress.style.width = `${progress}%`;
    elements.progressText.textContent = `${Math.round(progress)}%`;
    
    if (progress < 100) {
        currentState.redirectTimeout = requestAnimationFrame(updateProgress);
    } else {
        attemptRedirect();
    }
}

// Attempt to redirect to the target URL
function attemptRedirect() {
    try {
        if (currentState.isHealthy) {
            // Add redirect analytics here if needed
            window.location.href = currentState.redirect.url;
        } else {
            throw new Error('Server connection was not established');
        }
    } catch (error) {
        handleError(error, true);
    }
}

// Show error notification
function showError(message, isFatal) {
    elements.errorMessage.textContent = message;
    elements.errorNotification.classList.add('show');
    
    if (isFatal) {
        elements.manualRedirect.style.display = 'inline-flex';
        elements.progress.style.backgroundColor = 'var(--error)';
    }
}

// Handle errors
function handleError(error, isFatal) {
    console.error('Connection Error:', error);
    
    const userMessage = isFatal 
        ? "Connection failed. Please try again or contact support."
        : error.message || "Connection issue detected. Retrying...";
    
    showError(userMessage, isFatal);
    
    if (isFatal) {
        // Log error to analytics if available
        if (typeof ga !== 'undefined') {
            ga('send', 'exception', {
                exDescription: error.message,
                exFatal: isFatal
            });
        }
    }
}

// Clean up on window close
window.addEventListener('beforeunload', () => {
    if (currentState.redirectTimeout) {
        cancelAnimationFrame(currentState.redirectTimeout);
    }
});