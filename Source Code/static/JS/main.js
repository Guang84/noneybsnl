// Function to open the sidebar
function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
  }
  
  // Function to close the sidebar
  function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
  }
  
  // Add event listeners to the menu items to close the sidebar after clicking
  document.querySelectorAll('#mySidebar .w3-bar-item').forEach(function(item) {
    item.addEventListener('click', function() {
      w3_close();  // Close the sidebar when a menu item is clicked
    });
  });
   //text loader animate
   document.addEventListener('DOMContentLoaded', function() {
    // Array of animation classes
    const animationClasses = [
      'fadeInUp',     // Fade in with upward movement
      'scaleZoom',     // Scale and zoom effect
      'rotateSlide',   // Rotate and slide effect
      'typeWriter',    // Typewriter effect
      'bounce'         // Bounce effect
    ];
  
    // Select all elements with the .loader-text class
    const loaderTextElements = document.querySelectorAll('.loader-text');
  
    // Loop through each loader-text element and randomly assign an animation class
    loaderTextElements.forEach((element, index) => {
      // Pick a random animation class from the array
      const randomIndex = Math.floor(Math.random() * animationClasses.length);
      const randomAnimationClass = animationClasses[randomIndex];
      
      // Add the random animation class to the element
      element.classList.add(randomAnimationClass);
  
      // Add staggered delay based on the index of the element (delays each animation by 0.2s increment)
      const staggerDelay = index * 0.2; // Adjust this value for faster/slower staggering
      element.style.animationDelay = `${staggerDelay}s`;
  
      // Ensure the text stays visible after the animation completes
      element.style.opacity = 1;
    });
  });
  // cookies 
  // Cookie management functions
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
  const cookieName = name + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for(let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i];
      while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1);
      }
      if (cookie.indexOf(cookieName) === 0) {
          return cookie.substring(cookieName.length, cookie.length);
      }
  }
  return "";
}

function deleteCookie(name) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
} 
//popup 
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