let map;
let drawingManager;
let markers = [];
let polylines = []; // To hold all lines drawn from the center point

function initMap() {
    const center = { lat: 24.859357, lng: 93.624352 }; // Default center point

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

    drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.MARKER,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['marker']
        },
        markerOptions: {
            draggable: true,
            animation: google.maps.Animation.DROP
        }
    });
    drawingManager.setMap(map);

    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
        if (event.type === 'marker') {
            const marker = event.overlay;
            markers.push(marker);
            displayPinInfo(marker.getPosition());
        }
    });

    // Add event listeners for buttons
    document.getElementById("load-button").addEventListener("click", loadSavedLocations);
    document.getElementById("clear-button").addEventListener("click", clearMarkersAndPolylines);

    // Initialize search box
    initializeSearchBox();
}

function initializeSearchBox() {
    const searchInput = document.getElementById("search-input");
    const searchBox = new google.maps.places.SearchBox(searchInput);

    map.addListener("bounds_changed", () => {
        searchBox.setBounds(map.getBounds());
    });

    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places || places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        // Clear existing markers
        clearMarkersAndPolylines();

        // Add a marker for the searched location
        const marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location,
            title: place.name,
            label: {
                text: place.name, // Default label for searched locations
                color: "#333",
                fontSize: "12px",
                fontWeight: "bold"
            }
        });
        markers.push(marker);

        // Center the map on the searched location
        map.setCenter(place.geometry.location);
        map.setZoom(16);

        // Display the searched location in the sidebar
        const pinInfoContainer = document.getElementById("pin-info");
        pinInfoContainer.innerHTML = `<h3>Pinned Locations</h3>`;
        displayPinInfo(place.geometry.location);
    });
}

function displayPinInfo(location) {
    const pinInfoContainer = document.getElementById("pin-info");
    const infoContent = document.createElement("div");
    infoContent.className = "info-content";
    infoContent.textContent = `Pin at Latitude: ${location.lat().toFixed(6)}, Longitude: ${location.lng().toFixed(6)}`;
    pinInfoContainer.appendChild(infoContent);
}

async function loadSavedLocations() {
    clearMarkersAndPolylines(); // Clear existing markers and polylines

    const loadInfoContainer = document.getElementById("load-info");
    loadInfoContainer.innerHTML = ""; // Clear any previous entries

    try {
        const response = await fetch('db/locations.json'); // JSON file path
        if (!response.ok) {
            throw new Error(`Failed to fetch locations. HTTP Status: ${response.status}`);
        }

        const data = await response.json();
        if (!data || data.length === 0) {
            throw new Error("No locations found in the JSON file.");
        }

        const centerLocation = data[0]; // Assume the first location as the center
        const centerLatLng = new google.maps.LatLng(centerLocation.latitude, centerLocation.longitude);

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(centerLatLng);

        addMarkerWithInfo(centerLocation, centerLatLng); // Add the central location marker

        data.forEach((location, index) => {
            if (index === 0) return; // Skip the central location
            if (!location.latitude || !location.longitude || !location.name) {
                console.warn("Skipping invalid location:", location);
                return;
            }

            const latLng = new google.maps.LatLng(location.latitude, location.longitude);
            bounds.extend(latLng);

            // Add marker and draw a line from the center to this location
            addMarkerWithInfo(location, latLng);
            drawLineFromCenter(centerLatLng, latLng);

            // Calculate distance and display it
            const distance = calculateDistance(centerLatLng, latLng);

            // Display location name, address, and distance in the sidebar
            const infoContent = document.createElement("div");
            infoContent.className = "info-content";
            infoContent.innerHTML = `
                <strong>${location.name}</strong><br>
                <small>${location.address || "Address not available"}</small><br>
                <b>Distance:</b> ${distance}<br>
                <button onclick="centerMap(${location.latitude}, ${location.longitude})" class="center-btn">Center</button>
            `;
            loadInfoContainer.appendChild(infoContent);
        });

        map.fitBounds(bounds); // Adjust map bounds to include all markers and lines
    } catch (error) {
        console.error("Error loading locations:", error);

        const errorMessage = document.createElement("div");
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.style.color = "red";
        loadInfoContainer.appendChild(errorMessage);
    }
}

function addMarkerWithInfo(location, latLng) {
    const marker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: location.name,
        label: {
            text: `${location.name} (${location.landline || "N/A"})`, // Include both name and landline in the label
            color: "#333", // Text color for the label
            fontSize: "12px",
            fontWeight: "bold"
        }
    });

    const infoWindowContent = `
        <div style="font-size: 14px; line-height: 1.6;">
            <strong>${location.name}</strong><br>
            <b>Address:</b> ${location.address || "Address not available"}<br>
            <b>Landline:</b> ${location.landline || "N/A"}
        </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent
    });

    marker.addListener("click", () => {
        infoWindow.open(map, marker);
    });

    markers.push(marker);
}

function drawLineFromCenter(centerLatLng, latLng) {
    const line = new google.maps.Polyline({
        path: [centerLatLng, latLng],
        geodesic: true,
        strokeColor: "#FF5733", // A vibrant orange for contrast
        strokeOpacity: 1.0,
        strokeWeight: 2,
    });
    line.setMap(map);
    polylines.push(line);
}

function calculateDistance(centerLatLng, latLng) {
    const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(centerLatLng, latLng);

    // Convert distance to kilometers if > 1000 meters, else keep it in meters
    if (distanceInMeters > 1000) {
        return `${(distanceInMeters / 1000).toFixed(2)} km`;
    } else {
        return `${distanceInMeters.toFixed(2)} meters`;
    }
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

    const pinInfoContainer = document.getElementById("pin-info");
    pinInfoContainer.innerHTML = "<h3>Pinned Locations</h3><p>No pinned locations yet</p>"; // Clear pin info section

    const loadInfoContainer = document.getElementById("load-info");
    loadInfoContainer.innerHTML = "<h3>Loaded Locations</h3>"; // Clear loaded locations section
}

// Initialize the map after loading the page
google.maps.event.addDomListener(window, 'load', initMap);