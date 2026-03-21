document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('face-canvas');
    const ctx = canvas.getContext('2d');
    const tasks = document.querySelectorAll('.task');

    const setupCanvas = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
    };

    const drawFaceBox = (box) => {
        const x = box.x;
        const y = box.y;
        const width = box.width;
        const height = box.height;

        ctx.strokeStyle = '#ff003c';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = '#ff003c';
        ctx.font = 'bold 18px Anton, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('persoon', x + width / 2, y - 10);
    };

    const runDetectionLoop = async (detector) => {
        if (video.readyState !== 4) {
            requestAnimationFrame(() => runDetectionLoop(detector));
            return;
        }

        try {
            const detections = await detector.detect(video);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detections.length === 0) {
                // if none found, keep at least a hint box
                const w = canvas.width * 0.2;
                const h = canvas.height * 0.3;
                drawFaceBox({ x: (canvas.width - w)/2, y: (canvas.height - h)/2, width: w, height: h });
            } else {
                detections.forEach(item => drawFaceBox(item.boundingBox));
            }

        } catch (err) {
            console.error('Face detection error (FaceDetector):', err);
        }

        requestAnimationFrame(() => runDetectionLoop(detector));
    };

    const startFaceDetection = async () => {
        if (!('FaceDetector' in window)) {
            console.warn('FaceDetector not available; please use Chrome/Edge or a polyfill. Falling back to static frame.');
            return;
        }

        const faceDetector = new FaceDetector({ fastMode: true, maxDetectedFaces: 8 });
        runDetectionLoop(faceDetector);
    };

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            video.addEventListener('loadedmetadata', () => {
                setupCanvas();
                startFaceDetection();
            });
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

    // Task tracker functionality
    const trackerTasks = document.querySelectorAll('.tracker-task');
    trackerTasks.forEach(task => {
        task.addEventListener('click', () => {
            task.classList.toggle('completed');
        });
    });

    // Comic text badge functionality
    const comicText = document.getElementById('comic-text');
    const textBadge = document.getElementById('text-badge');
    const closeBtn = document.getElementById('close-text');

    // Badge click toggles popup visibility and hides badge
    textBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        comicText.classList.remove('hidden');
        textBadge.style.display = 'none';
    });

    // Close button hides popup and shows badge
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        comicText.classList.add('hidden');
        textBadge.style.display = 'flex';
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
