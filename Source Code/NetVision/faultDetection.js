let networkData;
let faultMarkers = [];
let faultPolylines = [];
let faultLabels = [];
let map;
let pins = [];
const customerColors = {}; // Store colors for each customer

// Color Scheme
const colors = {
    dcOffice: '#2E86C1', // Blue
    olt: '#2E86C1', // Blue
    joint: '#F39C12', // Orange
    splitter: '#E74C3C', // Red
    customer: '#8E44AD', // Purple
    fault: '#E74C3C', // Red
    line: '#2E86C1', // Blue
    faultLine: '#E74C3C', // Red
    splitterToCustomer: '#27AE60', // Green for splitter-to-customer lines
};

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 24.826529, lng: 93.636694 }, // Center on DC Office
        zoom: 14,
    });

    // Add click event to pin locations
    map.addListener("click", (event) => {
        addPin(event.latLng);
    });

    // Load network data after map initialization
    loadNetworkData();
}

// Load network data
async function loadNetworkData() {
    try {
        console.log("Loading network data...");
        const response = await fetch('network_data.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch network data. HTTP Status: ${response.status}`);
        }
        networkData = await response.json();
        console.log("Network data loaded successfully:", networkData);
        populateLandlineDropdown();
        loadNetworkOnMap(); // Load network data on the map
        updateDashboardMetrics(); // Update dashboard metrics
        setMapToOLT(); // Set the map view to the OLT location after loading data
    } catch (error) {
        console.error("Error loading network data:", error);
        alert("Failed to load network data. Please check the console for details.");
    }
}

// Set the map view to the OLT location
function setMapToOLT() {
    if (networkData && networkData.olt) {
        const oltLocation = { lat: networkData.olt.latitude, lng: networkData.olt.longitude };
        map.setCenter(oltLocation);
        map.setZoom(16); // Adjust the zoom level as needed
    } else {
        alert("OLT location data is not available.");
    }
}

// Update dashboard metrics
function updateDashboardMetrics() {
    const totalCustomers = networkData.splitters.reduce((acc, splitter) => acc + (splitter.customers ? splitter.customers.length : 0), 0);
    document.getElementById("total-customers").textContent = totalCustomers;

    const activeConnections = networkData.splitters.reduce((acc, splitter) => acc + (splitter.connectedTo ? 1 : 0), 0);
    document.getElementById("active-connections").textContent = activeConnections;

    const faultsDetected = faultMarkers.length; // Placeholder for actual fault detection logic
    document.getElementById("faults-detected").textContent = faultsDetected;
}

// Populate landline dropdown
function populateLandlineDropdown() {
    const landlineDropdown = document.getElementById("landline-dropdown");
    landlineDropdown.innerHTML = "<option value=''>Select Landlines</option>";

    if (networkData && networkData.splitters) {
        networkData.splitters.forEach(splitter => {
            if (splitter.customers) {
                splitter.customers.forEach(customer => {
                    const option = document.createElement("option");
                    option.value = customer.landline;
                    option.textContent = customer.landline;
                    landlineDropdown.appendChild(option);
                });
            }
        });
    } else {
        console.error("No splitters or customers found in network data.");
    }
}

// Load network data on the map
function loadNetworkOnMap() {
    if (!networkData) return;

    // Clear previous markers and lines
    clearFaultVisualization();

    // Add DC Office marker
    const dcOfficeLocation = { lat: networkData.dcOffice.latitude, lng: networkData.dcOffice.longitude };
    addFaultMarker(dcOfficeLocation, `DC Office: ${networkData.dcOffice.name}`, colors.dcOffice, 'DC Office');

    // Add OLT marker
    const oltLocation = { lat: networkData.olt.latitude, lng: networkData.olt.longitude };
    addFaultMarker(oltLocation, `OLT: ${networkData.olt.name}`, colors.olt, 'OLT');

    // Draw line from DC Office to OLT
    drawFaultLine(dcOfficeLocation, oltLocation, colors.line, 'DC Office → OLT');

    // Add joints
    if (networkData.joints) {
        networkData.joints.forEach(joint => {
            addFaultMarker(
                { lat: joint.latitude, lng: joint.longitude },
                `Joint: ${joint.name}`,
                colors.joint,
                'Joint'
            );
        });
    }

    // Add splitters and customers
    if (networkData.splitters) {
        networkData.splitters.forEach(splitter => {
            const splitterLocation = { lat: splitter.latitude, lng: splitter.longitude };

            // Add splitter marker with splitter name as label
            addFaultMarker(
                splitterLocation,
                `Splitter: ${splitter.splitter}`,
                colors.splitter,
                `S: ${splitter.splitter}` // Display splitter name as label
            );

            // Draw line from OLT to splitter (if connected)
            if (!splitter.connectedTo) {
                drawFaultLine(oltLocation, splitterLocation, colors.line, 'OLT → Splitter');
            }

            // Draw line from connected splitter to this splitter (without label)
            if (splitter.connectedTo) {
                const connectedSplitter = networkData.splitters.find(s => s.splitter === splitter.connectedTo);
                if (connectedSplitter) {
                    const connectedSplitterLocation = { lat: connectedSplitter.latitude, lng: connectedSplitter.longitude };
                    drawFaultLine(connectedSplitterLocation, splitterLocation, colors.line, '');
                }
            }

            // Add customers and draw lines from splitter to customers
            if (splitter.customers) {
                splitter.customers.forEach(customer => {
                    const customerLocation = { lat: customer.latitude, lng: customer.longitude };

                    // Get the unique color for this customer
                    const customerColor = getCustomerColor(customer.landline);

                    // Add customer marker with landline number as label
                    addFaultMarker(
                        customerLocation,
                        `Customer: ${customer.landline}`,
                        customerColor, // Use the unique customer color
                        `C: ${customer.landline}` // Display landline number as label
                    );

                    // Draw line from splitter to customer with the unique color
                    drawFaultLine(
                        splitterLocation,
                        customerLocation,
                        customerColor, // Use the unique customer color
                        'S → C'
                    );
                });
            }
        });
    }
}

// Get a unique color for each customer
function getCustomerColor(landline) {
    if (!customerColors[landline]) {
        // Generate a unique color using a hash of the landline number
        const hash = landline.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = hash % 360; // Ensure the hue is within the valid range (0-359)
        customerColors[landline] = `hsl(${hue}, 70%, 50%)`; // Use HSL for vibrant colors
    }
    return customerColors[landline];
}

// Add a pin to the map
function addPin(position) {
    const pin = new google.maps.Marker({
        position,
        map,
        title: "Pinned Location",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#FFFF00',
            fillOpacity: 0.8,
            strokeWeight: 0,
            scale: 10
        },
        zIndex: 999
    });
    pins.push(pin);

    // Update pinned locations sidebar
    updatePinInfo(position);
}

// Update pinned locations sidebar
function updatePinInfo(position) {
    const pinInfo = document.getElementById("pin-info");
    pinInfo.innerHTML = `
        <h3>Pinned Locations</h3>
        <p>Latitude: ${position.lat().toFixed(6)}, Longitude: ${position.lng().toFixed(6)}</p>
    `;
}

// Clear previous fault visualization
function clearFaultVisualization() {
    faultMarkers.forEach(marker => marker.setMap(null));
    faultPolylines.forEach(line => line.setMap(null));
    faultLabels.forEach(label => label.setMap(null));
    faultMarkers = [];
    faultPolylines = [];
    faultLabels = [];
}

// Add fault marker with custom icon and label
function addFaultMarker(position, title, color = colors.fault, labelText = '') {
    const marker = new google.maps.Marker({
        position,
        map,
        title,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 0.8,
            strokeWeight: 0,
            scale: 10
        },
        zIndex: 999
    });
    faultMarkers.push(marker);

    // Add label if provided
    if (labelText) {
        const label = new google.maps.Marker({
            position,
            map,
            label: {
                text: labelText,
                color: '#FFFFFF', // White text for better contrast
                fontSize: '12px',
                fontWeight: 'bold',
                className: 'fault-label'
            },
            icon: {
                url: 'https://maps.google.com/mapfiles/transparent.png',
                size: new google.maps.Size(0, 0),
                anchor: new google.maps.Point(0, 0)
            },
            zIndex: 1000
        });
        faultLabels.push(label);
    }

    return marker;
}

// Draw fault line with custom color and label
function drawFaultLine(start, end, color = colors.faultLine, labelText = '') {
    const line = new google.maps.Polyline({
        path: [start, end],
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 3,
        zIndex: 999
    });
    line.setMap(map);
    faultPolylines.push(line);

    // Add label at midpoint if labelText is provided
    if (labelText) {
        const midpoint = {
            lat: (start.lat + end.lat) / 2,
            lng: (start.lng + end.lng) / 2
        };
        const label = new google.maps.Marker({
            position: midpoint,
            map,
            label: {
                text: labelText,
                color: '#FFFFFF', // White text for better contrast
                fontSize: '12px',
                fontWeight: 'bold',
                className: 'fault-label'
            },
            icon: {
                url: 'https://maps.google.com/mapfiles/transparent.png',
                size: new google.maps.Size(0, 0),
                anchor: new google.maps.Point(0, 0)
            },
            zIndex: 1000
        });
        faultLabels.push(label);
    }

    return line;
}

// Handle fault detection form submission
document.getElementById("fault-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const landlines = Array.from(document.getElementById("landline-dropdown").selectedOptions)
        .map(option => option.value.trim())
        .filter(value => value);
    if (landlines.length > 0) {
        detectFault(landlines);
    } else {
        alert("Please select at least one valid landline number.");
    }
});

// Detect fault for selected landlines
function detectFault(landlines) {
    // Clear previous fault visualization
    clearFaultVisualization();

    // Highlight the selected landlines
    landlines.forEach(landline => {
        const customer = findCustomerByLandline(landline);
        if (customer) {
            const customerLocation = { lat: customer.latitude, lng: customer.longitude };

            // Add customer marker with landline number as label
            addFaultMarker(customerLocation, `Customer: ${customer.landline}`, colors.fault, `C: ${customer.landline}`);

            // Find the connected splitter
            const splitter = networkData.splitters.find(s => s.customers && s.customers.some(c => c.landline === landline));
            if (splitter) {
                const splitterLocation = { lat: splitter.latitude, lng: splitter.longitude };

                // Add splitter marker with splitter name as label
                addFaultMarker(
                    splitterLocation,
                    `Splitter: ${splitter.splitter}`,
                    colors.fault,
                    `S: ${splitter.splitter}` // Display splitter name as label
                );

                // Draw line from splitter to customer (faulty connection)
                drawFaultLine(splitterLocation, customerLocation, colors.faultLine, 'Faulty Connection');
            }
        }
    });
}

// Find customer by landline number
function findCustomerByLandline(landline) {
    if (networkData && networkData.splitters) {
        for (const splitter of networkData.splitters) {
            if (splitter.customers) {
                const customer = splitter.customers.find(c => c.landline === landline);
                if (customer) return customer;
            }
        }
    }
    return null;
}

// Generate report
document.getElementById("generate-report-btn").addEventListener("click", function () {
    const reportResults = document.getElementById("report-results");
    reportResults.innerHTML = `
        <h3>Generated Report</h3>
        <p>Total Customers: ${document.getElementById("total-customers").textContent}</p>
        <p>Active Connections: ${document.getElementById("active-connections").textContent}</p>
        <p>Faults Detected: ${document.getElementById("faults-detected").textContent}</p>
    `;
});

// Load network data when the page loads
window.addEventListener("load", () => {
    initMap();
});

// Add event listener for the "Load Location" button
document.getElementById("load-location-btn").addEventListener("click", function () {
    if (networkData) {
        setMapToOLT();
    } else {
        alert("Network data is not loaded yet. Please load the network data first.");
    }
});