// Simulate loading process
window.onload = function() {
  setTimeout(function() {
    // Hide the loader
    document.getElementById("loader").style.display = "none";
    // Show the actual content
    document.getElementById("content").style.display = "block";
  }, 5000); // 5 seconds loading time (can be adjusted)
};

// Wrap each letter of the text inside a <span>
document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('.animated-header');
    headers.forEach(header => {
        const text = header.textContent; // Original text
        header.innerHTML = ''; // Clear existing text
        text.split('').forEach(letter => {
            const span = document.createElement('span'); // Wrap each letter in a <span>
            span.textContent = letter;
            header.appendChild(span);
        });
    });
});
