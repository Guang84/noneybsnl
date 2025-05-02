const CONFIG = {
    REDIRECTS_URL: 'redirects.json',
    MESSAGES_URL: 'messages.json',
    MIN_DELAY: 500,  // Minimum delay for user feedback
    MESSAGE_INTERVAL: 3000
};

const elements = {
    messageContainer: document.getElementById('messageContainer'),
    manualRedirect: document.getElementById('manualRedirect'),
    messages: document.querySelectorAll('.message'),
    progress: document.getElementById('progress')
};

let currentState = {
    redirect: null,
    messages: []
};

async function initialize() {
    try {
        // Immediately start loading critical resources
        await loadRedirects();
        setupRedirect();
        
        // Load messages in parallel with redirect process
        loadMessages().then(initMessages).catch(console.error);
        
        // Show manual button immediately
        elements.manualRedirect.href = currentState.redirect.url;
        elements.manualRedirect.textContent = `Open ${currentState.redirect.name} Now`;
        elements.manualRedirect.style.display = 'inline-flex';

    } catch (error) {
        handleError(error);
    }
}

async function loadRedirects() {
    const response = await fetch(CONFIG.REDIRECTS_URL);
    if (!response.ok) throw new Error('Failed to load redirects');
    const data = await response.json();
    currentState.redirect = data.redirects[0];
}

function setupRedirect() {
    const startTime = Date.now();
    const delay = Math.max(currentState.redirect.delay || 0, CONFIG.MIN_DELAY);
    
    // Animate progress bar
    const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / delay) * 100, 100);
        elements.progress.style.width = `${progress}%`;
        if (progress < 100) requestAnimationFrame(updateProgress);
    };
    requestAnimationFrame(updateProgress);

    // Execute redirect
    setTimeout(() => {
        window.open(currentState.redirect.url, '_blank') || 
        window.location.assign(currentState.redirect.url);
    }, delay);
}

async function loadMessages() {
    const response = await fetch(CONFIG.MESSAGES_URL);
    if (!response.ok) return;
    currentState.messages = (await response.json()).messages;
}

function initMessages() {
    if (currentState.messages.length === 0) return;
    
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

function handleError(error) {
    console.error('Error:', error);
    window.location.href = `error.html?message=${encodeURIComponent(error.message)}`;
}

document.addEventListener('DOMContentLoaded', initialize);