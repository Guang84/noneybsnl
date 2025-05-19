document.addEventListener('DOMContentLoaded', function () {
    let validCodes = [];

    // Fetch security codes from the JSON file
    async function loadSecurityCodes() {
        try {
            const response = await fetch('db/Json/securitycode.json');
            const data = await response.json();
            validCodes = data.codes;
        } catch (error) {
            console.error('Error loading security codes:', error);
            alert('Error loading security codes. Please try again later.');
            document.body.innerHTML = "<h1>Access Denied</h1>";
            return false;
        }
        return true;
    }

    // Function to fetch and load OLT status data
    async function loadOLTStatus() {
        const BASE_URL = 'db/Json/olt_data.json';
        const oltStatusContainer = document.getElementById("olt-status-container");

        async function fetchData(url) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error(error);
                return null; // Return null in case of an error
            }
        }

        const status = await fetchData(BASE_URL);
        if (status && status.servers) {
            oltStatusContainer.innerHTML = ''; // Clear existing content
            const table = document.createElement("table");
            table.classList.add("olt-table");
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Server Name</th>
                        <th>Status</th>
                        <th>Last Updated</th>
                        <th>Location</th>
                        <th>Temperature</th>
                        <th>System Time</th>
                        <th>Running Time</th>
                        <th>CPU Usage</th>
                        <th>Memory Usage</th>
                        <th>URL</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;
            const tbody = table.querySelector("tbody");

            status.servers.forEach(server => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${server.name}</td>
                    <td class="${server.status === 'active' ? 'status-active' : 'status-inactive'}">${server.status}</td>
                    <td>${server.lastUpdated}</td>
                    <td>${server.location}</td>
                    <td>${server.temperature}</td>
                    <td>${server.systemTime}</td>
                    <td>${server.runningTime}</td>
                    <td>${server.cpuUsage}</td>
                    <td>${server.memoryUsage}</td>
                    <td><a href="${server.url}" target="_blank" class="olt-link">${server.url ? 'Open' : 'Not Available'}</a></td>
                `;
                tbody.appendChild(row);
            });
            oltStatusContainer.appendChild(table);
            oltStatusContainer.style.display = 'block';
        } else {
            oltStatusContainer.innerHTML = '<p class="error-message">Error loading OLT status. Please try again later.</p>';
        }
    }

    // Function to handle security code submission
    async function handleSecurityCodeSubmission() {
        const userCode = document.getElementById('security-code-input').value;

        if (validCodes.includes(userCode)) {
            alert("Access granted!");
            document.getElementById('security-code-container').style.display = 'none';
            document.querySelector('.main-content').style.display = 'block';
            loadOLTStatus();
        } else {
            alert("Access denied! Incorrect security code.");
        }
    }

    // Load security codes and set up the submit button
    loadSecurityCodes().then(() => {
        document.getElementById('submit-code').addEventListener('click', handleSecurityCodeSubmission);
    });
});