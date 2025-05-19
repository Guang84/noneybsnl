// Handle form submission with JavaScript (AJAX)
document.getElementById('feedbackForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Collect form data
    const email = document.getElementById('email').value;
    const comtext = document.getElementById('comtext').value;

    // Send form data to server
    fetch('/submit_feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, comtext })
    })
    .then(response => response.json())
    .then(data => {
        const responseMessage = document.getElementById('responseMessage');
        responseMessage.textContent = data.message;
        responseMessage.style.color = data.status === 'success' ? 'green' : 'red';
    })
    .catch(() => {
        const responseMessage = document.getElementById('responseMessage');
        responseMessage.textContent = 'An error occurred. Please try again.';
        responseMessage.style.color = 'red';
    });
});