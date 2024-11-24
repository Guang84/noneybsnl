document.addEventListener('DOMContentLoaded', function () {
    // Get the URL parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Retrieve the plan details from URL parameters
    const planName = urlParams.get('planName');
    const planPrice = urlParams.get('planPrice');
    const planSpeed = urlParams.get('planSpeed');
    const planDetails = urlParams.get('planDetails');

    // Display the plan details on the page
    if (planName && planPrice && planSpeed && planDetails) {
        document.getElementById('plan-name').textContent = planName;
        document.getElementById('plan-price').textContent = planPrice;
        document.getElementById('plan-speed').textContent = planSpeed;
        document.getElementById('plan-details').textContent = planDetails;

        // Create the message for the user to copy
        const message = `
Plan Name: ${planName}
Price: ${planPrice}
Speed: ${planSpeed}
Details: ${planDetails}
`;

        // Insert the message into the copy box
        document.getElementById('copy-box').textContent = message;
    } else {
        alert('No plan details found.');
    }

    // Add event listener for the "Copy to Clipboard" button
    document.getElementById('copy-button').addEventListener('click', function () {
        const copyBox = document.getElementById('copy-box');

        // Use the Clipboard API for copying
        navigator.clipboard.writeText(copyBox.value).then(() => {
            alert('Plan details copied to clipboard!');
        }).catch((err) => {
            alert('Failed to copy text: ' + err);
        });
    });
});
