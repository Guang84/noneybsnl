const networkData = {
  networks: {
    network_1: {
      mapId: "network_1",
      mapName: "Main Fiber Network",
      dcOffice: {
        description: "DC1",
        latitude: 24.826529,
        longitude: 93.636694,
      },
      joints: [
        {
          description: "Joint01",
          latitude: 24.827523096398906,
          longitude: 93.63739779973973,
          connectedTo: "DC1",
          segmentDistance: 0.131,
          totalDistance: 0.131,
        },
        {
          description: "Joint1",
          latitude: 24.83106826145865,
          longitude: 93.63327453881264,
          connectedTo: "Joint01",
          segmentDistance: 0.573,
          totalDistance: 0.705,
        },
        {
          description: "Joint2",
          latitude: 24.834037076810997,
          longitude: 93.63383716698242,
          connectedTo: "Joint1",
          segmentDistance: 0.335,
          totalDistance: 1.04,
        },
        {
          description: "Joint3",
          latitude: 24.835999227722336,
          longitude: 93.63369249109859,
          connectedTo: "Joint2",
          segmentDistance: 0.219,
          totalDistance: 1.258,
        },
        {
          description: "Joint4",
          latitude: 24.840375660403108,
          longitude: 93.62923165323902,
          connectedTo: "Joint3",
          segmentDistance: 0.663,
          totalDistance: 1.921,
        },
      ],
      olt: {
        name: "BSNL Tower",
        latitude: 24.85012648711566,
        longitude: 93.61697354089821,
        connectedTo: "Joint4",
        segmentDistance: 1.645,
        totalDistance: 3.566,
      },
      summary: {
        totalCableLength: 3.566,
        maxCoverage: 3.566,
        totalPoints: 6,
      },
    },
    network_2: {
      mapId: "network_2",
      mapName: "Secondary Distribution Network",
      dcOffice: {
        description: "Splitter point",
        latitude: 24.855395932928534,
        longitude: 93.62494377777747,
      },
      joints: [
        {
          description: "Joint2A",
          latitude: 24.855215439250294,
          longitude: 93.62513133008909,
          connectedTo: "DC2",
          segmentDistance: 0.026,
          totalDistance: 0.026,
        },
        {
          description: "Joint2C",
          latitude: 24.855100696703627,
          longitude: 93.62554195598346,
          connectedTo: "Joint2A",
          segmentDistance: 0.017,
          totalDistance: 0.066,
        },
        {
          description: "Joint2E",
          latitude: 24.85500013573249,
          longitude: 93.62598384059646,
          connectedTo: "Joint2C",
          segmentDistance: 0.027,
          totalDistance: 0.114,
        },
        {
          description: "Joint2F",
          latitude: 24.85502076363068,
          longitude: 93.62607761675228,
          connectedTo: "Joint2E",
          segmentDistance: 0.011,
          totalDistance: 0.125,
        },
        {
          description: "Joint2G",
          latitude: 24.85503881303876,
          longitude: 93.6261472384437,
          connectedTo: "Joint2F",
          segmentDistance: 0.009,
          totalDistance: 0.134,
        },
        {
          description: "Joint2H",
          latitude: 24.854955012193237,
          longitude: 93.62642572520944,
          connectedTo: "Joint2G",
          segmentDistance: 0.025,
          totalDistance: 0.159,
        }
      ],
      olt: {
        name: "ASOC Noney",
        latitude: 24.854863475817496,
        longitude: 93.62673547071901,
        connectedTo: "Joint2H",
        segmentDistance: 0.035,
        totalDistance: 0.122, // totalDistance up to Joint2D + segmentDistance to olt
      },
      summary: {
        totalCableLength: 0.212, // Sum of all segments + olt connection
        maxCoverage: 0.212,
        totalPoints: 11,
      },
    },
    network_3: {
      mapId: "network_3",
      mapName: "Enterprise Campus Network",
      dcOffice: {
        description: "Enterprise DC",
        latitude: 24.83,
        longitude: 93.62,
      },
      joints: [
        {
          description: "Building_A_Joint",
          latitude: 24.831,
          longitude: 93.621,
          connectedTo: "Enterprise DC",
          segmentDistance: 0.15,
          totalDistance: 0.15,
        },
        {
          description: "Building_B_Joint",
          latitude: 24.832,
          longitude: 93.622,
          connectedTo: "Building_A_Joint",
          segmentDistance: 0.15,
          totalDistance: 0.3,
        },
        {
          description: "Building_C_Joint",
          latitude: 24.833,
          longitude: 93.623,
          connectedTo: "Building_B_Joint",
          segmentDistance: 0.15,
          totalDistance: 0.45,
        },
      ],
      olt: {
        name: "Campus OLT",
        latitude: 24.834,
        longitude: 93.624,
        connectedTo: "Building_C_Joint",
        segmentDistance: 0.15,
        totalDistance: 0.601,
      },
      summary: {
        totalCableLength: 0.601,
        maxCoverage: 0.601,
        totalPoints: 4,
      },
    },
  },
  globalSummary: {
    totalNetworks: 3,
    combinedCableLength: 4.369, // updated total cable length (3.566 + 0.212 + 0.601)
    totalPoints: 21,
    maxCoverageOverall: 3.566,
  },
};

// Global variables
let map;
let markers = {};
let allMarkers = [];
let connections = [];
let currentNetwork = 'network_1';
let currentUnit = 'km';
let isMetering = false;
let meteringPoints = [];
let meteringLine = null;
let currentHighlight = null;
let streetLayer, satelliteLayer, hybridLayer;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    showLoadingOverlay();
    setTimeout(() => {
        initializeMap();
        loadNetwork(currentNetwork);
        setupEventListeners();
        updateCombinedSummary();
        hideLoadingOverlay();
    }, 1000);
});

function showLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function initializeMap() {
    // Initialize map centered on first network's DC Office
    const firstNetwork = networkData.networks[currentNetwork];
    map = L.map('map').setView([firstNetwork.dcOffice.latitude, firstNetwork.dcOffice.longitude], 14);

    // Add tile layers
    streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });

    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri'
    });

    hybridLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri'
    });

    streetLayer.addTo(map);

    // Add zoom controls, scale, and other controls
    map.addControl(L.control.scale({ position: 'bottomright' }));
}

function loadNetwork(networkId) {
    console.log('Loading network:', networkId);
    
    // Clear existing markers and connections
    clearMap();
    
    const network = networkData.networks[networkId];
    if (!network) {
        console.error('Network not found:', networkId);
        return;
    }

    console.log('Network found:', network.mapName);

    // Update current network reference
    currentNetwork = networkId;
    
    // Update UI to show loading state
    document.getElementById('map').classList.add('network-switching');
    
    setTimeout(() => {
        // Add DC Office marker
        addDCOfficeMarker(network);
        
        // Add joint markers
        addJointMarkers(network);
        
        // Add OLT marker
        addOLTMarker(network);
        
        // Draw connections
        drawConnections(network);
        
        // Update distance table and summaries
        populateDistanceTable(network);
        updateNetworkSummary(network);
        updateHeaderStats();
        
        // Fit map bounds to show all markers
        fitMapBounds();
        
        // Remove loading state
        document.getElementById('map').classList.remove('network-switching');
        
        // Update legend
        updateLegend(network);
        
        console.log('Network loaded successfully:', network.mapName);
        
    }, 300);
}

function clearMap() {
    // Clear highlights first
    clearHighlights();
    
    // Remove all markers
    allMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    // Remove all connections
    connections.forEach(conn => {
        if (conn.line && map.hasLayer(conn.line)) {
            map.removeLayer(conn.line);
        }
        if (conn.label && map.hasLayer(conn.label)) {
            map.removeLayer(conn.label);
        }
    });
    
    // Clear arrays
    markers = {};
    allMarkers = [];
    connections = [];
    currentHighlight = null;
}

function addDCOfficeMarker(network) {
    const dcIcon = L.divIcon({
        className: 'custom-marker dc-marker-icon',
        html: '<div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0,0,0,0.2);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const marker = L.marker([network.dcOffice.latitude, network.dcOffice.longitude], { icon: dcIcon })
        .addTo(map)
        .bindPopup(`
            <h4>${network.dcOffice.description}</h4>
            <p><strong>Type:</strong> DC Office</p>
            <p><strong>Network:</strong> ${network.mapName}</p>
            <p><strong>Coordinates:</strong> ${network.dcOffice.latitude.toFixed(6)}, ${network.dcOffice.longitude.toFixed(6)}</p>
            <p><strong>Network Distance:</strong> ${convertDistance(network.summary.totalCableLength)} ${currentUnit}</p>
        `);

    marker.pointData = {
        name: network.dcOffice.description,
        type: 'DC Office',
        network: network.mapName
    };

    marker.on('click', function(e) {
        clearHighlights();
        this.openPopup();
        highlightPathFromDC(network.dcOffice.description, network);
    });

    markers[network.dcOffice.description] = marker;
    allMarkers.push(marker);
}

function addJointMarkers(network) {
    network.joints.forEach(joint => {
        const jointIcon = L.divIcon({
            className: 'custom-marker joint-marker-icon',
            html: '<div style="background-color: #f97316; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0,0,0,0.2);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker = L.marker([joint.latitude, joint.longitude], { icon: jointIcon })
            .addTo(map)
            .bindPopup(`
                <h4>${joint.description}</h4>
                <p><strong>Type:</strong> Network Joint</p>
                <p><strong>Network:</strong> ${network.mapName}</p>
                <p><strong>Connected to:</strong> ${joint.connectedTo}</p>
                <p><strong>Segment Distance:</strong> ${convertDistance(joint.segmentDistance)} ${currentUnit}</p>
                <p><strong>Total Distance from DC:</strong> ${convertDistance(joint.totalDistance)} ${currentUnit}</p>
                <p><strong>Coordinates:</strong> ${joint.latitude.toFixed(6)}, ${joint.longitude.toFixed(6)}</p>
            `);

        marker.pointData = {
            name: joint.description,
            type: 'Network Joint',
            joint: joint,
            network: network.mapName
        };

        marker.on('click', function(e) {
            clearHighlights();
            this.openPopup();
            highlightPathFromDC(joint.description, network);
        });

        markers[joint.description] = marker;
        allMarkers.push(marker);
    });
}

function addOLTMarker(network) {
    const oltIcon = L.divIcon({
        className: 'custom-marker olt-marker-icon',
        html: '<div style="background-color: #16a34a; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0,0,0,0.2);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const marker = L.marker([network.olt.latitude, network.olt.longitude], { icon: oltIcon })
        .addTo(map)
        .bindPopup(`
            <h4>${network.olt.name}</h4>
            <p><strong>Type:</strong> OLT Terminal</p>
            <p><strong>Network:</strong> ${network.mapName}</p>
            <p><strong>Connected to:</strong> ${network.olt.connectedTo}</p>
            <p><strong>Segment Distance:</strong> ${convertDistance(network.olt.segmentDistance)} ${currentUnit}</p>
            <p><strong>Total Distance from DC:</strong> ${convertDistance(network.olt.totalDistance)} ${currentUnit}</p>
            <p><strong>Coordinates:</strong> ${network.olt.latitude.toFixed(6)}, ${network.olt.longitude.toFixed(6)}</p>
        `);

    marker.pointData = {
        name: network.olt.name,
        type: 'OLT Terminal',
        olt: network.olt,
        network: network.mapName
    };

    marker.on('click', function(e) {
        clearHighlights();
        this.openPopup();
        highlightPathFromDC(network.olt.name, network);
    });

    markers[network.olt.name] = marker;
    allMarkers.push(marker);
}

function drawConnections(network) {
    // Connect DC to first joint
    const firstJoint = network.joints.find(j => j.connectedTo === network.dcOffice.description);
    if (firstJoint) {
        drawConnection(network.dcOffice, firstJoint, firstJoint.segmentDistance);
    }

    // Connect joints to each other
    network.joints.forEach(joint => {
        if (joint.connectedTo !== network.dcOffice.description) {
            const connectedJoint = network.joints.find(j => j.description === joint.connectedTo);
            if (connectedJoint) {
                drawConnection(connectedJoint, joint, joint.segmentDistance);
            }
        }
    });

    // Connect OLT
    const oltConnectedTo = network.joints.find(j => j.description === network.olt.connectedTo);
    if (oltConnectedTo) {
        drawConnection(oltConnectedTo, network.olt, network.olt.segmentDistance);
    }
}

function drawConnection(from, to, distance) {
    const line = L.polyline([
        [from.latitude, from.longitude],
        [to.latitude, to.longitude]
    ], {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7
    }).addTo(map);

    // Add distance label
    const midPoint = [
        (from.latitude + to.latitude) / 2,
        (from.longitude + to.longitude) / 2
    ];

    const label = L.marker(midPoint, {
        icon: L.divIcon({
            className: 'distance-label',
            html: `<div style="background: rgba(59, 130, 246, 0.9); color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500; white-space: nowrap;">${convertDistance(distance)} ${currentUnit}</div>`,
            iconSize: [0, 0]
        })
    }).addTo(map);

    connections.push({
        line: line,
        label: label,
        from: from.description || from.name,
        to: to.description || to.name,
        distance: distance
    });
}

function populateDistanceTable(network) {
    const tbody = document.getElementById('distanceTableBody');
    tbody.innerHTML = '';

    // Add DC Office
    const dcRow = createTableRow(network.dcOffice.description, 'DC Office', 0, 0, network);
    tbody.appendChild(dcRow);

    // Add joints sorted by total distance
    const sortedJoints = [...network.joints].sort((a, b) => a.totalDistance - b.totalDistance);
    
    sortedJoints.forEach(joint => {
        const row = createTableRow(joint.description, 'Network Joint', joint.segmentDistance, joint.totalDistance, network);
        tbody.appendChild(row);
    });

    // Add OLT
    const oltRow = createTableRow(network.olt.name, 'OLT Terminal', network.olt.segmentDistance, network.olt.totalDistance, network);
    tbody.appendChild(oltRow);
}

function createTableRow(description, type, segmentDistance, totalDistance, network) {
    const row = document.createElement('tr');
    row.className = 'clickable';
    row.onclick = () => {
        clearHighlights();
        highlightPathFromDC(description, network);
        // Pan to the marker
        if (markers[description]) {
            map.panTo(markers[description].getLatLng());
            markers[description].openPopup();
        }
    };
    
    row.innerHTML = `
        <td><strong>${description}</strong></td>
        <td><span class="point-type point-type--${type.toLowerCase().includes('dc') ? 'dc' : type.toLowerCase().includes('olt') ? 'olt' : 'joint'}">${type}</span></td>
        <td>${convertDistance(segmentDistance)} ${currentUnit}</td>
        <td>${convertDistance(totalDistance)} ${currentUnit}</td>
    `;
    
    return row;
}

function updateNetworkSummary(network) {
    document.getElementById('currentNetworkTitle').textContent = network.mapName;
    document.getElementById('networkCableLength').textContent = `${convertDistance(network.summary.totalCableLength)} ${currentUnit}`;
    document.getElementById('networkCoverage').textContent = `${convertDistance(network.summary.maxCoverage)} ${currentUnit}`;
    document.getElementById('networkPointCount').textContent = network.summary.totalPoints;
}

function updateCombinedSummary() {
    const global = networkData.globalSummary;
    document.getElementById('totalNetworks').textContent = global.totalNetworks;
    document.getElementById('totalCableLength').textContent = `${convertDistance(global.combinedCableLength)} ${currentUnit}`;
    document.getElementById('totalNetworkPoints').textContent = global.totalPoints;
    document.getElementById('maxCoverageOverall').textContent = `${convertDistance(global.maxCoverageOverall)} ${currentUnit}`;
}

function updateHeaderStats() {
    const network = networkData.networks[currentNetwork];
    const global = networkData.globalSummary;
    
    document.getElementById('activePoints').textContent = network.summary.totalPoints;
    document.getElementById('activeDistance').textContent = `${convertDistance(network.summary.totalCableLength)} ${currentUnit}`;
    document.getElementById('combinedTotal').textContent = `${convertDistance(global.combinedCableLength)} ${currentUnit}`;
}

function updateLegend(network) {
    document.getElementById('legendNetworkName').textContent = network.mapName;
}

function fitMapBounds() {
    if (allMarkers.length > 0) {
        const group = new L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function convertDistance(km) {
    if (currentUnit === 'miles') {
        return (km * 0.621371).toFixed(3);
    }
    return km.toFixed(3);
}

function highlightPathFromDC(targetPoint, network) {
    if (targetPoint === network.dcOffice.description) {
        // Just highlight the DC marker
        const dcMarker = markers[network.dcOffice.description];
        if (dcMarker && dcMarker.getElement()) {
            dcMarker.getElement().style.filter = 'drop-shadow(0 0 8px #3b82f6)';
        }
        return;
    }
    
    // Find path from target to DC
    const path = findPathToDC(targetPoint, network);
    
    if (path.length > 0) {
        // Highlight connections in the path
        path.forEach(connection => {
            connection.line.setStyle({
                color: '#ef4444',
                weight: 5,
                opacity: 1
            });
        });
        
        // Highlight markers in the path
        const pathPoints = new Set();
        path.forEach(connection => {
            pathPoints.add(connection.from);
            pathPoints.add(connection.to);
        });
        
        pathPoints.forEach(pointName => {
            const marker = markers[pointName];
            if (marker && marker.getElement()) {
                marker.getElement().style.filter = 'drop-shadow(0 0 8px #ef4444)';
            }
        });
        
        currentHighlight = { path, points: pathPoints };
    }
}

function findPathToDC(targetPoint, network) {
    const path = [];
    let current = targetPoint;
    let visited = new Set();
    
    while (current && current !== network.dcOffice.description && !visited.has(current)) {
        visited.add(current);
        
        // Find the current point (joint or OLT)
        let currentPoint = network.joints.find(j => j.description === current);
        if (!currentPoint && current === network.olt.name) {
            currentPoint = network.olt;
        }
        
        if (!currentPoint) break;
        
        const connection = connections.find(c => 
            (c.from === currentPoint.connectedTo && c.to === current) ||
            (c.to === currentPoint.connectedTo && c.from === current)
        );
        
        if (connection) {
            path.unshift(connection);
        }
        
        current = currentPoint.connectedTo;
    }
    
    return path;
}

function clearHighlights() {
    if (currentHighlight) {
        // Reset connection styles
        if (currentHighlight.path) {
            currentHighlight.path.forEach(connection => {
                connection.line.setStyle({
                    color: '#3b82f6',
                    weight: 3,
                    opacity: 0.7
                });
            });
        }
        
        // Reset marker styles
        if (currentHighlight.points) {
            currentHighlight.points.forEach(pointName => {
                const marker = markers[pointName];
                if (marker && marker.getElement()) {
                    marker.getElement().style.filter = '';
                }
            });
        }
        
        currentHighlight = null;
    }
    
    // Also clear any other highlighted markers
    Object.values(markers).forEach(marker => {
        if (marker.getElement()) {
            marker.getElement().style.filter = '';
        }
    });
}

function setupEventListeners() {
    // Network selector - Fixed to ensure proper event handling
    const networkSelector = document.getElementById('networkSelector');
    networkSelector.addEventListener('change', function(e) {
        const selectedNetwork = e.target.value;
        console.log('Network selector changed to:', selectedNetwork);
        
        if (selectedNetwork && selectedNetwork !== currentNetwork) {
            currentNetwork = selectedNetwork;
            loadNetwork(currentNetwork);
        }
    });

    // Also handle click events on network selector to ensure selection works
    networkSelector.addEventListener('click', function(e) {
        // Allow natural selection behavior
        setTimeout(() => {
            if (this.value !== currentNetwork) {
                currentNetwork = this.value;
                loadNetwork(currentNetwork);
            }
        }, 50);
    });

    // Unit toggle
    document.getElementById('unitToggle').addEventListener('change', function() {
        currentUnit = this.value;
        updateAllDistanceDisplays();
    });

    // Map view toggle
    document.getElementById('mapViewToggle').addEventListener('change', function() {
        const view = this.value;
        
        map.eachLayer(function(layer) {
            if (layer === streetLayer || layer === satelliteLayer || layer === hybridLayer) {
                map.removeLayer(layer);
            }
        });
        
        if (view === 'satellite') {
            satelliteLayer.addTo(map);
        } else if (view === 'hybrid') {
            satelliteLayer.addTo(map);
            // Add street labels overlay for hybrid
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                opacity: 0.4
            }).addTo(map);
        } else {
            streetLayer.addTo(map);
        }
    });

    // Export buttons
    document.getElementById('exportBtn').addEventListener('click', () => exportDistanceData(false));
    document.getElementById('exportAllBtn').addEventListener('click', () => exportDistanceData(true));

    // Measuring tool
    document.getElementById('measureBtn').addEventListener('click', toggleMeasuringTool);

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('tableSearch').addEventListener('input', handleTableFilter);

    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    document.getElementById('distanceModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Map click for measuring
    map.on('click', handleMapClick);
}

function updateAllDistanceDisplays() {
    const network = networkData.networks[currentNetwork];
    
    // Update table
    populateDistanceTable(network);
    
    // Update summaries
    updateNetworkSummary(network);
    updateCombinedSummary();
    updateHeaderStats();
    
    // Update connection labels
    connections.forEach(connection => {
        const newLabel = `<div style="background: rgba(59, 130, 246, 0.9); color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500; white-space: nowrap;">${convertDistance(connection.distance)} ${currentUnit}</div>`;
        connection.label.setIcon(L.divIcon({
            className: 'distance-label',
            html: newLabel,
            iconSize: [0, 0]
        }));
    });

    // Update popups
    Object.values(markers).forEach(marker => {
        if (marker.pointData) {
            marker.closePopup();
        }
    });
}

function exportDistanceData(exportAll) {
    const btn = exportAll ? document.getElementById('exportAllBtn') : document.getElementById('exportBtn');
    btn.classList.add('btn--exporting');
    
    setTimeout(() => {
        let csvContent = "";
        
        if (exportAll) {
            csvContent = "Network,Point,Type,Connected To,Segment Distance (" + currentUnit + "),Total Distance (" + currentUnit + "),Latitude,Longitude\n";
            
            Object.values(networkData.networks).forEach(network => {
                // Add DC Office
                csvContent += `${network.mapName},${network.dcOffice.description},DC Office,,-,0,${network.dcOffice.latitude},${network.dcOffice.longitude}\n`;
                
                // Add joints
                network.joints.forEach(joint => {
                    csvContent += `${network.mapName},${joint.description},Network Joint,${joint.connectedTo},${convertDistance(joint.segmentDistance)},${convertDistance(joint.totalDistance)},${joint.latitude},${joint.longitude}\n`;
                });
                
                // Add OLT
                csvContent += `${network.mapName},${network.olt.name},OLT Terminal,${network.olt.connectedTo},${convertDistance(network.olt.segmentDistance)},${convertDistance(network.olt.totalDistance)},${network.olt.latitude},${network.olt.longitude}\n`;
            });
            
        } else {
            const network = networkData.networks[currentNetwork];
            csvContent = "Point,Type,Connected To,Segment Distance (" + currentUnit + "),Total Distance (" + currentUnit + "),Latitude,Longitude\n";
            
            // Add DC Office
            csvContent += `${network.dcOffice.description},DC Office,,-,0,${network.dcOffice.latitude},${network.dcOffice.longitude}\n`;
            
            // Add joints
            network.joints.forEach(joint => {
                csvContent += `${joint.description},Network Joint,${joint.connectedTo},${convertDistance(joint.segmentDistance)},${convertDistance(joint.totalDistance)},${joint.latitude},${joint.longitude}\n`;
            });
            
            // Add OLT
            csvContent += `${network.olt.name},OLT Terminal,${network.olt.connectedTo},${convertDistance(network.olt.segmentDistance)},${convertDistance(network.olt.totalDistance)},${network.olt.latitude},${network.olt.longitude}\n`;
        }
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const fileName = exportAll ? 
            `all_networks_${new Date().toISOString().split('T')[0]}.csv` : 
            `${networkData.networks[currentNetwork].mapName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        btn.classList.remove('btn--exporting');
    }, 500);
}

function toggleMeasuringTool() {
    isMetering = !isMetering;
    const btn = document.getElementById('measureBtn');
    
    if (isMetering) {
        btn.textContent = 'Exit Measuring Mode';
        btn.classList.remove('btn--secondary');
        btn.classList.add('btn--primary');
        document.body.classList.add('measuring-mode');
        meteringPoints = [];
        showModal();
        document.getElementById('calculatorResults').innerHTML = '<p>Click two points on the map to measure distance.</p>';
    } else {
        btn.textContent = 'Distance Measuring Tool';
        btn.classList.remove('btn--primary');
        btn.classList.add('btn--secondary');
        document.body.classList.remove('measuring-mode');
        clearMeasuringLine();
        closeModal();
    }
}

function handleMapClick(e) {
    if (!isMetering) return;
    
    meteringPoints.push(e.latlng);
    
    if (meteringPoints.length === 1) {
        document.getElementById('calculatorResults').innerHTML = '<p>Click a second point to complete the measurement.</p>';
    } else if (meteringPoints.length === 2) {
        const distance = meteringPoints[0].distanceTo(meteringPoints[1]) / 1000; // Convert to km
        const convertedDistance = convertDistance(distance);
        
        // Draw line
        clearMeasuringLine();
        meteringLine = L.polyline(meteringPoints, {
            color: '#ef4444',
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 5'
        }).addTo(map);
        
        document.getElementById('calculatorResults').innerHTML = `
            <h4>Distance Measurement</h4>
            <p><strong>Direct Distance:</strong> ${convertedDistance} ${currentUnit}</p>
            <p><strong>From:</strong> ${meteringPoints[0].lat.toFixed(6)}, ${meteringPoints[0].lng.toFixed(6)}</p>
            <p><strong>To:</strong> ${meteringPoints[1].lat.toFixed(6)}, ${meteringPoints[1].lng.toFixed(6)}</p>
            <p><em>Click anywhere to measure a new distance.</em></p>
        `;
        
        meteringPoints = [];
    }
}

function clearMeasuringLine() {
    if (meteringLine) {
        map.removeLayer(meteringLine);
        meteringLine = null;
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (query === '') {
        // Show all markers
        allMarkers.forEach(marker => {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
            if (marker.getElement()) {
                marker.getElement().style.filter = '';
            }
        });
        return;
    }
    
    let foundMarkers = [];
    
    allMarkers.forEach(marker => {
        const pointData = marker.pointData;
        if (pointData && pointData.name.toLowerCase().includes(query)) {
            foundMarkers.push(marker);
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
            // Highlight the found marker
            if (marker.getElement()) {
                marker.getElement().style.filter = 'drop-shadow(0 0 10px #3b82f6)';
            }
        } else {
            // Remove highlight
            if (marker.getElement()) {
                marker.getElement().style.filter = '';
            }
        }
    });
    
    if (foundMarkers.length > 0) {
        // Pan to first found marker
        map.panTo(foundMarkers[0].getLatLng());
        if (foundMarkers.length === 1) {
            foundMarkers[0].openPopup();
        }
    }
}

function handleTableFilter(e) {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#distanceTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function showModal() {
    document.getElementById('distanceModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('distanceModal').classList.add('hidden');
    if (isMetering) {
        toggleMeasuringTool();
    }
}