// Function to load regions from the JSON file and populate the table
function loadRegions() {
    const tdata = document.getElementById('tdata');
    const errmessg = "Failed to Fetch Data";
    // Fetch the JSON file from the /db/region.json path
    fetch('/db/Json/regions.json')  // Path to the regions JSON file
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

                const statusCell = document.createElement('td'); 
                statusCell.textContent = region.status; // Conditional status
                row.appendChild(statusCell); // Append the status cell to the row

                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            tdata.innerHTML =`<p>Error loading region's. ${errmessg}</p>`;
            // Optional: Display a simple error message in the console or UI
        });
}

// Function to handle search functionality
function searchRegions() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const rows = document.querySelectorAll('#regionTable tbody tr');

    // Loop through all rows, and hide those that don't match the search query
    rows.forEach(row => {
        const regionCell = row.cells[0];
        const plansCell = row.cells[1];
        const statusCell = row.cells[2]; 

        const regionText = regionCell.textContent.toLowerCase();
        const plansText = plansCell.textContent.toLowerCase();
        const statusText = statusCell.textContent.toLowerCase(); 

        // Show row if any column contains the search term
        if (regionText.includes(filter) || plansText.includes(filter) || statusText.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Call the loadRegions function when the page is ready
document.addEventListener('DOMContentLoaded', () => {
    loadRegions(); // Load data initially
    setInterval(loadRegions, 30000);  // Update every 30 seconds (or any time you prefer)
});

// Add event listener to the search input for real-time filtering
document.getElementById('searchInput').addEventListener('input', searchRegions);
