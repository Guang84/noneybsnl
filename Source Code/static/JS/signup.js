document.addEventListener('DOMContentLoaded', function () {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const planName = urlParams.get('planName');
    const planPrice = urlParams.get('planPrice');
    const planSpeed = urlParams.get('planSpeed');
    const planDetails = urlParams.get('planDetails');

    // Populate the page with plan details
    if (planName && planPrice && planSpeed && planDetails) {
        document.getElementById('plan-name').textContent = planName;
        document.getElementById('plan-price').textContent = planPrice;
        document.getElementById('plan-speed').textContent = planSpeed;
        document.getElementById('plan-details').textContent = planDetails;

        const message = `Plan Name: ${planName}\nPrice: ${planPrice}\nSpeed: ${planSpeed}\nDetails: ${planDetails}`;
        document.getElementById('copy-box').textContent = message;

        // Update WhatsApp link
        const whatsappLink = document.getElementById('whatsapp-link');
        whatsappLink.href = `https://wa.me/+918415028828?text=${encodeURIComponent(message)}`;
    } else {
        alert('No plan details provided. Please check the link.');
    }

    // Copy to clipboard functionality
    document.getElementById('copy-button').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('copy-box').textContent)
            .then(() => alert('Plan details copied to clipboard!'))
            .catch(err => alert('Error copying text: ' + err));
    });
});

