document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const tasks = document.querySelectorAll('.task');

    // Webcam access
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error('Error accessing webcam:', err);
        });

    // Task toggle
    tasks.forEach(task => {
        task.addEventListener('click', () => {
            const circle = task.querySelector('.circle');
            circle.classList.toggle('checked');
        });
    });

    // Date and time update
    const datetime = document.getElementById('datetime');
    setInterval(() => {
        datetime.textContent = new Date().toLocaleString();
    }, 1000);

    let currentPos = null;
    let destinationPos = null;
    let routingControl = null;

    const compassDistanceEl = document.getElementById('compass-distance');

    const toRad = deg => deg * Math.PI / 180;
    const toDeg = rad => rad * 180 / Math.PI;

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000; // meters
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const bearingTo = (lat1, lon1, lat2, lon2) => {
        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δλ = toRad(lon2 - lon1);
        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        return (toDeg(Math.atan2(y, x)) + 360) % 360;
    };

    const formatDistance = meters => {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    };

    const bearingToCardinal = (deg) => {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(deg / 22.5) % 16;
        return directions[index];
    };

    const updateDirection = () => {
        if (!currentPos || !destinationPos) {
            if (compassDistanceEl) compassDistanceEl.textContent = '--';
            return;
        }
        const bearing = bearingTo(currentPos[0], currentPos[1], destinationPos[0], destinationPos[1]);
        const distance = haversineDistance(currentPos[0], currentPos[1], destinationPos[0], destinationPos[1]);
        setCompassHeading(bearing);

        if (compassDistanceEl) {
            const cardinal = bearingToCardinal(bearing);
            compassDistanceEl.textContent = `${cardinal} · ${formatDistance(distance)}`;
        }
    };

    // Initialize map
    const map = L.map('minimap', { zoomControl: false }).setView([51.505, -0.09], 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">Carto</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            currentPos = [lat, lng];
            map.setView([lat, lng], 16);
            L.marker([lat, lng]).addTo(map);
            updateDirection();
        });

        navigator.geolocation.watchPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            currentPos = [lat, lng];
            updateDirection();
        });
    }

    const compass = document.getElementById('compass');
    function setCompassHeading(deg) {
        if (!compass) return;
        // CSS rotate: 0deg = right, but compass bearing: 0deg = up
        // So subtract 90 to convert bearing to CSS rotation
        const cssRotation = (deg - 90 + 360) % 360;
        compass.style.setProperty('--heading', `${cssRotation}deg`);
    }

    const destinationInput = document.getElementById('destination');
    const destinationResults = document.getElementById('destination-results');
    let searchTimeout = null;

    const clearResults = () => {
        destinationResults.innerHTML = '';
        destinationResults.style.display = 'none';
    };

    const selectDestination = (name, lat, lng) => {
        destinationInput.value = name;
        destinationPos = [lat, lng];
        updateDirection();

        L.marker([lat, lng]).addTo(map).bindPopup(name).openPopup();
        map.setView([lat, lng], 16);

        if (currentPos) {
            if (routingControl) {
                map.removeControl(routingControl);
            }
            routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(currentPos[0], currentPos[1]),
                    L.latLng(lat, lng)
                ]
            }).addTo(map);
        }

        clearResults();
    };

    const showResults = (results) => {
        clearResults();
        if (!results || results.length === 0) return;

        results.slice(0, 5).forEach(item => {
            const option = document.createElement('div');
            option.className = 'destination-result';
            option.textContent = item.display_name;
            option.addEventListener('click', () => {
                selectDestination(item.display_name, parseFloat(item.lat), parseFloat(item.lon));
            });
            destinationResults.appendChild(option);
        });
        destinationResults.style.display = 'block';
    };

    const searchLocation = (query) => {
        if (!query) return;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                showResults(data);
            })
            .catch(err => console.error('Geocoding error:', err));
    };

    destinationInput.addEventListener('input', () => {
        const query = destinationInput.value.trim();
        clearTimeout(searchTimeout);
        if (!query) {
            clearResults();
            return;
        }
        searchTimeout = setTimeout(() => searchLocation(query), 250);
    });

    document.getElementById('search').addEventListener('click', () => {
        const query = destinationInput.value.trim();
        if (query) {
            searchLocation(query);
        }
    });

    document.addEventListener('click', (event) => {
        if (!destinationResults.contains(event.target) && event.target !== destinationInput) {
            clearResults();
        }
    });
});