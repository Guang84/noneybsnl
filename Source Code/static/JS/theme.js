class ThemeManager {
    constructor() {
        this.themeButtons = document.querySelectorAll('.theme-btn');
        this.init();
    }

    init() {
        this.loadTheme();
        this.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setTheme(btn.dataset.theme));
        });
    }

    setTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
        this.updateActiveButton(themeName);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    updateActiveButton(themeName) {
        this.themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });
    }
}

// Initialize Theme Manager
new ThemeManager();
// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    const app = {
        init() {
            this.cacheElements();
            this.bindEvents();
            this.loadData();
        },

        cacheElements() {
            this.elements = {
                searchButton: document.getElementById('search-button'),
                searchInput: document.getElementById('search-input'),
                // Add other elements here
            };
        },

        bindEvents() {
            this.elements.searchButton.addEventListener('click', () => this.handleSearch());
            // Add other event listeners
        },

        async loadData() {
            try {
                showLoading();
                const response = await fetch('db/Json/cusdata.json');
                this.customers = await response.json();
                this.displayGponList();
            } catch (error) {
                this.handleError(error);
            } finally {
                hideLoading();
            }
        },

        displayGponList() {
            // Previous GPON list implementation
        },

        handleSearch() {
            // Previous search implementation
        },

        handleError(error) {
            console.error('Application Error:', error);
            displayNoDataMessage('Failed to load data. Please try again later.');
        }
    };

    app.init();
});

// Utility Functions
function showLoading() {
    document.getElementById('loading').classList.add('visible');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('visible');
}

function displayNoDataMessage(message) {
    const messageElement = document.getElementById('no-data-message');
    messageElement.textContent = message;
    messageElement.classList.add('fade-in', 'visible');
}