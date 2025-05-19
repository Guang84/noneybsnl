class MapManager {
    static EPSILON = 0.000001;

    constructor() {
        this.map = null;
        this.mode = 'pin';
        this.measurePoints = [];
        this.measureMarkers = [];
        this.measurePolylines = [];
        this.totalDistance = 0;
        this.markers = [];
        this.undoStack = [];
        this.redoStack = [];
        this.geocoder = new google.maps.Geocoder();
    }

    initMap() {
        if (!window.google || !google.maps) {
            alert('Google Maps failed to load. Please check your API key.');
            return;
        }

        this.map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: 24.857558, lng: 93.623283 },
            zoom: 14,
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

        this.setupEventListeners();
        this.loadSavedLocations();
    }

    setupEventListeners() {
        document.getElementById('pin-mode').addEventListener('click', () => this.setMode('pin'));
        document.getElementById('measure-mode').addEventListener('click', () => this.setMode('measure'));
        document.getElementById('area-mode').addEventListener('click', () => this.setMode('area'));

        document.getElementById('roadmap-style').addEventListener('click', () => this.setMapStyle('roadmap'));
        document.getElementById('satellite-style').addEventListener('click', () => this.setMapStyle('satellite'));
        document.getElementById('dark-style').addEventListener('click', () => this.setMapStyle('dark'));

        document.getElementById('import-file').addEventListener('change', (event) => this.importData(event));

        this.map.addListener('click', (event) => {
            if (this.mode === 'pin') {
                this.showPinModal(event.latLng);
            } else if (this.mode === 'measure') {
                this.addMeasurePoint(event.latLng);
            }
        });
    }

    setMode(mode) {
        this.mode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => 
            btn.classList.remove('active'));
        document.getElementById(`${mode}-mode`).classList.add('active');
    }

    setMapStyle(style) {
        let mapStyle = [];
        if (style === 'satellite') {
            this.map.setMapTypeId('satellite');
        } else if (style === 'dark') {
            mapStyle = [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
            ];
            this.map.setMapTypeId('roadmap');
        } else {
            this.map.setMapTypeId('roadmap');
        }
        this.map.setOptions({ styles: mapStyle });
        document.querySelectorAll('.style-btn').forEach(btn => 
            btn.classList.remove('active'));
        document.getElementById(`${style}-style`).classList.add('active');
    }

    addMeasurePoint(latLng) {
        const point = { lat: latLng.lat(), lng: latLng.lng() };
        
        const marker = new google.maps.Marker({
            position: latLng,
            map: this.map,
            label: (this.measurePoints.length + 1).toString(),
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#dc3545',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
            }
        });

        if (this.measurePoints.length > 0) {
            const prevPoint = this.measurePoints[this.measurePoints.length - 1];
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(prevPoint),
                latLng
            );

            const polyline = new google.maps.Polyline({
                path: [prevPoint, point],
                geodesic: true,
                strokeColor: '#dc3545',
                strokeOpacity: 0.7,
                strokeWeight: 3,
                map: this.map
            });

            this.measurePolylines.push(polyline);
            this.totalDistance += distance;
        }

        this.measurePoints.push(point);
        this.measureMarkers.push(marker);
        this.updateMeasurementDisplay();
    }

    // [Include all other methods from your original script.js]
    // Make sure to replace Leaflet-specific code with Google Maps equivalents
}

const mapManager = new MapManager();
window.initMap = () => mapManager.initMap();
document.addEventListener('DOMContentLoaded', () => {
    if (window.google && google.maps) mapManager.initMap();
});