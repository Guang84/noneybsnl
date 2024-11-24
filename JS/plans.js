document.addEventListener('DOMContentLoaded', function () {
    // Fetch plans immediately on page load
    fetchPlans();

    // Set interval to refresh the plans every 5 minutes (300000 ms)
    setInterval(fetchPlans, 300000);
});

// Fetch the plans from the JSON file
async function fetchPlans() {
    const planList = document.getElementById('plan-list');
    const loader = document.getElementById('loader');

    // Show the loading spinner
    loader.style.display = 'block';

    try {
        // Fetch the data from the local JSON file
        const response = await fetch('https://raw.githubusercontent.com/Guang84/myweb-link/refs/heads/main/Json/plans.json');
        
        // Check if response is successful (status 200)
        if (!response.ok) {
            throw new Error('Failed to load plans');
        }

        const plans = await response.json();

        // Hide the loader after the plans are fetched
        loader.style.display = 'none';

        // Clear any previous plans in the list before displaying new ones
        planList.innerHTML = '';

        // If no plans, show a message
        if (plans.length === 0) {
            planList.innerHTML = '<p>No plans available at the moment.</p>';
        } else {
            displayPlans(plans);
        }

    } catch (error) {
        loader.style.display = 'none'; // Hide the loader
        planList.innerHTML = `<p>Error loading plans: ${error.message}</p>`;
    }
}

// Function to display the plans on the page
function displayPlans(plans) {
    const planList = document.getElementById('plan-list');

    // Loop through each plan and create an HTML structure for it
    plans.forEach(plan => {
        const planCard = document.createElement('div');
        planCard.classList.add('plan-card');

        planCard.innerHTML = `
            <h3>${plan.name}</h3>
            <p><strong>Price:</strong> ${plan.price}</p>
            <p><strong>Speed:</strong> ${plan.speed}</p>
            <p><strong>Details:</strong> ${plan.details}</p>
            <button class="cta-btn" data-plan-name="${plan.name}" data-plan-price="${plan.price}" data-plan-speed="${plan.speed}" data-plan-details="${plan.details}">Get This Plan</button>
        `;

        planList.appendChild(planCard);
    });

    // Add event listener to the "Get This Plan" button
    document.querySelectorAll('.cta-btn').forEach(button => {
        button.addEventListener('click', function (event) {
            // Get the plan details from the button data attributes
            const planName = event.target.getAttribute('data-plan-name');
            const planPrice = event.target.getAttribute('data-plan-price');
            const planSpeed = event.target.getAttribute('data-plan-speed');
            const planDetails = event.target.getAttribute('data-plan-details');

            // Build the URL to redirect to signup.html with the plan details as query parameters
            const signupUrl = `signup.html?planName=${encodeURIComponent(planName)}&planPrice=${encodeURIComponent(planPrice)}&planSpeed=${encodeURIComponent(planSpeed)}&planDetails=${encodeURIComponent(planDetails)}`;

            // Create an anchor element to open the link in a new tab
            const a = document.createElement('a');
            a.href = signupUrl;
            a.target = '_blank';  // Open in new tab
            document.body.appendChild(a);
            a.click();  // Simulate the click to open the new tab
            document.body.removeChild(a);  // Clean up by removing the link
        });
    });
}
