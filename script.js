const CONFIG = {
    REDIRECTS_URL: 'redirects.json',
    MESSAGES_URL: 'messages.json',
    MIN_DELAY: 1000,
    MESSAGE_INTERVAL: 3000,
    HEALTH_CHECK_TIMEOUT: 3000,
    PARTICLE_COUNT: 30
};

const elements = {
    messageContainer: document.getElementById('messageContainer'),
    manualRedirect: document.getElementById('manualRedirect'),
    messages: document.querySelectorAll('.message'),
    progress: document.getElementById('progress'),
    card: document.querySelector('.card')
};

let currentState = {
    redirect: null,
    messages: [],
    isHealthy: false
};

class ParticleSystem {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.createParticles();
    }

    createParticles() {
        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            const size = Math.random() * 5 + 2;
            const posX = Math.random() * 100;
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * -20;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.opacity = Math.random() * 0.3 + 0.1;
            particle.style.background = `hsl(${Math.random() * 60 + 250}, 100%, 70%)`;
            
            this.container.appendChild(particle);
            this.particles.push(particle);
        }
    }
}

async function initialize() {
    try {
        // Create particle background
        new ParticleSystem(document.body);
        
        // Load resources
        await Promise.all([
            loadRedirects(),
            loadMessages()
        ]);
        
        // Setup UI
        initMessages();
        elements.manualRedirect.href = currentState.redirect.url;
        elements.manualRedirect.textContent = `Open ${currentState.redirect.name} Now`;
        
        // Start health check and redirect sequence
        await checkServerHealth();
        setupRedirect();
        
    } catch (error) {
        handleError(error);
    }
}

async function loadRedirects() {
    const response = await fetch(CONFIG.REDIRECTS_URL);
    if (!response.ok) throw new Error('Failed to load redirect destinations');
    const data = await response.json();
    currentState.redirect = data.redirects[0];
}

async function loadMessages() {
    try {
        const response = await fetch(CONFIG.MESSAGES_URL);
        if (response.ok) {
            currentState.messages = (await response.json()).messages;
        }
    } catch (e) {
        console.warn('Could not load messages:', e);
    }
}

function initMessages() {
    if (currentState.messages.length === 0) {
        elements.messageContainer.style.display = 'none';
        return;
    }
    
    let currentIndex = 0;
    const showNextMessage = () => {
        elements.messages.forEach((msg, i) => {
            msg.textContent = currentState.messages[currentIndex];
            msg.classList.toggle('active', i === 0);
            currentIndex = (currentIndex + 1) % currentState.messages.length;
        });
    };
    
    showNextMessage();
    setInterval(showNextMessage, CONFIG.MESSAGE_INTERVAL);
}

async function checkServerHealth() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.HEALTH_CHECK_TIMEOUT);
        
        const response = await fetch(currentState.redirect.url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        currentState.isHealthy = true;
        return true;
    } catch (error) {
        console.error('Server health check failed:', error);
        currentState.isHealthy = false;
        return false;
    }
}

function setupRedirect() {
    const startTime = Date.now();
    const delay = Math.max(currentState.redirect.delay || 0, CONFIG.MIN_DELAY);
    
    // Animate progress bar
    const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / delay) * 100, 100);
        elements.progress.style.width = `${progress}%`;
        
        if (progress < 100) {
            requestAnimationFrame(updateProgress);
        } else {
            completeRedirect();
        }
    };
    
    updateProgress();
    
    // Show manual button as fallback
    setTimeout(() => {
        elements.manualRedirect.style.display = 'inline-flex';
        elements.manualRedirect.classList.add('pulse');
    }, delay / 2);
}

function completeRedirect() {
    if (currentState.isHealthy) {
        window.open(currentState.redirect.url, '_blank') || 
        window.location.assign(currentState.redirect.url);
    } else {
        handleError(new Error('Server is active but not responding properly'));
    }
}

function handleError(error) {
    console.error('Redirect Error:', error);
    const errorMessage = encodeURIComponent(
        error.message || 'Failed to establish connection'
    );
    window.location.href = `error.html?message=${errorMessage}&code=CONNECTION_FAILED`;
}

document.addEventListener('DOMContentLoaded', initialize);