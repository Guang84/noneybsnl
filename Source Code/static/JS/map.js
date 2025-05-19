let map, map1; // Two map instances
let markers = [], markers1 = []; // Markers for both maps
let polylines = [], polylines1 = []; // Polylines for both maps
let latLngLines = [], latLngLines1 = []; // Grid lines for both maps

// Initialize the Google Maps
function initMap() {
    const center = { lat: 24.859357, lng: 93.624352 }; // Default center point

    // Initialize the first map
    map = initializeMap("map", center, "db/Json/noneycdata.json", markers, polylines, latLngLines);

    // Initialize the second map
    map1 = initializeMap("map1", center, "db/Json/tamenglongcdata.json", markers1, polylines1, latLngLines1);
}

// Function to initialize a map and load data
function initializeMap(elementId, center, jsonFile, markers, polylines, latLngLines) {
    const mapDiv = document.getElementById(elementId);
    if (!mapDiv) {
        console.error(`Element with ID '${elementId}' not found.`);
        return null;
    }

    const mapInstance = new google.maps.Map(mapDiv, {
        zoom: 14,
        center: center,
        mapTypeId: 'roadmap',
        styles: getMapStyles('normal'),
    });

    // Load saved locations for the map
    loadSavedLocations(mapInstance, markers, polylines, latLngLines, jsonFile);

    // Add grid lines dynamically based on the visible map area
    google.maps.event.addListener(mapInstance, 'bounds_changed', () => {
        updateGridLines(mapInstance, latLngLines);
    });

    // Update map styles dynamically when map type changes
    google.maps.event.addListener(mapInstance, 'maptypeid_changed', () => {
        updateMapStyles(mapInstance);
    });

    return mapInstance;
}

// Dynamically update map styles based on the map type
function updateMapStyles(mapInstance) {
    const mapType = mapInstance.getMapTypeId();
    mapInstance.setOptions({ styles: getMapStyles(mapType) });
}

// Return styles based on the map type
function getMapStyles(type) {
    if (type === 'satellite') {
        return [
            {
                "featureType": "all",
                "elementType": "labels",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#1e90ff" }]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [{ "color": "#2c4a3d" }]
            }
        ];
    }
    return [
        {
            "featureType": "all",
            "elementType": "geometry",
            "stylers": [{ "color": "#f5f5f5" }]
        },
        {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#ffffff" }]
        },
        {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#7a7a7a" }]
        },
        {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{ "color": "#d6f5d6" }]
        },
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#a2daf2" }]
        },
        {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [{ "color": "#e5e5e5" }]
        }
    ];
}

// Update grid lines based on the visible map area
function updateGridLines(mapInstance, latLngLines) {
    latLngLines.forEach(line => line.setMap(null));
    latLngLines.length = 0; // Clear array

    const bounds = mapInstance.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const latStep = 0.01;
    const lngStep = 0.01;

    for (let lat = sw.lat(); lat <= ne.lat(); lat += latStep) {
        const line = createGridLine(mapInstance, { lat, lng: sw.lng() }, { lat, lng: ne.lng() });
        latLngLines.push(line);
    }

    for (let lng = sw.lng(); lng <= ne.lng(); lng += lngStep) {
        const line = createGridLine(mapInstance, { lat: sw.lat(), lng }, { lat: ne.lat(), lng });
        latLngLines.push(line);
    }
}

// Create a grid line
function createGridLine(mapInstance, start, end) {
    const line = new google.maps.Polyline({
        path: [start, end],
        geodesic: true,
        strokeColor: "#cccccc",
        strokeOpacity: 0.5,
        strokeWeight: 1,
    });
    line.setMap(mapInstance);
    return line;
}

// Load saved locations from a JSON file and display them on the map
async function loadSavedLocations(mapInstance, markers, polylines, latLngLines, jsonFile) {
    try {
        const response = await fetch(jsonFile);
        if (!response.ok) throw new Error(`Failed to fetch locations. HTTP Status: ${response.status}`);

        const data = await response.json();
        if (!data || data.length === 0) throw new Error("No locations found in the JSON file.");

        const centerLocation = data[0];
        const centerLatLng = new google.maps.LatLng(centerLocation.latitude, centerLocation.longitude);
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(centerLatLng);

        addMarker(mapInstance, markers, centerLocation, centerLatLng, true);

        data.forEach((location, index) => {
            if (index === 0 || !location.latitude || !location.longitude || !location.name) return;

            const latLng = new google.maps.LatLng(location.latitude, location.longitude);
            bounds.extend(latLng);

            addMarker(mapInstance, markers, location, latLng, false);
            drawLine(mapInstance, polylines, centerLatLng, latLng);
        });

        mapInstance.fitBounds(bounds);
    } catch (error) {
        console.error(`Error loading locations for ${jsonFile}:`, error);
    }
}

// Add a marker to the map
function addMarker(mapInstance, markers, location, latLng, isCenter) {
    const markerColor = getMarkerColor(location.paymentStatus, location.activeStatus);

    const marker = new google.maps.Marker({
        position: latLng,
        map: mapInstance,
        title: location.name, // Tooltip shows the name
        label: {
            text: location.landline || "N/A", // Use landline number as the label
            color: "#000000", // Black color for better visibility
            fontSize: "12px",
            fontWeight: "bold",
            className: "marker-label" // Add a class for custom styling (optional)
        },
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: isCenter ? "#FF5733" : markerColor,
            fillOpacity: 1,
            strokeColor: "#ffffff", // White border for contrast
            strokeWeight: 2,
            scale: isCenter ? 8 : 6
        }
    });

    markers.push(marker);
}

// Get marker color based on payment and active status
function getMarkerColor(paymentStatus, activeStatus) {
    if (paymentStatus === "paid" && activeStatus === "Active") return "#4CAF50"; // Green
    if (paymentStatus === "unpaid" && activeStatus === "Active") return "#FFC107"; // Yellow
    if (activeStatus === "Inactive") return "#F44336"; // Red
    return "#33A1FF"; // Default blue
}

// Draw a connecting line between the center and another location
function drawLine(mapInstance, polylines, centerLatLng, latLng) {
    const line = new google.maps.Polyline({
        path: [centerLatLng, latLng],
        geodesic: true,
        strokeColor: "#33A1FF",
        strokeOpacity: 0.7,
        strokeWeight: 3,
    });
    line.setMap(mapInstance);
    polylines.push(line);
}

// Initialize the maps when the page loads
google.maps.event.addDomListener(window, 'load', initMap);