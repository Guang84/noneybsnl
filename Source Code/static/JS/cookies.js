// Check if cookie consent was given
function checkCookieConsent() {
    const consentGiven = getCookie("cookieConsent");
    
    if (consentGiven === "") {
        // Show popup if no consent was given yet
        document.getElementById("cookieConsentPopup").style.display = "block";
    } else {
        // If consent was given, you can load additional cookies/tracking scripts here
        if (consentGiven === "all") {
            loadOptionalCookies();
        }
    }
}

// Handle accept all cookies button
document.getElementById("acceptAllCookies").addEventListener("click", function() {
    setCookie("cookieConsent", "all", 365);
    document.getElementById("cookieConsentPopup").style.display = "none";
    loadOptionalCookies();
});

// Handle necessary cookies only button
document.getElementById("acceptNecessaryCookies").addEventListener("click", function() {
    setCookie("cookieConsent", "necessary", 365);
    document.getElementById("cookieConsentPopup").style.display = "none";
});

// Function to load optional cookies/scripts
function loadOptionalCookies() {
    // Add your analytics, advertising, or other optional cookies here
    // Example: Google Analytics
    // if (typeof gtag !== 'undefined') {
    //     gtag('config', 'YOUR_GA_ID');
    // }
}

// Run the check when the page loads
window.onload = checkCookieConsent;