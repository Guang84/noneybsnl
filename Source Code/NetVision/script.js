let map;
let markers = [];
let polylines = []; // To hold all lines drawn
let pinnedMarkers = []; // To hold pinned markers

function initMap() {
    const center = { lat: 24.858776, lng: 93.6247 }; // Centered on OLT location

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: center,
        mapTypeId: 'roadmap',
        styles: [
            {
                "featureType": "all",
                "elementType": "geometry",
                "stylers": [{ "color": "#f3f4f4" }]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{ "color": "#d6d6d6" }]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [{ "color": "#b9e5a2" }]
            }
        ]
    });

    // Add event listeners for buttons
    document.getElementById("load-button").addEventListener("click", loadSavedLocations);
    document.getElementById("clear-button").addEventListener("click", clearMarkersAndPolylines);

    // Add click event listener to the map for pinning locations
    map.addListener("click", (event) => {
        pinLocation(event.latLng);
    });
}

async function loadSavedLocations() {
    clearMarkersAndPolylines(); // Clear existing markers and polylines

    const loadInfoContainer = document.getElementById("load-info");
    loadInfoContainer.innerHTML = ""; // Clear any previous entries

    try {
        const response = await fetch('network_data.json'); // JSON file path
        if (!response.ok) {
            throw new Error(`Failed to fetch locations. HTTP Status: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.dcOffice || !data.joints || !data.olt || !data.splitters) {
            throw new Error("Invalid JSON data format.");
        }

        const bounds = new google.maps.LatLngBounds();

        // Add DC Office marker
        const dcOfficeLatLng = new google.maps.LatLng(data.dcOffice.latitude, data.dcOffice.longitude);
        bounds.extend(dcOfficeLatLng);

        const dcOfficeMarker = new google.maps.Marker({
            position: dcOfficeLatLng,
            map: map,
            title: data.dcOffice.name,
            label: {
                text: data.dcOffice.name,
                color: "#333",
                fontSize: "12px",
                fontWeight: "bold"
            },
            icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' // Red dot for DC Office
        });
        markers.push(dcOfficeMarker);

        // Add Joints markers and lines
        let previousLatLng = dcOfficeLatLng;
        data.joints.forEach(joint => {
            const jointLatLng = new google.maps.LatLng(joint.latitude, joint.longitude);
            bounds.extend(jointLatLng);

            // Add a marker for the joint
            const jointMarker = new google.maps.Marker({
                position: jointLatLng,
                map: map,
                title: joint.name,
                label: {
                    text: joint.name,
                    color: "#333",
                    fontSize: "12px",
                    fontWeight: "bold"
                },
                icon: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png' // Orange dot for joints
            });
            markers.push(jointMarker);

            // Draw a line from the previous point to the joint
            drawLine(previousLatLng, jointLatLng, "#000000"); // Black line for fiber connections
            previousLatLng = jointLatLng;
        });

        // Add OLT marker
        const oltLatLng = new google.maps.LatLng(data.olt.latitude, data.olt.longitude);
        bounds.extend(oltLatLng);

        const oltMarker = new google.maps.Marker({
            position: oltLatLng,
            map: map,
            title: data.olt.name,
            label: {
                text: data.olt.name,
                color: "#333",
                fontSize: "12px",
                fontWeight: "bold"
            },
            icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' // Blue dot for OLT
        });
        markers.push(oltMarker);

        // Draw a line from the last joint to the OLT
        drawLine(previousLatLng, oltLatLng, "#000000"); // Black line for fiber connections

        // Create a map of splitters for quick lookup
        const splitterMap = new Map();
        data.splitters.forEach(splitter => {
            splitterMap.set(splitter.splitter, splitter);
        });

        // Add markers and lines for each splitter and its customers
        data.splitters.forEach(splitter => {
            const splitterLatLng = new google.maps.LatLng(splitter.latitude, splitter.longitude);
            bounds.extend(splitterLatLng);

            // Add a marker for the splitter
            const splitterMarker = new google.maps.Marker({
                position: splitterLatLng,
                map: map,
                title: splitter.splitter,
                label: {
                    text: splitter.splitter,
                    color: "#333",
                    fontSize: "12px",
                    fontWeight: "bold"
                },
                icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' // Green dot for splitters
            });
            markers.push(splitterMarker);

            // Draw a line from the OLT to the splitter ONLY if it's not connected to another splitter
            if (!splitter.connectedTo) {
                drawLine(oltLatLng, splitterLatLng, "#FF0000"); // Red line for OLT to splitter
            }

            // Draw a line from this splitter to another splitter (if connected)
            if (splitter.connectedTo) {
                const connectedSplitter = splitterMap.get(splitter.connectedTo);
                if (connectedSplitter) {
                    const connectedSplitterLatLng = new google.maps.LatLng(connectedSplitter.latitude, connectedSplitter.longitude);
                    drawLine(splitterLatLng, connectedSplitterLatLng, "#FFA500"); // Orange line for splitter to splitter
                }
            }

            // Add markers and lines for each customer connected to this splitter (if any)
            if (splitter.customers) {
                splitter.customers.forEach((customer, index) => {
                    const customerLatLng = new google.maps.LatLng(customer.latitude, customer.longitude);
                    bounds.extend(customerLatLng);

                    // Add a marker for the customer
                    const customerMarker = new google.maps.Marker({
                        position: customerLatLng,
                        map: map,
                        title: customer.landline,
                        label: {
                            text: customer.landline,
                            color: "#333",
                            fontSize: "12px",
                            fontWeight: "bold"
                        },
                        icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' // Yellow dot for customers
                    });
                    markers.push(customerMarker);

                    // Assign different colors for lines from splitter to customers
                    const lineColors = ["#0000FF", "#00FF00", "#FF00FF", "#00FFFF", "#FF007F"]; // Different colors for lines
                    const lineColor = lineColors[index % lineColors.length]; // Cycle through colors

                    // Draw a line from the splitter to the customer
                    drawLine(splitterLatLng, customerLatLng, lineColor);

                    // Display customer details in the sidebar
                    const infoContent = document.createElement("div");
                    infoContent.className = "info-content";
                    infoContent.innerHTML = `
                        <strong>Landline:</strong> ${customer.landline}<br>
                        <b>Splitter:</b> ${splitter.splitter}<br>
                        <b>Location:</b> ${customer.latitude.toFixed(6)}, ${customer.longitude.toFixed(6)}<br>
                        <button onclick="centerMap(${customer.latitude}, ${customer.longitude})" class="center-btn">Center</button>
                    `;
                    loadInfoContainer.appendChild(infoContent);
                });
            }
        });

        // Adjust map bounds to include all markers and lines
        map.fitBounds(bounds);
    } catch (error) {
        console.error("Error loading locations:", error);

        const errorMessage = document.createElement("div");
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.style.color = "red";
        loadInfoContainer.appendChild(errorMessage);
    }
}

function drawLine(startLatLng, endLatLng, color) {
    const line = new google.maps.Polyline({
        path: [startLatLng, endLatLng],
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 2,
    });
    line.setMap(map);
    polylines.push(line);
}

function centerMap(lat, lng) {
    map.setCenter({ lat, lng });
    map.setZoom(16);
}

function clearMarkersAndPolylines() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    polylines.forEach(line => line.setMap(null));
    polylines = [];

    // Clear pinned markers
    pinnedMarkers.forEach(marker => marker.setMap(null));
    pinnedMarkers = [];

    const pinInfoContainer = document.getElementById("pin-info");
    pinInfoContainer.innerHTML = "<h3>Pinned Locations</h3><p>No pinned locations yet</p>"; // Clear pin info section

    const loadInfoContainer = document.getElementById("load-info");
    loadInfoContainer.innerHTML = "<h3>Loaded Locations</h3>"; // Clear loaded locations section
}

function pinLocation(latLng) {
    const pinInfoContainer = document.getElementById("pin-info");

    // Add a marker for the pinned location
    const pinnedMarker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: "Pinned Location",
        label: {
            text: "Pinned",
            color: "#333",
            fontSize: "12px",
            fontWeight: "bold"
        },
        icon: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png' // Purple dot for pinned locations
    });
    pinnedMarkers.push(pinnedMarker);

    // Display pinned location details in the sidebar
    const infoContent = document.createElement("div");
    infoContent.className = "info-content";
    infoContent.innerHTML = `
        <strong>Pinned Location:</strong><br>
        <b>Latitude:</b> ${latLng.lat().toFixed(6)}<br>
        <b>Longitude:</b> ${latLng.lng().toFixed(6)}<br>
        <button onclick="centerMap(${latLng.lat()}, ${latLng.lng()})" class="center-btn">Center</button>
    `;
    pinInfoContainer.appendChild(infoContent);
}

// Initialize the map after loading the page
google.maps.event.addDomListener(window, 'load', initMap);