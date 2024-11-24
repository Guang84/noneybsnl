// Admin page security logic
document.getElementById('adminLink').addEventListener('click', function(event) {
    event.preventDefault();

    // Prompt user for security code
    const securityCode = prompt('Please enter the security code to access the admin page:');

    // Call API to verify the admin code
    fetch('/verify_admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ security_code: securityCode })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // If success, redirect to admin page
            window.location.href = '/admin';
        } else {
            // If error, alert the user
            alert(data.message);
        }
    })
    .catch(error => alert('An error occurred while verifying the security code.'));
});
