// Function to load regions from the JSON file and populate the table
function loadRegions() {
    // Fetch the JSON file from the /db/region.json path
    fetch('https://raw.githubusercontent.com/Guang84/weblink/refs/heads/main/regions.json')  // Path to the regions JSON file
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();  // Parse the JSON data
        })
        .then(data => {
            const tableBody = document.getElementById('regionTable').getElementsByTagName('tbody')[0];
            
            // Clear the existing table content
            tableBody.innerHTML = '';

            // Loop through each region and add a new row to the table
            data.forEach(region => {
                const row = document.createElement('tr');
                
                const regionCell = document.createElement('td');
                regionCell.textContent = region.region;
                row.appendChild(regionCell);
                
                const plansCell = document.createElement('td');
                plansCell.textContent = region.supported_plans;
                row.appendChild(plansCell);
                
                tableBody.appendChild(row);
            });

            // Optional: Add real-time success notification (toast, modal, etc.)
            showNotification('Region data loaded successfully!', 'success');
        })
        .catch(error => {
            console.error('Error loading the regions data:', error);
            // Optional: Add error notification (toast, modal, etc.)
            showNotification('There was an error loading the region data. Please try again later.', 'error');
        });
}

// Function to show notifications (for success/error)
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;

    // Add the notification to the body and remove after a few seconds
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 5000);  // Remove notification after 5 seconds
}

// Call the loadRegions function when the page is ready
document.addEventListener('DOMContentLoaded', () => {
    loadRegions(); // Load data initially
    setInterval(loadRegions, 30000);  // Update every 30 seconds (or any time you prefer)
});

// Function to handle search functionality
function searchRegions() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const rows = document.querySelectorAll('#regionTable tbody tr');

    // Loop through all rows, and hide those that don't match the search query
    rows.forEach(row => {
        const regionCell = row.cells[0];
        const plansCell = row.cells[1];
        const regionText = regionCell.textContent.toLowerCase();
        const plansText = plansCell.textContent.toLowerCase();

        // Show row if either the region or plans contains the search term
        if (regionText.includes(filter) || plansText.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Add event listener to the search input for real-time filtering
document.getElementById('searchInput').addEventListener('input', searchRegions);
